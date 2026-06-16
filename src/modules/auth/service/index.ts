import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Model } from 'mongoose';
import { isOwnerEmail } from '../../admin/helpers';
import { Admin, AdminAccountStatus, AdminDocument, AdminRole } from '../../admin/schemas';
import { AppLoggerService } from '../../logs/service';
import { LogLevel, LogSource } from '../../logs/schemas';
import { MailService } from '../../mail/service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from '../dto';
import { hashResetToken, isDuplicateMongoKeyError, normalizeEmail } from '../helpers';
import { toAuthSession } from '../mappers';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly logger: AppLoggerService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedEmail = normalizeEmail(dto.email);
    const existingAdmin = await this.adminModel.findOne({ email: normalizedEmail }).select('_id').lean().exec();

    if (existingAdmin) {
      throw new ConflictException('Email is already used by another admin');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role = isOwnerEmail(this.config, normalizedEmail) ? AdminRole.OWNER : AdminRole.HOST;
    const accountStatus = role === AdminRole.OWNER ? AdminAccountStatus.APPROVED : AdminAccountStatus.PENDING_APPROVAL;
    const admin = await this.createAdminAccount({
      accountStatus,
      email: normalizedEmail,
      passwordHash,
      role,
    });

    if (role === AdminRole.OWNER) {
      void this.logger.write({
        category: 'auth.register.owner',
        hostId: admin.id,
        level: LogLevel.INFO,
        message: 'Super admin account registered',
        source: LogSource.BACKEND,
        userEmail: admin.email,
      });
      return this.createSession(admin.id, admin.email, admin.role, admin);
    }

    try {
      await this.mailService.sendAdminApprovalRequest(admin.email);
    } catch (cause) {
      void this.logger.write({
        category: 'auth.register.approval_email_failed',
        hostId: admin.id,
        level: LogLevel.WARN,
        message: 'Failed to send admin approval request email',
        meta: { cause: cause instanceof Error ? cause.message : 'unknown' },
        source: LogSource.BACKEND,
        userEmail: admin.email,
      });
    }
    void this.logger.write({
      category: 'auth.register.pending_approval',
      hostId: admin.id,
      level: LogLevel.INFO,
      message: 'Host admin registered and is pending approval',
      source: LogSource.BACKEND,
      userEmail: admin.email,
    });

    return {
      pendingApproval: true,
      email: admin.email,
    };
  }

  async login(dto: LoginDto) {
    const normalizedEmail = normalizeEmail(dto.email);
    const admin = await this.adminModel
      .findOne({ email: normalizedEmail })
      .select('+passwordHash email fullName phoneNumber profileCompleted onboardingCompleted onboardingSkipped role accountStatus')
      .exec();
    const isValid = admin ? await bcrypt.compare(dto.password, admin.passwordHash) : false;

    if (!admin || !isValid) {
      void this.logger.write({
        category: 'auth.login.failed',
        level: LogLevel.WARN,
        message: 'Admin login failed',
        meta: { email: normalizedEmail },
        source: LogSource.BACKEND,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const expectedRole = isOwnerEmail(this.config, admin.email) ? AdminRole.OWNER : admin.role;
    const expectedStatus = expectedRole === AdminRole.OWNER ? AdminAccountStatus.APPROVED : admin.accountStatus;
    if (admin.role !== expectedRole || admin.accountStatus !== expectedStatus) {
      await this.adminModel.findByIdAndUpdate(admin.id, { role: expectedRole, accountStatus: expectedStatus }).exec();
    }

    if (expectedStatus !== AdminAccountStatus.APPROVED) {
      void this.logger.write({
        category: 'auth.login.blocked',
        hostId: admin.id,
        level: LogLevel.WARN,
        message: 'Admin login blocked because account is not approved',
        source: LogSource.BACKEND,
        userEmail: admin.email,
      });
      throw new ForbiddenException('Admin account is waiting for super admin approval');
    }

    void this.logger.write({
      category: 'auth.login.success',
      hostId: admin.id,
      level: LogLevel.INFO,
      message: 'Admin login succeeded',
      source: LogSource.BACKEND,
      userEmail: admin.email,
    });

    return this.createSession(admin.id, admin.email, expectedRole, admin);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const admin = await this.adminModel.findOne({ email: normalizeEmail(dto.email) }).select('_id email').exec();

    if (!admin) {
      return { ok: true };
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await this.adminModel.findByIdAndUpdate(admin.id, {
      passwordResetExpiresAt: expiresAt,
      passwordResetTokenHash: tokenHash,
    }).exec();

    try {
      await this.mailService.sendPasswordReset(admin.email, token);
    } catch (cause) {
      void this.logger.write({
        category: 'auth.password_reset.email_failed',
        hostId: admin.id,
        level: LogLevel.WARN,
        message: 'Failed to send password reset email',
        meta: { cause: cause instanceof Error ? cause.message : 'unknown' },
        source: LogSource.BACKEND,
        userEmail: admin.email,
      });
    }

    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashResetToken(dto.token);
    const admin = await this.adminModel
      .findOne({
        passwordResetExpiresAt: { $gt: new Date() },
        passwordResetTokenHash: tokenHash,
      })
      .select('+passwordHash +passwordResetTokenHash +passwordResetExpiresAt email role accountStatus fullName phoneNumber profileCompleted onboardingCompleted onboardingSkipped')
      .exec();

    if (!admin) {
      throw new BadRequestException('Password reset link is invalid or expired');
    }

    admin.passwordHash = await bcrypt.hash(dto.password, 12);
    admin.passwordResetTokenHash = null;
    admin.passwordResetExpiresAt = null;
    await admin.save();

    void this.logger.write({
      category: 'auth.password_reset.success',
      hostId: admin.id,
      level: LogLevel.INFO,
      message: 'Admin password was reset by email token',
      source: LogSource.BACKEND,
      userEmail: admin.email,
    });

    return this.createSession(admin.id, admin.email, admin.role, admin);
  }

  private createSession(hostId: string, email: string, role: AdminRole, profile?: { fullName?: string; phoneNumber?: string; profileCompleted?: boolean; onboardingCompleted?: boolean; onboardingSkipped?: boolean }) {
    return toAuthSession({
      accessToken: this.jwtService.sign({ sub: hostId, email, role }),
      email,
      hostId,
      profile,
      role,
    });
  }

  private async createAdminAccount(payload: {
    accountStatus: AdminAccountStatus;
    email: string;
    passwordHash: string;
    role: AdminRole;
  }) {
    try {
      return await this.adminModel.create(payload);
    } catch (cause) {
      if (isDuplicateMongoKeyError(cause)) {
        throw new ConflictException('Email is already used by another admin');
      }

      throw cause;
    }
  }
}
