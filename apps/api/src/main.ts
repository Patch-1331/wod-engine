import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NoContentInterceptor } from './common/no-content.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  app.useGlobalInterceptors(new NoContentInterceptor());
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
