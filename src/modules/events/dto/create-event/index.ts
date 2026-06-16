import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { EventSeatingMode, EventTheme } from '../../schemas';

export class CreateEventDto {
  @ApiProperty({ example: 'ברית לאריאל', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  eventName!: string;

  @ApiPropertyOptional({ example: '2026-07-12T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ example: 'אולם האורנים', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  venueName?: string;

  @ApiPropertyOptional({ example: 'הרצל 10, הרצליה', maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  @ApiPropertyOptional({ example: 'https://waze.com/ul?q=הרצל%2010%20הרצליה' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  wazeLink?: string;

  @ApiPropertyOptional({ example: 'https://www.bitpay.co.il/app/share-info?i=example' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  bitLink?: string;

  @ApiPropertyOptional({ example: '0533011599', maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  adminPhoneNumber?: string;

  @ApiPropertyOptional({ enum: EventTheme, example: EventTheme.BRIT })
  @IsOptional()
  @IsEnum(EventTheme)
  theme?: EventTheme;

  @ApiPropertyOptional({ enum: EventSeatingMode, example: EventSeatingMode.MIXED })
  @IsOptional()
  @IsEnum(EventSeatingMode)
  seatingMode?: EventSeatingMode;

  @ApiPropertyOptional({ example: 'classic', maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  invitationTemplateKey?: string;

  @ApiPropertyOptional({ example: 'ברית לאריאל', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  invitationTitle?: string;

  @ApiPropertyOptional({ example: 'נשמח לראותכם איתנו באירוע.', maxLength: 1200 })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  invitationMessage?: string;
}
