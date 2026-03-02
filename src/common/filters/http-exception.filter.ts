import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * ===== GLOBAL EXCEPTION FILTER =====
 * Catches all exceptions and returns standardized error responses
 * 
 * Response format:
 * {
 *   statusCode: 400,
 *   message: "Error message",
 *   timestamp: "2026-03-02T...",
 *   path: "/api/v1/auth/register"
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const response = exceptionResponse as Record<string, any>;
        message = response.message || message;
        details = response.details || undefined;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error('Unhandled exception:', exception);
    }

    const responsePayload = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(details && { details }),
    };

    response.status(status).json(responsePayload);
  }
}
