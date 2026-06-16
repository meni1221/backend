import { Controller, Get, HttpCode, Post, Query, Redirect, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StatusCodes } from 'http-status-codes';
import { CurrentHost } from '../../../common/decorators/current-host';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth';
import { GoogleService } from '../service';

@ApiTags('Google')
@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  getStatus(@CurrentHost() host: { hostId: string }) {
    return this.googleService.getStatus(host.hostId);
  }

  @Get('connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  connect(@CurrentHost() host: { hostId: string }) {
    return this.googleService.createAuthUrl(host.hostId);
  }

  @Get('contacts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  getContacts(@CurrentHost() host: { hostId: string }) {
    return this.googleService.getContacts(host.hostId);
  }

  @Post('disconnect')
  @HttpCode(StatusCodes.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  disconnect(@CurrentHost() host: { hostId: string }) {
    return this.googleService.disconnect(host.hostId);
  }

  @Get('callback')
  @Redirect()
  async callback(@Query('code') code?: string, @Query('state') state?: string) {
    const redirectUrl = await this.googleService.handleCallback(code, state);
    return { url: `${redirectUrl}?google=connected` };
  }
}
