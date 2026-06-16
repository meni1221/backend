import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const getRequiredConfig = (config: ConfigService, key: string) => {
  const value = config.get<string>(key)?.trim();
  if (!value) {
    throw new InternalServerErrorException(`${key} is not configured`);
  }

  return value;
};

export const getRequiredJwtSecret = (config: ConfigService) => {
  const secret = getRequiredConfig(config, 'JWT_SECRET');
  if (secret === 'replace-me-in-production' || secret === 'change-this-secret') {
    throw new InternalServerErrorException('JWT_SECRET must be changed before the server can start');
  }

  return secret;
};
