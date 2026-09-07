import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NoContentInterceptor } from './common/no-content.interceptor';

async function bootstrap() {
  // Fail fast rather than start unauthenticated: ClerkAuthGuard verifies every
  // non-public route against this key, so an unset one would mean a service
  // that rejects everything with no obvious signal.
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error(
      'CLERK_SECRET_KEY is not set. See apps/api/.env.example — the API ' +
        'refuses to start without it so it can never serve unauthenticated ' +
        'traffic.',
    );
  }

  const app = await NestFactory.create(AppModule);
  // Comma-separated allowlist. Defaults to the Vite dev server; set
  // WEB_ORIGIN to the deployed web origin once the frontend ships.
  // `||` not `??`: Render stores an unfilled sync:false variable as an empty
  // string, and that should fall back to the default rather than becoming an
  // empty allowlist that rejects every origin.
  const origins = (process.env.WEB_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins });
  app.useGlobalInterceptors(new NoContentInterceptor());
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
