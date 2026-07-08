import { z } from 'zod';

export const categorySchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre requerido').max(60),
});

export const productVariantSchema = z.object({
  talla: z.string().trim().min(1, 'Talla requerida').max(10),
  color: z.string().trim().min(1, 'Color requerido').max(30),
  stock: z.number().int().min(0, 'Stock inválido'),
});

export const productImageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
});

export const createProductSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre requerido').max(120),
  descripcion: z.string().trim().min(10, 'Mínimo 10 caracteres').max(5000),
  /** Precio en pesos colombianos (COP), sin decimales. */
  precio: z.number().int().positive('Precio inválido'),
  categoriaId: z.string().min(1, 'Categoría requerida'),
  imagenes: z.array(productImageSchema).max(8, 'Máximo 8 imágenes').default([]),
  variantes: z.array(productVariantSchema).min(1, 'Agrega al menos una variante'),
  activo: z.boolean().default(true),
  destacado: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  categoria: z.string().trim().optional(),
  talla: z.string().trim().optional(),
  precioMin: z.coerce.number().int().min(0).optional(),
  precioMax: z.coerce.number().int().min(0).optional(),
  q: z.string().trim().max(80).optional(),
  orden: z.enum(['reciente', 'precio_asc', 'precio_desc']).default('reciente'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
