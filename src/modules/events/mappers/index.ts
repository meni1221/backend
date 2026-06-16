import { Types } from 'mongoose';
import { Event } from '../schemas';

export type EventOverviewRecord = Event & {
  _id: Types.ObjectId;
};

export const toOwnerEvent = (event: EventOverviewRecord, totalGuests: number) => ({
  id: String(event._id),
  hostId: String(event.hostId),
  eventName: event.eventName,
  eventDate: event.eventDate,
  venueName: event.venueName,
  theme: event.theme,
  totalGuests,
});
