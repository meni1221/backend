import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { catchError, tap, throwError } from 'rxjs';
import { AppLoggerService } from '../service';
import { LogLevel, LogSource } from '../schemas';

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
  method: string;
  originalUrl?: string;
  url?: string;
  user?: { hostId?: string; email?: string };
};

type ResponseLike = {
  setHeader: (key: string, value: string) => void;
  statusCode: number;
};

export const getRequestId = (headers: Record<string, string | string[] | undefined>) => {
  const header = headers['x-request-id'];
  const value = Array.isArray(header) ? header[0] : header;
  return value || randomUUID();
};

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestLike>();
    const response = context.switchToHttp().getResponse<ResponseLike>();
    const requestId = getRequestId(request.headers);
    const startedAt = Date.now();
    const path = request.originalUrl ?? request.url ?? '';
    response.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      tap(() => {
        void this.logger.write({
          category: 'http.request',
          durationMs: Date.now() - startedAt,
          hostId: request.user?.hostId,
          level: response.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO,
          message: `${request.method} ${path} ${response.statusCode}`,
          method: request.method,
          path,
          requestId,
          source: LogSource.BACKEND,
          statusCode: response.statusCode,
          userEmail: request.user?.email,
        });
      }),
      catchError((cause: unknown) => {
        const statusCode = getStatusCode(cause);
        void this.logger.write({
          category: 'http.error',
          durationMs: Date.now() - startedAt,
          hostId: request.user?.hostId,
          level: statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARN,
          message: `${request.method} ${path} failed with ${statusCode}`,
          meta: {
            error: cause instanceof Error ? cause.message : 'unknown',
          },
          method: request.method,
          path,
          requestId,
          source: LogSource.BACKEND,
          statusCode,
          userEmail: request.user?.email,
        });

        return throwError(() => cause);
      }),
    );
  }
}

const getStatusCode = (cause: unknown) => {
  if (typeof cause === 'object' && cause && 'getStatus' in cause) {
    const status = (cause as { getStatus: () => number }).getStatus();
    return Number.isFinite(status) ? status : 500;
  }

  return 500;
};
