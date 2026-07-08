import { z } from 'zod';

export const registerSchema = z.object({
  nombre: z.string().trim().min(2).max(60),
  apellidos: z.string().trim().min(2).max(80),
  email: z.string().trim().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Correo inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Correo inválido'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Correo inválido'),
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
});

export const updateProfileSchema = z.object({
  nombre: z.string().trim().min(2).max(60).optional(),
  apellidos: z.string().trim().min(2).max(80).optional(),
  telefonoWhatsapp: z
    .string()
    .trim()
    .regex(/^3\d{9}$/, 'Debe ser un celular colombiano de 10 dígitos')
    .optional(),
  documento: z
    .string()
    .trim()
    .regex(/^\d{6,12}$/, 'Número de documento inválido')
    .optional(),
  municipio: z.string().trim().min(2).max(60).optional(),
  direccion: z.string().trim().min(5).max(160).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
