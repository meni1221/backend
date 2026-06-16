import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth';
import { MailController } from './controller';
import { MailService } from './service';

@Module({
  controllers: [MailController],
  providers: [MailService, JwtAuthGuard],
  exports: [MailService],
})
export class MailModule {}
