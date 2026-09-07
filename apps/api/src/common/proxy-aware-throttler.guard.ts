import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate limiting keyed on the real client, not on the proxy in front of it.
 *
 * Express's `req.ip` is the socket peer, which on Render is always the edge
 * that forwarded the request — so the stock guard would file every user of the
 * deployed app into a single bucket and throttle them as one. That is worse
 * than no limit: it turns a rate limiter into a shared outage.
 *
 * Preference order matters for trust, not just availability:
 *
 *  - `cf-connecting-ip` is written by the Cloudflare edge Render serves
 *    through, replacing anything the client sent, so it cannot be forged from
 *    outside. It is the only header here that is actually trustworthy.
 *  - the leftmost `x-forwarded-for` entry is the conventional client address
 *    but IS client-settable when no proxy overwrites it. It is a fallback for
 *    environments without the Cloudflare hop, where an attacker able to spoof
 *    it could evade the limit — acceptable because the header above covers the
 *    deployment that is actually exposed to the internet.
 *  - `req.ip` for local development, where neither header exists.
 */
@Injectable()
export class ProxyAwareThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const headers = (req.headers ?? {}) as Record<string, string | undefined>;

    const cloudflare = headers['cf-connecting-ip'];
    if (cloudflare) return Promise.resolve(cloudflare.trim());

    const forwarded = headers['x-forwarded-for'];
    if (forwarded) {
      const client = forwarded.split(',')[0]?.trim();
      if (client) return Promise.resolve(client);
    }

    return Promise.resolve((req.ip as string | undefined) ?? 'unknown');
  }
}
