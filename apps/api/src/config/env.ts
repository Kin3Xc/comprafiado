import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI es requerida'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().min(32, 'Mínimo 32 caracteres — generar con: openssl rand -base64 48'),
  JWT_REFRESH_SECRET: z.string().min(32, 'Mínimo 32 caracteres — generar con: openssl rand -base64 48'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('CompraFiado <onboarding@resend.dev>'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
