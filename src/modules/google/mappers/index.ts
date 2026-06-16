import { GooglePerson } from '../types';

export const mapGooglePeopleToContacts = (people: GooglePerson[]) =>
  people
    .flatMap((person) => {
      const emails = person.emailAddresses ?? [];
      const phones = person.phoneNumbers ?? [];
      const fullName = person.names?.[0]?.displayName;

      if (phones.length) {
        return phones.map((phone) => ({
          email: emails[0]?.value,
          fullName,
          phoneNumber: phone.value ?? '',
        }));
      }

      return emails.map((email) => ({
        email: email.value,
        fullName,
        phoneNumber: '',
      }));
    })
    .filter((contact) => Boolean(contact.phoneNumber || contact.email));
