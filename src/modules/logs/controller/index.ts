import { Body, Controller, ForbiddenException, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentHost } from '../../../common/decorators/current-host';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth';
import { CreateFrontendLogDto, LogQueryDto } from '../dto';
import { AdminRole } from '../../admin/schemas';
import { AppLoggerService } from '../service';

@ApiTags('Logs')
@ApiBearerAuth('access-token')
@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private readonly logger: AppLoggerService) {}

  @Get()
  find(@CurrentHost() host: { role?: AdminRole }, @Query() query: LogQueryDto) {
    if (host.role !== AdminRole.OWNER) {
      throw new ForbiddenException('Owner access is required');
    }

    return this.logger.find(query);
  }

  @Post('frontend')
  writeFrontendLog(
    @CurrentHost() host: { hostId: string; email?: string },
    @Body() dto: CreateFrontendLogDto,
  ) {
    return this.logger.writeFrontend(host, dto);
  }
}
