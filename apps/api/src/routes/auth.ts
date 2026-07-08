import { createHash, randomBytes } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '@comprafiado/shared';
import { User, toPublicUser } from '../models/user.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error-handler.js';
import { setAuthCookies, clearAuthCookies, verifyRefreshToken } from '../lib/tokens.js';
import { sendMail } from '../lib/mailer.js';
import { env } from '../config/env.js';

export const authRouter = Router();

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

/** Límite estricto para endpoints sensibles a fuerza bruta. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, intenta más tarde' },
});

authRouter.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  const { nombre, apellidos, email, password } = req.body as RegisterInput;

  const exists = await User.findOne({ email }).lean();
  if (exists) throw new HttpError(409, 'Ya existe una cuenta con este correo');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ nombre, apellidos, email, passwordHash });

  setAuthCookies(res, { id: String(user._id), rol: user.rol!, tokenVersion: user.tokenVersion! });
  res.status(201).json({ user: toPublicUser(user) });
});

authRouter.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }

  setAuthCookies(res, { id: String(user._id), rol: user.rol!, tokenVersion: user.tokenVersion! });
  res.json({ user: toPublicUser(user) });
});

authRouter.post('/refresh', async (req, res) => {
  const token = (req.cookies as Record<string, string> | undefined)?.refresh_token;
  if (!token) throw new HttpError(401, 'No autenticado');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new HttpError(401, 'Sesión expirada');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    clearAuthCookies(res);
    throw new HttpError(401, 'Sesión revocada');
  }

  setAuthCookies(res, { id: String(user._id), rol: user.rol!, tokenVersion: user.tokenVersion! });
  res.json({ user: toPublicUser(user) });
});

authRouter.post('/logout', (_req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

/** Cierra sesión en todos los dispositivos invalidando los refresh tokens. */
authRouter.post('/logout-all', requireAuth, async (req, res) => {
  await User.findByIdAndUpdate(req.auth!.sub, { $inc: { tokenVersion: 1 } });
  clearAuthCookies(res);
  res.json({ ok: true });
});

authRouter.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  async (req, res) => {
    const { email } = req.body as ForgotPasswordInput;

    const user = await User.findOne({ email });
    // Respuesta idéntica exista o no la cuenta — no revelar correos registrados.
    if (user) {
      const rawToken = randomBytes(32).toString('hex');
      user.set({
        resetPasswordTokenHash: createHash('sha256').update(rawToken).digest('hex'),
        resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      });
      await user.save();

      const url = `${env.WEB_URL}/restablecer?token=${rawToken}&email=${encodeURIComponent(email)}`;
      await sendMail({
        to: email,
        subject: 'Restablece tu contraseña — CompraFiado',
        html: `<p>Hola ${user.nombre},</p>
<p>Recibimos una solicitud para restablecer tu contraseña. El enlace vence en 1 hora:</p>
<p><a href="${url}">Restablecer contraseña</a></p>
<p>Si no fuiste tú, ignora este correo.</p>`,
      });
    }

    res.json({ ok: true, message: 'Si el correo existe, enviamos un enlace de recuperación' });
  }
);

authRouter.post('/reset-password', authLimiter, validate(resetPasswordSchema), async (req, res) => {
  const { email, token, password } = req.body as ResetPasswordInput;

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    email,
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordTokenHash +resetPasswordExpires');

  if (!user) throw new HttpError(400, 'Enlace inválido o vencido');

  user.set({
    passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    resetPasswordTokenHash: undefined,
    resetPasswordExpires: undefined,
  });
  user.tokenVersion = (user.tokenVersion ?? 0) + 1; // revoca sesiones activas
  await user.save();

  res.json({ ok: true, message: 'Contraseña actualizada, inicia sesión' });
});
