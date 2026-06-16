import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { renderBrandedEmail } from '../templates';

type MailPayload = {
  html: string;
  subject: string;
  text: string;
  to: string | string[];
};

type InvitationEmailRecipient = {
  email: string;
  fullName?: string;
  inviteLink?: string;
};

const fallbackSuperAdminEmail = 'menilevi0533011599@gmail.com';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromEmail: string;
  private readonly logoUrl: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const frontendOrigin = this.getFrontendOrigin();

    this.fromEmail = this.config.get<string>('SMTP_FROM') ?? 'Ishru <no-reply@ishru.local>';
    this.logoUrl = this.config.get<string>('MAIL_LOGO_URL') ?? `${frontendOrigin}/brand/ishru-logo.jpeg`;
    this.transporter = host && user && pass
      ? createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      })
      : null;
  }

  async sendAdminApprovalRequest(adminEmail: string) {
    const title = 'משתמש חדש ממתין לאישור';

    await this.send({
      to: this.getSuperAdminEmails(),
      subject: `אישרו - ${title}`,
      text: `משתמש חדש נרשם וממתין לאישור: ${adminEmail}`,
      html: renderBrandedEmail({
        logoUrl: this.logoUrl,
        title,
        body: [
          `המשתמש ${adminEmail} יצר חשבון חדש וממתין לאישור מנהל מערכת.`,
          'יש להיכנס למסך ניהול המערכת ולאשר אותו כדי שיוכל להתחבר.',
        ],
      }),
    });
  }

  async sendAdminApproved(adminEmail: string) {
    const title = 'החשבון שלך אושר';

    await this.send({
      to: adminEmail,
      subject: `אישרו - ${title}`,
      text: 'החשבון שלך באישרו אושר. אפשר להתחבר למערכת ולהתחיל לנהל אירועים.',
      html: renderBrandedEmail({
        action: { label: 'כניסה למערכת', url: this.getFrontendOrigin() },
        logoUrl: this.logoUrl,
        title,
        body: ['אפשר להתחבר עכשיו למערכת אישרו ולהתחיל לנהל אירועים, מוזמנים ואישורי הגעה.'],
      }),
    });
  }

  async sendPasswordReset(adminEmail: string, token: string) {
    const resetUrl = `${this.getFrontendOrigin()}/reset-password?token=${encodeURIComponent(token)}`;
    const title = 'איפוס סיסמה באישרו';

    await this.send({
      to: adminEmail,
      subject: `אישרו - ${title}`,
      text: `קיבלנו בקשה לאיפוס סיסמה. אפשר ליצור סיסמה חדשה בקישור הבא: ${resetUrl}`,
      html: renderBrandedEmail({
        action: { label: 'יצירת סיסמה חדשה', url: resetUrl },
        logoUrl: this.logoUrl,
        title,
        body: [
          'קיבלנו בקשה לאיפוס הסיסמה שלך.',
          'הקישור תקף ל-30 דקות. אם לא ביקשת איפוס סיסמה, אפשר להתעלם מהמייל.',
        ],
      }),
    });
  }

  async sendInvitationEmails(recipients: InvitationEmailRecipient[], message: string) {
    let sent = 0;
    const failed: Array<{ email: string; reason: string }> = [];

    for (const recipient of recipients) {
      const renderedMessage = this.renderInvitationMessage(message, recipient);

      try {
        await this.send({
          to: recipient.email,
          subject: 'אישרו - הזמנה לאירוע',
          text: renderedMessage,
          html: renderBrandedEmail({
            action: recipient.inviteLink ? { label: 'פתיחת ההזמנה', url: recipient.inviteLink } : undefined,
            logoUrl: this.logoUrl,
            title: 'הזמנה לאירוע',
            body: [renderedMessage],
          }),
        });
        sent += 1;
      } catch (cause) {
        failed.push({
          email: recipient.email,
          reason: cause instanceof Error ? cause.message : 'Unknown email error',
        });
      }
    }

    return {
      failed,
      sent,
    };
  }

  private async send(payload: MailPayload) {
    if (!this.transporter) {
      this.logger.log(`Email skipped: ${this.formatRecipients(payload.to)} ${payload.subject}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.fromEmail,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  }

  private renderInvitationMessage(message: string, recipient: InvitationEmailRecipient) {
    return message
      .replaceAll('{fullName}', recipient.fullName ?? '')
      .replaceAll('{inviteLink}', recipient.inviteLink ?? '');
  }

  private getFrontendOrigin() {
    return (this.config.get<string>('FRONTEND_ORIGIN') ?? 'http://localhost:4310').replace(/\/$/, '');
  }

  private getSuperAdminEmails() {
    const configuredEmails = this.config.get<string>('OWNER_EMAILS')
      ?.split(',')
      .map((email) => email.trim())
      .filter(Boolean) ?? [];

    return Array.from(new Set(configuredEmails.length ? configuredEmails : [fallbackSuperAdminEmail]));
  }

  private formatRecipients(recipients: string | string[]) {
    return Array.isArray(recipients) ? recipients.join(', ') : recipients;
  }
}
