import { Body, Controller, ForbiddenException, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StatusCodes } from 'http-status-codes';
import { CurrentHost } from '../../../common/decorators/current-host';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth';
import { AdminRole } from '../../admin/schemas';
import { SendWhatsappBatchDto } from '../dto';
import { WhatsappMessageQueueService } from '../message-queue';
import { WhatsappManagerService } from '../manager';

@ApiTags('WhatsApp')
@ApiBearerAuth('access-token')
@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
  constructor(
    private readonly whatsappManager: WhatsappManagerService,
    private readonly messageQueue: WhatsappMessageQueueService,
  ) {}

  @Post('connect')
  @HttpCode(StatusCodes.OK)
  async connect(@CurrentHost() host: { hostId: string; role?: AdminRole }) {
    this.ensureHostRole(host);
    return this.whatsappManager.ensureClient(host.hostId);
  }

  @Get('qr')
  async getQr(@CurrentHost() host: { hostId: string; role?: AdminRole }) {
    this.ensureHostRole(host);
    return this.whatsappManager.getQrCode(host.hostId);
  }

  @Get('status')
  async getStatus(@CurrentHost() host: { hostId: string; role?: AdminRole }) {
    this.ensureHostRole(host);
    return this.whatsappManager.getStatus(host.hostId);
  }

  @Post('disconnect')
  @HttpCode(StatusCodes.OK)
  async disconnect(@CurrentHost() host: { hostId: string; role?: AdminRole }) {
    this.ensureHostRole(host);
    await this.whatsappManager.disconnect(host.hostId);
    return { status: 'DISCONNECTED' };
  }

  @Post('send-batch')
  @HttpCode(StatusCodes.ACCEPTED)
  async sendBatch(@CurrentHost() host: { hostId: string; role?: AdminRole }, @Body() dto: SendWhatsappBatchDto) {
    this.ensureHostRole(host);
    return this.messageQueue.enqueueBatch(host.hostId, dto);
  }

  private ensureHostRole(host: { role?: AdminRole }) {
    if (host.role === AdminRole.OWNER) {
      throw new ForbiddenException('Owner users cannot access host WhatsApp sessions');
    }
  }
}
