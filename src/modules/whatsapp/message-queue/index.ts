import { Injectable, Logger } from '@nestjs/common';
import { SendWhatsappBatchDto, WhatsappRecipientDto } from '../dto';
import { WhatsappManagerService } from '../manager';

type SendBatchResult = {
  failed: Array<{ phoneNumber: string; reason: string }>;
  queued: number;
  sent: number;
};

type MissingWhatsappRecipient = {
  fullName?: string;
  phoneNumber: string;
};

@Injectable()
export class WhatsappMessageQueueService {
  private readonly logger = new Logger(WhatsappMessageQueueService.name);
  private readonly hostQueues = new Map<string, Promise<void>>();

  constructor(private readonly whatsappManager: WhatsappManagerService) {}

  async enqueueBatch(hostId: string, dto: SendWhatsappBatchDto): Promise<{ missingWhatsapp: MissingWhatsappRecipient[]; queued: number }> {
    const availability = await this.filterWhatsappRecipients(hostId, dto.recipients);
    const sendableDto = {
      ...dto,
      recipients: availability.available,
    };
    const queue = this.hostQueues.get(hostId) ?? Promise.resolve();
    const nextQueue = queue
      .catch(() => undefined)
      .then(() => this.sendBatch(hostId, sendableDto))
      .then((result) => {
        this.logger.log(`WhatsApp batch finished for host ${hostId}: ${result.sent}/${result.queued} sent`);
      });

    this.hostQueues.set(hostId, nextQueue);

    return {
      missingWhatsapp: availability.missing,
      queued: sendableDto.recipients.length,
    };
  }

  private async filterWhatsappRecipients(hostId: string, recipients: WhatsappRecipientDto[]) {
    const available: WhatsappRecipientDto[] = [];
    const missing: MissingWhatsappRecipient[] = [];

    for (const recipient of recipients) {
      const hasWhatsapp = await this.whatsappManager.hasWhatsapp(hostId, recipient.phoneNumber);

      if (hasWhatsapp) {
        available.push(recipient);
      } else {
        missing.push({
          fullName: recipient.fullName,
          phoneNumber: recipient.phoneNumber,
        });
      }
    }

    return { available, missing };
  }

  private async sendBatch(hostId: string, dto: SendWhatsappBatchDto): Promise<SendBatchResult> {
    const minDelayMs = dto.minDelayMs ?? 9000;
    const maxDelayMs = Math.max(dto.maxDelayMs ?? 18000, minDelayMs + 1000);
    const failed: SendBatchResult['failed'] = [];
    let sent = 0;

    for (const [index, recipient] of dto.recipients.entries()) {
      try {
        const message = this.renderMessage(dto.message, recipient);
        await this.whatsappManager.sendMessage(hostId, recipient.phoneNumber, message);
        sent += 1;
      } catch (error) {
        failed.push({
          phoneNumber: recipient.phoneNumber,
          reason: error instanceof Error ? error.message : 'Unknown send error',
        });
      }

      const isLastMessage = index === dto.recipients.length - 1;
      if (!isLastMessage) {
        await this.sleep(this.randomDelay(minDelayMs, maxDelayMs));
      }
    }

    return {
      failed,
      queued: dto.recipients.length,
      sent,
    };
  }

  private renderMessage(message: string, recipient: WhatsappRecipientDto) {
    return message
      .replaceAll('{fullName}', recipient.fullName ?? '')
      .replaceAll('{phoneNumber}', recipient.phoneNumber)
      .replaceAll('{inviteLink}', recipient.inviteLink ?? '');
  }

  private randomDelay(minDelayMs: number, maxDelayMs: number) {
    return Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
  }

  private sleep(delayMs: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }
}
