import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toObjectId } from '../../../common/mongo';
import { CreateEventDto } from '../dto/create-event';
import { UpdateEventDto } from '../dto/update-event';
import { Event, EventDocument } from '../schemas';

@Injectable()
export class EventsService {
  constructor(@InjectModel(Event.name) private readonly eventModel: Model<EventDocument>) {}

  async create(hostId: string, dto: CreateEventDto) {
    return this.eventModel.create({
      ...dto,
      hostId: toObjectId(hostId, 'host id'),
      eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
    });
  }

  async findAll(hostId: string) {
    return this.eventModel
      .find({ hostId: toObjectId(hostId, 'host id') })
      .sort({ eventDate: -1, createdAt: -1 })
      .lean()
      .exec();
  }

  async update(hostId: string, eventId: string, dto: UpdateEventDto) {
    const event = await this.eventModel
      .findOneAndUpdate(
        { _id: eventId, hostId: toObjectId(hostId, 'host id') },
        {
          ...dto,
          eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!event) {
      throw new NotFoundException('Event was not found');
    }

    return event;
  }

  async remove(hostId: string, eventId: string) {
    const event = await this.eventModel
      .findOneAndDelete({ _id: eventId, hostId: toObjectId(hostId, 'host id') })
      .lean()
      .exec();

    if (!event) {
      throw new NotFoundException('Event was not found');
    }

    return event;
  }
}
