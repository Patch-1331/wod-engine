import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NoContentInterceptor } from './common/no-content.interceptor';

async function bootstrap() {
  // Fail fast rather than start unauthenticated: ApiTokenGuard gates every
  // non-public route on this value, so an unset one would mean a service that
  // rejects everything (or, worse if the guard were ever relaxed, serves
  // everything) with no obvious signal.
  if (!process.env.API_TOKEN) {
    throw new Error(
      'API_TOKEN is not set. See apps/api/.env.example — the API refuses to ' +
        'start without it so it can never serve unauthenticated traffic.',
    );
  }

  const app = await NestFactory.create(AppModule);
  // Comma-separated allowlist. Defaults to the Vite dev server; set
  // WEB_ORIGIN to the deployed web origin once the frontend ships.
  const origins = (process.env.WEB_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins });
  app.useGlobalInterceptors(new NoContentInterceptor());
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
