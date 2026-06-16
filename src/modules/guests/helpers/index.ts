import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

export const ensureGenderCountsFit = (maxAllowed: number, menCount: number, womenCount: number) => {
  if (menCount + womenCount > maxAllowed) {
    throw new BadRequestException(`Gender split exceeds max allowed guests (${maxAllowed})`);
  }
};

export const getInviteFilter = (inviteId: string, eventId?: string) => {
  if (!eventId) {
    return { inviteId };
  }

  if (!Types.ObjectId.isValid(eventId)) {
    return { inviteId: '__invalid__' };
  }

  return {
    eventId: new Types.ObjectId(eventId),
    inviteId,
  };
};
