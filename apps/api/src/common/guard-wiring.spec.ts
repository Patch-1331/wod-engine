import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ApiTokenGuard's own unit tests prove the token check. This proves it is
 * actually registered as a global guard — a wiring mistake there would leave
 * every route open while the unit tests still passed.
 *
 * PrismaService is stubbed so this needs no database; the requests under test
 * are rejected before any handler runs anyway.
 */
describe('ApiTokenGuard wiring', () => {
  let app: INestApplication<App>;
  const original = process.env.API_TOKEN;

  beforeAll(async () => {
    process.env.API_TOKEN = 'test-token';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        exercise: { findMany: jest.fn().mockResolvedValue([]) },
      })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env.API_TOKEN = original;
  });

  it('rejects an unauthenticated read', () => {
    return request(app.getHttpServer()).get('/exercises').expect(401);
  });

  it('rejects an unauthenticated write', () => {
    return request(app.getHttpServer()).post('/today/skip').expect(401);
  });

  it('rejects an unauthenticated delete', () => {
    return request(app.getHttpServer())
      .delete('/assignments/some-id/session')
      .expect(401);
  });

  it('rejects a wrong token', () => {
    return request(app.getHttpServer())
      .get('/exercises')
      .set('Authorization', 'Bearer wrong-token')
      .expect(401);
  });

  it('admits a correct token', () => {
    return request(app.getHttpServer())
      .get('/exercises')
      .set('Authorization', 'Bearer test-token')
      .expect(200);
  });

  it('leaves the health check reachable for Render', () => {
    return request(app.getHttpServer()).get('/').expect(200);
  });
});
