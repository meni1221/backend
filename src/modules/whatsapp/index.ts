import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../../common/guards/jwt-auth';
import { Admin, AdminSchema } from '../admin/schemas';
import { WhatsappController } from './controller';
import { WhatsappGateway } from './gateway';
import { WhatsappManagerService } from './manager';
import { WhatsappMessageQueueService } from './message-queue';

@Module({
  imports: [MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }])],
  controllers: [WhatsappController],
  providers: [WhatsappManagerService, WhatsappGateway, WhatsappMessageQueueService, JwtAuthGuard],
  exports: [WhatsappManagerService],
})
export class WhatsappModule {}
