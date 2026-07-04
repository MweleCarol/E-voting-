/**
 * Validation Middleware — Zod Schema Factory
 *
 * Architecture pattern: Middleware Factory
 * Layer: Middleware (sits between Router and Controller)
 *
 * HOW IT WORKS:
 * `validate(schema)` returns a middleware function.
 * That middleware runs Zod's safeParse on the specified target (body/params/query).
 * On success, it replaces the raw value with the parsed (type-coerced, stripped) value.
 * On failure, it throws a ValidationError with structured field errors.
 *
 * WHY replace req.body with schema.parse() output?
 * Zod does two things during parsing:
 *   1. Validates — rejects data that doesn't match the schema
 *   2. Transforms — strips unknown fields, coerces types (e.g. string "42" → number 42)
 *
 * If you validate but don't replace req.body, the controller still receives
 * the raw, untransformed, possibly-extra-fields payload. Always use the
 * parsed output.
 *
 * USAGE in a router:
 *
 *   import { z } from 'zod';
 *   import { validate } from '@middleware/validate.middleware';
 *
 *   const LoginSchema = z.object({
 *     email: z.string().email(),
 *     password: z.string().min(8),
 *   });
 *
 *   router.post('/login',
 *     validate({ body: LoginSchema }),
 *     asyncHandler(authController.login)
 *   );
 *
 * The controller then receives req.body typed as z.infer<typeof LoginSchema>.
 *
 * SECURITY NOTE:
 * Validation middleware is your first line of defence against malformed input.
 * It runs before your service layer, ensuring only well-formed data reaches
 * your business logic. This prevents an entire class of bugs where business
 * logic has to defensively check for undefined fields.
 */

import type { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '@shared/errors/errors';

interface ValidationTargets {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: ValidationTargets) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};

    // Validate and replace each target independently
    const targets = [
      { key: 'body', schema: schemas.body, source: req.body },
      { key: 'params', schema: schemas.params, source: req.params },
      { key: 'query', schema: schemas.query, source: req.query },
    ] as const;

    for (const { key, schema, source } of targets) {
      if (!schema) continue;

      const result = schema.safeParse(source);

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors as Record<
          string,
          string[] | undefined
        >;
        for (const [field, messages] of Object.entries(fieldErrors)) {
          if (messages && messages.length > 0) {
            errors[`${key}.${field}`] = messages;
          }
        }
      } else if (key === 'query') {
        // Express 5: req.query is a getter-only property on the prototype.
        // Plain assignment throws; redefining it as an own, writable property
        // on this request object overrides the getter for this request only.
        Object.defineProperty(req, 'query', {
          value: result.data,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else {
        (req as unknown as Record<string, unknown>)[key] = result.data;
      }
    }

    // If any target had errors, fail the entire request
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    next();
  };
}
