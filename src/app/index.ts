import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../modules/admin';
import { AuthModule } from '../modules/auth';
import { EventsModule } from '../modules/events';
import { GuestsModule } from '../modules/guests';
import { GoogleModule } from '../modules/google';
import { LogsModule } from '../modules/logs';
import { WhatsappModule } from '../modules/whatsapp';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI') ?? 'mongodb://127.0.0.1:27017/ishru',
      }),
    }),
    LogsModule,
    AdminModule,
    AuthModule,
    EventsModule,
    GuestsModule,
    GoogleModule,
    WhatsappModule,
  ],
})
export class AppModule {}
