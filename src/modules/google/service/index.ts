import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { getRequiredJwtSecret } from '../../../common/config';
import { Admin, AdminDocument } from '../../admin/schemas';
import { googleScopes } from '../constants';
import { mapGooglePeopleToContacts } from '../mappers';
import { GoogleOAuthState, GooglePeopleResponse, GoogleTokenResponse, GoogleUserInfoResponse } from '../types';

@Injectable()
export class GoogleService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async getStatus(hostId: string) {
    const admin = await this.adminModel.findById(hostId).select('googleConnection').exec();
    if (!admin) {
      throw new NotFoundException('Host admin was not found');
    }

    return {
      connected: Boolean(admin.googleConnection?.refreshToken),
      googleAccountEmail: admin.googleConnection?.googleAccountEmail,
      connectedAt: admin.googleConnection?.connectedAt,
    };
  }

  createAuthUrl(hostId: string) {
    const clientId = this.getRequiredConfig('GOOGLE_CLIENT_ID');
    const redirectUri = this.getRedirectUri();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: googleScopes.join(' '),
      state: this.createSignedState(hostId),
    });

    return {
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }

  async handleCallback(code: string | undefined, state: string | undefined) {
    if (!code || !state) {
      throw new BadRequestException('Missing Google OAuth code or state');
    }

    const tokenResponse = await this.exchangeCode(code);
    if (!tokenResponse.refresh_token) {
      throw new BadRequestException('Google did not return a refresh token. Disconnect and approve consent again.');
    }

    const googleAccountEmail = tokenResponse.access_token
      ? await this.getGoogleAccountEmail(tokenResponse.access_token)
      : undefined;

    const oauthState = await this.verifySignedState(state);

    await this.adminModel
      .findByIdAndUpdate(oauthState.hostId, {
        googleConnection: {
          googleAccountEmail,
          refreshToken: tokenResponse.refresh_token,
          scopes: tokenResponse.scope?.split(' ') ?? googleScopes,
          connectedAt: new Date(),
        },
      })
      .exec();

    return this.config.get<string>('FRONTEND_ORIGIN') ?? 'http://localhost:4310';
  }

  async disconnect(hostId: string) {
    await this.adminModel.findByIdAndUpdate(hostId, { googleConnection: null }).exec();
    return { connected: false };
  }

  async getContacts(hostId: string) {
    const admin = await this.adminModel.findById(hostId).select('googleConnection').exec();
    const refreshToken = admin?.googleConnection?.refreshToken;
    if (!refreshToken) {
      return { contacts: [] };
    }

    const accessToken = await this.refreshAccessToken(refreshToken);
    const response = await fetch(
      'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses&pageSize=500',
      { headers: { authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      throw new BadRequestException(await response.text());
    }

    const data = (await response.json()) as GooglePeopleResponse;
    const contacts = mapGooglePeopleToContacts(data.connections ?? []);

    return { contacts };
  }

  private async exchangeCode(code: string): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      code,
      client_id: this.getRequiredConfig('GOOGLE_CLIENT_ID'),
      client_secret: this.getRequiredConfig('GOOGLE_CLIENT_SECRET'),
      redirect_uri: this.getRedirectUri(),
      grant_type: 'authorization_code',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      throw new BadRequestException(await response.text());
    }

    return response.json() as Promise<GoogleTokenResponse>;
  }

  private async getGoogleAccountEmail(accessToken: string) {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as GoogleUserInfoResponse;
    return data.email;
  }

  private async refreshAccessToken(refreshToken: string) {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.getRequiredConfig('GOOGLE_CLIENT_ID'),
      client_secret: this.getRequiredConfig('GOOGLE_CLIENT_SECRET'),
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      throw new BadRequestException(await response.text());
    }

    const data = (await response.json()) as GoogleTokenResponse;
    if (!data.access_token) {
      throw new BadRequestException('Google did not return an access token');
    }

    return data.access_token;
  }

  private getRedirectUri() {
    return this.config.get<string>('GOOGLE_REDIRECT_URI') ?? 'http://localhost:3000/api/google/callback';
  }

  private createSignedState(hostId: string) {
    return this.jwt.sign(
      {
        hostId,
        nonce: randomUUID(),
        purpose: 'google_oauth',
      } satisfies GoogleOAuthState,
      {
        expiresIn: '10m',
        secret: getRequiredJwtSecret(this.config),
      },
    );
  }

  private async verifySignedState(state: string) {
    try {
      const payload = await this.jwt.verifyAsync<GoogleOAuthState>(state, {
        secret: getRequiredJwtSecret(this.config),
      });

      if (payload.purpose !== 'google_oauth' || !payload.hostId || !payload.nonce) {
        throw new Error('Invalid Google OAuth state payload');
      }

      return payload;
    } catch {
      throw new BadRequestException('Invalid or expired Google OAuth state');
    }
  }

  private getRequiredConfig(key: string) {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new BadRequestException(`${key} is not configured`);
    }

    return value;
  }
}
