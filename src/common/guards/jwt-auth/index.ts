import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRequiredJwtSecret } from '../../config';
import { AdminRole } from '../../../modules/admin/schemas';

type JwtPayload = {
  sub: string;
  email: string;
  role: AdminRole;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: { hostId: string; email: string; role: AdminRole };
    }>();
    const authorization = request.headers.authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      const jwt = new JwtService({
        secret: getRequiredJwtSecret(this.config),
      });
      const payload = await jwt.verifyAsync<JwtPayload>(token, { algorithms: ['HS256'] });
      request.user = {
        hostId: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authorization token');
    }
  }
}
