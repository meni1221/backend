import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { GuestStatus } from '../../schemas';

export class UpdateRsvpDto {
  @ApiProperty({ enum: [GuestStatus.CONFIRMED, GuestStatus.MAYBE, GuestStatus.DECLINED], example: GuestStatus.CONFIRMED })
  @IsIn([GuestStatus.CONFIRMED, GuestStatus.MAYBE, GuestStatus.DECLINED])
  status!: GuestStatus.CONFIRMED | GuestStatus.MAYBE | GuestStatus.DECLINED;

  @ApiPropertyOptional({ example: 2, minimum: 0, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  adults?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  children?: number;

  @ApiPropertyOptional({ example: 'צריכים כיסא תינוק', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
