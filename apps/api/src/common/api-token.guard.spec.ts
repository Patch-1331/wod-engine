import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiTokenGuard } from './api-token.guard';

function makeContext(headers: Record<string, string>) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function makeGuard(isPublic = false) {
  const reflector = {
    getAllAndOverride: () => isPublic,
  } as unknown as Reflector;
  return new ApiTokenGuard(reflector);
}

describe('ApiTokenGuard', () => {
  const original = process.env.API_TOKEN;

  beforeEach(() => {
    process.env.API_TOKEN = 'correct-horse-battery-staple';
  });

  afterAll(() => {
    process.env.API_TOKEN = original;
  });

  it('allows a matching bearer token', () => {
    const context = makeContext({
      authorization: 'Bearer correct-horse-battery-staple',
    });
    expect(makeGuard().canActivate(context)).toBe(true);
  });

  it('allows a matching x-api-token header', () => {
    const context = makeContext({
      'x-api-token': 'correct-horse-battery-staple',
    });
    expect(makeGuard().canActivate(context)).toBe(true);
  });

  it('rejects a request with no credentials', () => {
    expect(() => makeGuard().canActivate(makeContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a wrong token of the same length', () => {
    const context = makeContext({
      authorization: 'Bearer correct-horse-battery-stapleX'.slice(0, 37),
    });
    expect(() => makeGuard().canActivate(context)).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token that is a prefix of the real one', () => {
    const context = makeContext({ authorization: 'Bearer correct-horse' });
    expect(() => makeGuard().canActivate(context)).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an empty x-api-token rather than comparing against an empty secret', () => {
    process.env.API_TOKEN = '';
    const context = makeContext({ 'x-api-token': '' });
    expect(() => makeGuard().canActivate(context)).toThrow(
      UnauthorizedException,
    );
  });

  it('lets a @Public() route through without a token', () => {
    expect(makeGuard(true).canActivate(makeContext({}))).toBe(true);
  });
});
