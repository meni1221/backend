import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import { LogLevel, LogSource } from '../schemas';

export class CreateFrontendLogDto {
  @ApiProperty({ enum: LogLevel, example: LogLevel.INFO })
  @IsEnum(LogLevel)
  level!: LogLevel;

  @ApiProperty({ example: 'component.lifecycle' })
  @IsString()
  category!: string;

  @ApiProperty({ example: 'Dashboard mounted' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ example: 'req_123' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional({ example: '/events' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ example: { componentName: 'Dashboard' } })
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

export class LogQueryDto {
  @ApiPropertyOptional({ enum: LogLevel })
  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @ApiPropertyOptional({ enum: LogSource })
  @IsOptional()
  @IsEnum(LogSource)
  source?: LogSource;

  @ApiPropertyOptional({ example: 'auth.login.success' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: '665f...' })
  @IsOptional()
  @IsString()
  hostId?: string;

  @ApiPropertyOptional({ example: 'req_123' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional({ example: 'login' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30T23:59:59.999Z' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ example: 100, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number;
}
