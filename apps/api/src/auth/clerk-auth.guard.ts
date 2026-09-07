import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../common/public.decorator';
import { webOrigins } from '../common/origins';
import { UserProvisioningService } from './user-provisioning.service';

/** Where the verified Clerk user id is stashed for @CurrentUser() to read. */
export const AUTH_USER_ID = 'authUserId';

/**
 * Verifies the Clerk session token on every non-public route and records who
 * the caller is. Replaces the shared-secret ApiTokenGuard: a static token
 * shipped to a browser is readable by anyone who loads the page, whereas a
 * Clerk session token is short-lived and identifies one user, which is what
 * per-user data scoping needs.
 *
 * Verification is networkless — the JWT is checked against Clerk's public
 * keys, so this costs no round trip per request.
 *
 * `authorizedParties` is what stops a token minted for some other frontend on
 * the same Clerk instance from being spent here. Clerk skips the check
 * entirely when the option is absent, so leaving it unset silently accepts any
 * token the instance ever issued, whatever origin asked for it.
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly provisioning: UserProvisioningService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let userId: string;
    try {
      const claims = await verifyToken(header.slice('Bearer '.length), {
        secretKey: process.env.CLERK_SECRET_KEY,
        // Same allowlist CORS uses: the origins that are allowed to hold a
        // token for this API are exactly the ones allowed to read its
        // responses.
        authorizedParties: webOrigins(),
      });
      // `sub` is Clerk's user id and is what User.id stores.
      userId = claims.sub;
    } catch {
      // Deliberately opaque: an expired token and a forged one should look
      // identical from outside.
      throw new UnauthorizedException('Invalid session token');
    }

    if (!userId) throw new UnauthorizedException('Token carries no subject');

    await this.provisioning.ensure(userId);
    (request as Request & Record<string, unknown>)[AUTH_USER_ID] = userId;
    return true;
  }
}
