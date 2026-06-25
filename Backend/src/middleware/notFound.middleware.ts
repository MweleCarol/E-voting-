/**
 * 404 Not Found Middleware
 *
 * Layer: Middleware (registered AFTER all routes, BEFORE error handler)
 *
 * WHY this exists:
 * If a request reaches this middleware, no route matched it.
 * We throw a NotFoundError, which flows to the error handler for consistent formatting.
 *
 * Registration order in app.ts matters:
 *   1. All routes
 *   2. This notFound middleware        ← catches unmatched routes
 *   3. The errorHandler middleware     ← formats errors thrown by notFound (and everything else)
 *
 * Do NOT put the error handler before notFound, or unmatched routes
 * will return an empty response instead of a 404 JSON.
 */

import type { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '@shared/errors/errors';

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
}
