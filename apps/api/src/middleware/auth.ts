import type { Request, RequestHandler } from 'express';
import { verifyAccessToken, type AccessPayload } from '../lib/tokens.js';
import { HttpError } from './error-handler.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- patrón oficial de @types/express
  namespace Express {
    interface Request {
      auth?: AccessPayload;
    }
  }
}

function extractToken(req: Request): string | undefined {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.access_token;
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);

  return undefined;
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw new HttpError(401, 'No autenticado');

  try {
    req.auth = verifyAccessToken(token);
  } catch {
    throw new HttpError(401, 'Sesión expirada o inválida');
  }
  next();
};

export function requireRole(rol: string): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) throw new HttpError(401, 'No autenticado');
    if (req.auth.rol !== rol) throw new HttpError(403, 'No autorizado');
    next();
  };
}
