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
  /** URL pública de esta API — la usa ePayco para el webhook de confirmación. */
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  EPAYCO_PUBLIC_KEY: z.string().optional(),
  EPAYCO_P_CUST_ID: z.string().optional(),
  EPAYCO_P_KEY: z.string().optional(),
  EPAYCO_TEST_MODE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
