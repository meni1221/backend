import { Types } from 'mongoose';
import { Event } from '../../events/schemas';
import { Guest } from '../schemas';

export type PublicGuestRecord = Pick<Guest, 'eventId' | 'fullName' | 'inviteId' | 'language' | 'maxAllowed' | 'rsvpDetails' | 'status'> & {
  _id: Types.ObjectId;
};

export const toPublicInvite = (event: Event & { _id: Types.ObjectId }, guest: PublicGuestRecord) => ({
  event: {
    _id: event._id,
    adminPhoneNumber: event.adminPhoneNumber,
    address: event.address,
    bitLink: event.bitLink,
    eventDate: event.eventDate,
    eventName: event.eventName,
    invitationMessage: event.invitationMessage,
    invitationTemplateKey: event.invitationTemplateKey,
    invitationTitle: event.invitationTitle,
    theme: event.theme,
    venueName: event.venueName,
    wazeLink: event.wazeLink,
  },
  guest: {
    _id: guest._id,
    eventId: guest.eventId,
    fullName: guest.fullName,
    inviteId: guest.inviteId,
    language: guest.language,
    maxAllowed: guest.maxAllowed,
    rsvpDetails: guest.rsvpDetails,
    status: guest.status,
  },
});
