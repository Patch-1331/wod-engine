import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Exempts a route from ApiTokenGuard. Only for endpoints that must answer an
 * unauthenticated caller — Render's health check can't send headers.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
