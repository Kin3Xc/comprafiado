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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
