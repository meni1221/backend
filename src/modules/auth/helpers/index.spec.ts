import { hashResetToken, isDuplicateMongoKeyError, normalizeEmail } from './index';

describe('auth helpers', () => {
  it('normalizes email before auth operations', () => {
    expect(normalizeEmail('  HOST@Example.COM  ')).toBe('host@example.com');
  });

  it('hashes reset tokens consistently', () => {
    expect(hashResetToken('token')).toBe(hashResetToken('token'));
    expect(hashResetToken('token')).not.toBe('token');
  });

  it('detects duplicate mongo key errors', () => {
    expect(isDuplicateMongoKeyError({ code: 11000 })).toBe(true);
    expect(isDuplicateMongoKeyError({ code: 123 })).toBe(false);
  });
});
