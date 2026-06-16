import { createHash } from 'crypto';

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const hashResetToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export const isDuplicateMongoKeyError = (cause: unknown) =>
  typeof cause === 'object' &&
  cause !== null &&
  'code' in cause &&
  (cause as { code?: number }).code === 11000;
