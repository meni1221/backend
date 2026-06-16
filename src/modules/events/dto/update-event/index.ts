import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from '../create-event';

export class UpdateEventDto extends PartialType(CreateEventDto) {}
