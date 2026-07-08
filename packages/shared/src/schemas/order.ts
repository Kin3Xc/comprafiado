import { z } from 'zod';

/** Identifica un ítem del carrito: producto + variante. */
export const cartItemSchema = z.object({
  productoId: z.string().min(1),
  talla: z.string().trim().min(1).max(10),
  color: z.string().trim().min(1).max(30),
  cantidad: z.number().int().min(1).max(10),
});

/** cantidad 0 elimina el ítem. */
export const updateCartItemSchema = cartItemSchema.extend({
  cantidad: z.number().int().min(0).max(10),
});

export const shippingSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre requerido').max(120),
  telefono: z
    .string()
    .trim()
    .regex(/^3\d{9}$/, 'Debe ser un celular colombiano de 10 dígitos'),
  municipio: z.string().trim().min(2, 'Municipio requerido').max(60),
  direccion: z.string().trim().min(5, 'Dirección requerida').max(160),
  notas: z.string().trim().max(300).optional(),
});

export const createOrderSchema = z.object({
  envio: shippingSchema,
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ShippingInput = z.infer<typeof shippingSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
