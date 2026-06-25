/**
 * AppError — Base class for all application errors in SEVS.
 *
 * Architecture pattern: Typed Error Hierarchy
 * Layer: Shared Infrastructure (used by every layer above it)
 *
 * WHY extend Error instead of using plain objects?
 * - Stack traces are captured automatically by the V8 engine at throw site
 * - `instanceof` checks work correctly across module boundaries
 * - Express's global error handler receives it as the `err` parameter in
 *   4-argument middleware: (err, req, res, next)
 *
 * WHY the `isOperational` flag?
 * Every error in a production system falls into one of two categories:
 *
 *   1. Operational errors (isOperational = true)
 *      Expected failures that are part of normal system behaviour.
 *      Examples: wrong password, election not found, duplicate vote attempt.
 *      The system knows how to handle these — return a clean JSON response.
 *      These should NOT page an on-call engineer at 3am.
 *
 *   2. Programmer errors (isOperational = false)
 *      Bugs. Things that should never happen if the code is correct.
 *      Examples: TypeError, undefined is not a function, forgot to await a Promise.
 *      These indicate a defect. In production, return a generic 500.
 *      In development, crash loudly so you find them immediately.
 *
 * The global error handler uses this flag to decide its behaviour.
 * This is the single most important concept in Node.js error handling.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    isOperational: boolean = true // Default: operational. Bugs must explicitly set false.
  ) {
    super(message);

    // Restore prototype chain — required when extending built-in classes in TypeScript.
    // Without this, `instanceof AppError` returns false after transpilation to ES5.
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

    // Capture stack trace, excluding the constructor call from it.
    // This makes the stack trace point to the throw site, not to AppError.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Type guard — narrows `unknown` to `AppError`.
 *
 * Use this in catch blocks when you need to distinguish your own errors
 * from third-party errors (Prisma errors, network errors, etc.).
 *
 * Pattern:
 *   catch (err) {
 *     if (isAppError(err)) { ... }   // your error, handle it
 *     else { throw err; }            // unknown error, re-throw to global handler
 *   }
 */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
