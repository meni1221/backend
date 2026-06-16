import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class WhatsappRecipientDto {
  @ApiProperty({ example: '0533011599', maxLength: 32 })
  @IsString()
  @MaxLength(32)
  phoneNumber!: string;

  @ApiPropertyOptional({ example: 'דנה כהן', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ example: 'http://localhost:4310/invite/665f1a2b3c4d5e6f7a8b9c0d/inv_dana_001', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  inviteLink?: string;
}

export class SendWhatsappBatchDto {
  @ApiProperty({ type: [WhatsappRecipientDto], maxItems: 250 })
  @IsArray()
  @ArrayMaxSize(250)
  @ValidateNested({ each: true })
  @Type(() => WhatsappRecipientDto)
  recipients!: WhatsappRecipientDto[];

  @ApiProperty({ example: 'שלום {fullName}, הנה הקישור האישי שלך: {inviteLink}', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  message!: string;

  @ApiPropertyOptional({ example: 9000, minimum: 4000, maximum: 120000 })
  @IsOptional()
  @IsInt()
  @Min(4000)
  @Max(120000)
  minDelayMs?: number;

  @ApiPropertyOptional({ example: 18000, minimum: 6000, maximum: 180000 })
  @IsOptional()
  @IsInt()
  @Min(6000)
  @Max(180000)
  maxDelayMs?: number;
}
