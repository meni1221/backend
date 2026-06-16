import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { strongPasswordRegex } from '../../auth/dto';

export class UpdateAdminProfileDto {
  @ApiProperty({ example: 'host@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'מני לוי', minLength: 2, maxLength: 80 })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[\p{L}\s'"-]+$/u)
  fullName!: string;

  @ApiProperty({ example: '0533011599' })
  @IsString()
  @Matches(/^(?:0\d{8,9}|\+972\d{8,9}|972\d{8,9})$/)
  phoneNumber!: string;

  @ApiPropertyOptional({ example: 'מני' })
  @IsOptional()
  @IsString()
  displayName?: string;
}

export class UpdateAdminOnboardingDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  skipped?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPass!123' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'NewStrongPass!123', minLength: 10 })
  @IsString()
  @MinLength(10)
  @Matches(strongPasswordRegex)
  newPassword!: string;
}
