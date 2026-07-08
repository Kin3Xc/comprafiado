import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { Cart } from '../models/cart.js';
import { Product } from '../models/product.js';
import { env } from '../config/env.js';

const CART_COOKIE = 'cart_session';
const CART_COOKIE_MAX_AGE = 90 * 24 * 60 * 60 * 1000;

function getSessionId(req: Request): string | undefined {
  return (req.cookies as Record<string, string> | undefined)?.[CART_COOKIE];
}

/** Busca el carrito del usuario autenticado o del invitado (cookie). */
export async function findCart(req: Request) {
  if (req.auth) return Cart.findOne({ userId: req.auth.sub });
  const sessionId = getSessionId(req);
  return sessionId ? Cart.findOne({ sessionId }) : null;
}

/** Igual que findCart pero crea el carrito (y la cookie de invitado) si no existe. */
export async function findOrCreateCart(req: Request, res: Response) {
  const existing = await findCart(req);
  if (existing) return existing;

  if (req.auth) return Cart.create({ userId: req.auth.sub, items: [] });

  const sessionId = randomUUID();
  res.cookie(CART_COOKIE, sessionId, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CART_COOKIE_MAX_AGE,
    path: '/',
  });
  return Cart.create({ sessionId, items: [] });
}

/**
 * Al iniciar sesión o registrarse: fusiona el carrito de invitado con el del
 * usuario (suma cantidades, tope 10) y elimina el de invitado.
 */
export async function mergeGuestCart(userId: string, req: Request, res: Response): Promise<void> {
  const sessionId = getSessionId(req);
  if (!sessionId) return;

  const guest = await Cart.findOne({ sessionId });
  if (!guest) return;

  if (guest.items.length > 0) {
    const userCart =
      (await Cart.findOne({ userId })) ?? (await Cart.create({ userId, items: [] }));

    for (const item of guest.items) {
      const existing = userCart.items.find(
        (i) =>
          String(i.producto) === String(item.producto) &&
          i.talla === item.talla &&
          i.color === item.color
      );
      if (existing) existing.cantidad = Math.min(existing.cantidad + item.cantidad, 10);
      else userCart.items.push(item);
    }
    await userCart.save();
  }

  await guest.deleteOne();
  res.clearCookie(CART_COOKIE, { path: '/' });
}

export interface CartItemView {
  productoId: string;
  nombre: string;
  slug: string;
  imagen: string | null;
  precio: number;
  talla: string;
  color: string;
  cantidad: number;
  /** Stock disponible de la variante en este momento. */
  stock: number;
}

/** Proyección del carrito con datos vivos del producto (precio y stock actuales). */
export async function buildCartView(
  cart: { items: { producto: unknown; talla: string; color: string; cantidad: number }[] } | null
): Promise<{ items: CartItemView[]; subtotal: number }> {
  if (!cart || cart.items.length === 0) return { items: [], subtotal: 0 };

  const ids = cart.items.map((i) => i.producto);
  const productos = await Product.find({ _id: { $in: ids }, activo: true }).lean();
  const porId = new Map(productos.map((p) => [String(p._id), p]));

  const items: CartItemView[] = [];
  for (const item of cart.items) {
    const producto = porId.get(String(item.producto));
    if (!producto) continue; // producto eliminado o desactivado
    const variante = producto.variantes.find(
      (v) => v.talla === item.talla && v.color === item.color
    );
    items.push({
      productoId: String(producto._id),
      nombre: producto.nombre,
      slug: producto.slug,
      imagen: producto.imagenes[0]?.url ?? null,
      precio: producto.precio,
      talla: item.talla,
      color: item.color,
      cantidad: item.cantidad,
      stock: variante?.stock ?? 0,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  return { items, subtotal };
}
