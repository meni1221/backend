import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class DemoHostGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: { hostId: string };
    }>();
    const header = request.headers['x-host-id'];
    const hostId = Array.isArray(header) ? header[0] : header;

    if (!hostId) {
      throw new UnauthorizedException('Missing x-host-id header. Replace DemoHostGuard with JWT auth in production.');
    }

    request.user = { hostId };
    return true;
  }
}
