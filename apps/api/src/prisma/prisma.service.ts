import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma 7 no longer reads the connection string from the schema — the
 * datasource block carries only the provider, and the client is handed a
 * driver adapter instead (the CLI reads its own URL from prisma.config.ts).
 * Constructing without one throws at $connect, not at compile time, so the
 * wiring here is what actually reaches the database.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      // Fail here rather than at the first query: an API that starts without
      // a database only reports it once a request comes in.
      throw new Error('DATABASE_URL is not set');
    }
    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
