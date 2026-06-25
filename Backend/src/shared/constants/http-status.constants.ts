/**
 * HTTP Status Code Constants
 *
 * Rule: no magic numbers anywhere in the codebase.
 * `HTTP_STATUS.NOT_FOUND` is infinitely more readable than `404` inline.
 *
 * Professional practice: if you ever look at `res.status(403)` in a PR,
 * ask why it wasn't `HTTP_STATUS.FORBIDDEN`. The reviewer should also ask.
 * Magic numbers make code harder to search and understand at a glance.
 */
export const HTTP_STATUS = {
  // 2xx — Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 3xx — Redirection
  NOT_MODIFIED: 304,

  // 4xx — Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 5xx — Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
} as const;

// `as const` makes every value a literal type (200, 201, ...) not just `number`.
// This means TypeScript will warn you if you accidentally pass the wrong status code.
export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
