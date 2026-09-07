/**
 * The web origins this API trusts, from the comma-separated WEB_ORIGIN
 * allowlist. Two things read it and they must agree:
 *
 *  - CORS, which decides whose browser may read a response.
 *  - ClerkAuthGuard's `authorizedParties`, which decides which frontend a
 *    session token may have been minted for.
 *
 * Keeping one source for both means adding a new frontend origin can't
 * half-work — a value that passes CORS but fails token verification (or the
 * reverse) is the confusing failure this avoids.
 *
 * `||` not `??`: Render stores an unfilled sync:false variable as an empty
 * string, and that should fall back to the dev default rather than becoming an
 * empty allowlist that rejects everything.
 */
export function webOrigins(): string[] {
  return (process.env.WEB_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
