import 'dotenv/config';

import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 removed `url` from the schema's datasource block: the CLI reads
 * the connection string from here instead, and the client gets it through a
 * driver adapter (see src/prisma/prisma.service.ts). One schema no longer
 * doubles as the place both of them look.
 *
 * `seed` moved here too, from the `prisma` key in package.json, which v7 no
 * longer reads.
 *
 * The dotenv import is load-bearing for local development: v7 stopped
 * auto-loading .env once a config file is present, and `env()` throws rather
 * than returning undefined. On Render DATABASE_URL arrives from the service
 * environment, so nothing is read from a file there.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    // Deliberately process.env rather than the `env()` helper: that helper
    // throws when the variable is missing, and `prisma generate` does not
    // need a connection string. CI generates the client without a database,
    // so `env()` there fails the build. Undefined is a valid `url`, and the
    // commands that do need it (migrate, seed) still report it clearly.
    url: process.env.DATABASE_URL,
  },
});
