import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AUTH_USER_ID } from './clerk-auth.guard';

/**
 * The verified Clerk user id for this request, set by ClerkAuthGuard. Only
 * valid on routes the guard covers — a @Public() route has no user, so this
 * throws rather than handing a handler an empty string it might scope a query
 * with.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & Record<string, unknown>>();
    const userId = request[AUTH_USER_ID];
    if (typeof userId !== 'string' || userId === '') {
      throw new Error(
        'CurrentUser used on a route without ClerkAuthGuard — every data route must be guarded.',
      );
    }
    return userId;
  },
);
