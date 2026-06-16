import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

export const isValidObjectId = (value: string) => Types.ObjectId.isValid(value);

export const toObjectId = (value: string, label = 'id') => {
  if (!isValidObjectId(value)) {
    throw new BadRequestException(`Invalid ${label}`);
  }

  return new Types.ObjectId(value);
};
