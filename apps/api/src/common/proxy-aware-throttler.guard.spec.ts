import { ProxyAwareThrottlerGuard } from './proxy-aware-throttler.guard';

/**
 * The tracker decides whose budget a request spends. Getting it wrong is not a
 * subtle bug: keying on the proxy files every user of the deployed app into
 * one bucket, so the rate limiter throttles the whole userbase at once.
 */
describe('ProxyAwareThrottlerGuard tracker', () => {
  // getTracker is protected; this suite is the reason it exists.
  const track = (headers: Record<string, string>, ip?: string) =>
    (
      ProxyAwareThrottlerGuard.prototype as unknown as {
        getTracker(req: Record<string, unknown>): Promise<string>;
      }
    ).getTracker({ headers, ip });

  it('prefers the Cloudflare header, the only one an outsider cannot forge', async () => {
    await expect(
      track({
        'cf-connecting-ip': '203.0.113.7',
        'x-forwarded-for': '198.51.100.1, 203.0.113.7',
      }),
    ).resolves.toBe('203.0.113.7');
  });

  it('falls back to the leftmost forwarded-for entry', async () => {
    await expect(
      track({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1' }),
    ).resolves.toBe('198.51.100.1');
  });

  it('falls back to the socket address in local development', async () => {
    await expect(track({}, '127.0.0.1')).resolves.toBe('127.0.0.1');
  });

  it('never returns empty, which would merge unrelated callers into one bucket', async () => {
    await expect(track({})).resolves.toBe('unknown');
    await expect(track({ 'x-forwarded-for': '' }, '127.0.0.1')).resolves.toBe(
      '127.0.0.1',
    );
  });
});
