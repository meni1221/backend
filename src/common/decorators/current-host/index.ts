import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminRole } from '../../../modules/admin/schemas';

export type AuthenticatedHost = {
  hostId: string;
  email?: string;
  role?: AdminRole;
};

export const CurrentHost = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedHost => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedHost }>();
    if (!request.user?.hostId) {
      throw new Error('CurrentHost requires an auth guard that attaches user.hostId');
    }

    return request.user;
  },
);
