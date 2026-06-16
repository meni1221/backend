import { ConfigService } from '@nestjs/config';

export const normalizeAdminPhone = (phoneNumber: string) => {
  const normalizedPhone = phoneNumber.replace(/[-\s()]/g, '');

  if (normalizedPhone.startsWith('+972')) {
    return `0${normalizedPhone.slice(4)}`;
  }

  if (normalizedPhone.startsWith('972')) {
    return `0${normalizedPhone.slice(3)}`;
  }

  return normalizedPhone;
};

export const isOwnerEmail = (config: ConfigService, email: string) =>
  (config.get<string>('OWNER_EMAILS') ?? '')
    .split(',')
    .map((ownerEmail) => ownerEmail.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase());
