import { z } from 'zod';
import { CREDIT_MUNICIPALITIES } from '../constants.js';

/**
 * Datos que el cliente diligencia para solicitar compra a crédito.
 * Requiere carrito existente; el total se toma del carrito en el backend.
 */
export const creditApplicationSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre requerido').max(60),
  apellidos: z.string().trim().min(2, 'Apellidos requeridos').max(80),
  documento: z
    .string()
    .trim()
    .regex(/^\d{6,12}$/, 'Número de documento inválido'),
  telefonoWhatsapp: z
    .string()
    .trim()
    .regex(/^3\d{9}$/, 'Debe ser un celular colombiano de 10 dígitos'),
  email: z.string().trim().email('Correo inválido'),
  fechaNacimiento: z.coerce.date(),
  municipio: z.enum(CREDIT_MUNICIPALITIES, {
    errorMap: () => ({
      message: 'El crédito solo está disponible en Tierralta y Valencia (Córdoba)',
    }),
  }),
  direccion: z.string().trim().min(5, 'Dirección requerida').max(160),
  ocupacion: z.string().trim().min(2, 'Ocupación requerida').max(80),
  tiempoEnCargoMeses: z
    .number()
    .int()
    .min(0, 'Tiempo en el cargo inválido')
    .max(720),
  /** Abono inicial opcional (pago mixto). 0 = crédito total. */
  abonoInicial: z.number().min(0).default(0),
});

export type CreditApplicationInput = z.infer<typeof creditApplicationSchema>;
