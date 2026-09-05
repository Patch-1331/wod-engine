import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';

/**
 * Endpoints that model "absent" as a `null` return value (a log or session that
 * hasn't been created yet) would otherwise serialize as `200` with an empty
 * body, which no HTTP client can parse as JSON. Send `204 No Content` instead so
 * the absence is explicit.
 */
@Injectable()
export class NoContentInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (value === null || value === undefined) {
          const res = context.switchToHttp().getResponse<Response>();
          if (res.statusCode >= 200 && res.statusCode < 300) {
            res.status(204);
          }
        }
        return value;
      }),
    );
  }
}
