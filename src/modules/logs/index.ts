import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../../common/guards/jwt-auth';
import { LogsController } from './controller';
import { RequestLoggingInterceptor } from './interceptor';
import { SystemLog, SystemLogSchema } from './schemas';
import { AppLoggerService } from './service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: SystemLog.name, schema: SystemLogSchema }]),
  ],
  controllers: [LogsController],
  providers: [
    AppLoggerService,
    JwtAuthGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
  exports: [AppLoggerService],
})
export class LogsModule {}
