import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEmail, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class InvitationEmailRecipientDto {
  @ApiProperty({ example: 'guest@example.com', maxLength: 180 })
  @IsEmail()
  @MaxLength(180)
  email!: string;

  @ApiPropertyOptional({ example: 'Dana Cohen', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ example: 'http://localhost:4310/invite/eventId/inviteId', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  inviteLink?: string;
}

export class SendInvitationEmailBatchDto {
  @ApiProperty({ type: [InvitationEmailRecipientDto], maxItems: 250 })
  @IsArray()
  @ArrayMaxSize(250)
  @ValidateNested({ each: true })
  @Type(() => InvitationEmailRecipientDto)
  recipients!: InvitationEmailRecipientDto[];

  @ApiProperty({ example: 'Hi {fullName}, here is your invite: {inviteLink}', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  message!: string;
}
