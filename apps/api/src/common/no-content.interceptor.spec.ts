import { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { NoContentInterceptor } from './no-content.interceptor';

function makeContext(initialStatus: number) {
  const statusCalls: number[] = [];
  const res = {
    statusCode: initialStatus,
    status(code: number): void {
      statusCalls.push(code);
      res.statusCode = code;
    },
  };
  const context = {
    switchToHttp: () => ({ getResponse: () => res }),
  } as unknown as ExecutionContext;
  return { context, res, statusCalls };
}

async function run(value: unknown, initialStatus = 200) {
  const { context, res, statusCalls } = makeContext(initialStatus);
  const next: CallHandler = { handle: () => of(value) };
  const result = await firstValueFrom(
    new NoContentInterceptor().intercept(context, next),
  );
  return { result, res, statusCalls };
}

describe('NoContentInterceptor', () => {
  it('sends 204 when the handler returns null', async () => {
    const { statusCalls } = await run(null);
    expect(statusCalls).toEqual([204]);
  });

  it('sends 204 when the handler returns undefined', async () => {
    const { statusCalls } = await run(undefined);
    expect(statusCalls).toEqual([204]);
  });

  it('leaves the status alone for a real payload', async () => {
    const log = { id: 'log-1', resultValue: '5+3' };
    const { result, statusCalls } = await run(log);
    expect(result).toBe(log);
    expect(statusCalls).toEqual([]);
  });

  it('does not override a non-2xx status the handler already chose', async () => {
    const { res, statusCalls } = await run(null, 304);
    expect(statusCalls).toEqual([]);
    expect(res.statusCode).toBe(304);
  });
});
