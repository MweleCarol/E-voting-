/**
 * asyncHandler — Async Route Handler Wrapper
 *
 * Architecture pattern: Higher-Order Function / Error Forwarding
 * Layer: Middleware
 *
 * THE PROBLEM:
 * Express 4 does not catch errors thrown inside async functions automatically.
 * Without this wrapper, every single controller method needs this boilerplate:
 *
 *   router.get('/election/:id', async (req, res, next) => {
 *     try {
 *       const result = await electionService.getById(req.params.id);
 *       sendSuccess(res, result);
 *     } catch (err) {
 *       next(err); // must manually forward to error handler
 *     }
 *   });
 *
 * That try/catch adds noise to every handler. Across 40+ routes, it's
 * hundreds of lines of identical boilerplate that obscures the real logic.
 *
 * THE SOLUTION:
 * asyncHandler wraps the handler in a Promise and attaches a .catch(next).
 * If the async handler throws (or returns a rejected Promise), Express's
 * next(err) is called automatically, routing the error to the global
 * error handler middleware.
 *
 *   router.get('/election/:id', asyncHandler(async (req, res) => {
 *     const result = await electionService.getById(req.params.id);
 *     sendSuccess(res, result); // throw anything and it's handled
 *   }));
 *
 * NOTE on Express 5:
 * Express 5 (which this project uses) handles async errors natively.
 * However, asyncHandler is still useful because:
 * 1. It documents intent — wrapping makes the async nature explicit
 * 2. It provides a single interception point if logging needs to be added
 * 3. It ensures compatibility if the project ever downgrades to Express 4
 *
 * 
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Execute the handler and pipe any rejection to next()
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
