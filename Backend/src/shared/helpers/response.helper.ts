/**
 * Response Helper — Standard Envelope Factory
 *
 * Architecture pattern: Response Shaping
 * Layer: Shared Infrastructure (used by controllers only)
 *
 * Every HTTP response from SEVS uses one of two shapes:
 *
 * Success:
 *   { "success": true, "data": { ... }, "message": "..." }
 *
 * Error (handled by errorHandler middleware — not here):
 *   { "success": false, "message": "...", "errorCode": "...", "statusCode": 404 }
 *
 * WHY a helper instead of calling res.json() directly in controllers?
 * 1. Consistency: If you call res.json() directly, one controller might send
 *    { data: ... } and another sends { result: ... }. The frontend breaks.
 * 2. Single change point: If the envelope format ever changes (e.g. adding
 *    a request ID for tracing), you change it here and it propagates everywhere.
 * 3. Type safety: The generic `<T>` ensures the data shape is typed at the
 *    call site, not just `any`.
 *
 * Rule: Controllers call sendSuccess(). They never call res.json() directly.
 * Error responses are never called from controllers — errors are thrown and
 * the global error handler formats them.
 */

import type { Response } from 'express';
import { HTTP_STATUS } from '@shared/constants/http-status.constants';

/**
 * Sends a standardised success response.
 *
 * @param res     - Express Response object
 * @param data    - The payload to send (typed)
 * @param message - Human-readable success message
 * @param statusCode - HTTP status code (defaults to 200)
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = HTTP_STATUS.OK
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Sends a standardised error response.
 *
 * NOTE: This function exists for edge cases where you need to send an error
 * response without throwing (e.g. streaming endpoints). In normal application
 * code, you should THROW an AppError subclass and let the error handler format
 * it. Do not call sendError() directly from business logic.
 */
export function sendError(
  res: Response,
  message: string,
  errorCode: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
): void {
  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
  });
}
