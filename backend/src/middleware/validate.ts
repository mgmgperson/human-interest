import type { Request, Response, NextFunction } from 'express';
import { type ZodType, ZodError } from 'zod';

/**
 * Returns an Express middleware that validates req.body against the given Zod schema.
 * Responds with 400 and formatted field errors if validation fails.
 */
export function validate<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Zod v4 uses .issues instead of .errors
      const errors = (result.error as ZodError).issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    // Replace req.body with the parsed (and type-coerced) value
    req.body = result.data;
    next();
  };
}
