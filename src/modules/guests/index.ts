import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GuestsController } from './controller';
import { Event, EventSchema } from '../events/schemas';
import { Guest, GuestSchema } from './schemas';
import { GuestsService } from './service';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Event.name, schema: EventSchema },
    { name: Guest.name, schema: GuestSchema },
  ])],
  controllers: [GuestsController],
  providers: [GuestsService],
  exports: [MongooseModule],
})
export class GuestsModule {}
