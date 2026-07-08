import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

/** Valida req.body con un schema Zod; ZodError lo captura el error handler. */
export function validate(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}
