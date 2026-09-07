import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Shared-secret gate for the whole API. v1 is single-user (see the User stub
 * in schema.prisma), so there are no accounts to authenticate against — but
 * once deployed the service is internet-facing, and every write endpoint
 * would otherwise be open to anyone who finds the hostname.
 *
 * The token is read from API_TOKEN, which main.ts requires at boot, so a
 * missing value stops the process rather than silently serving unauthenticated.
 */
@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const presented = readToken(request);
    if (
      presented === null ||
      !matches(presented, process.env.API_TOKEN ?? '')
    ) {
      throw new UnauthorizedException('Missing or invalid API token');
    }
    return true;
  }
}

/** Accepts `Authorization: Bearer <token>` or `X-API-Token: <token>`. */
function readToken(request: Request): string | null {
  const header = request.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }
  const custom = request.headers['x-api-token'];
  if (typeof custom === 'string' && custom !== '') return custom;
  return null;
}

/**
 * Length is compared first because timingSafeEqual throws on a mismatch, and
 * it leaks only the token's length rather than its contents.
 */
function matches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
