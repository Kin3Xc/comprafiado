import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../config/env.js';

const ACCESS_TTL_SEC = 15 * 60; // 15 minutos
const REFRESH_TTL_SEC = 30 * 24 * 60 * 60; // 30 días

export interface AccessPayload {
  sub: string;
  rol: string;
}

export interface RefreshPayload {
  sub: string;
  tokenVersion: number;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL_SEC });
}

export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL_SEC });
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
}

const isProd = env.NODE_ENV === 'production';

export function setAuthCookies(
  res: Response,
  user: { id: string; rol: string; tokenVersion: number }
): void {
  const accessToken = signAccessToken({ sub: user.id, rol: user.rol });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: ACCESS_TTL_SEC * 1000,
    path: '/',
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: REFRESH_TTL_SEC * 1000,
    path: '/api/auth',
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/auth' });
}
