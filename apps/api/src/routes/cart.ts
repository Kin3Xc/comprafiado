import { Router } from 'express';
import {
  cartItemSchema,
  updateCartItemSchema,
  type CartItemInput,
  type UpdateCartItemInput,
} from '@comprafiado/shared';
import { Product } from '../models/product.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError } from '../middleware/error-handler.js';
import { findCart, findOrCreateCart, buildCartView } from '../lib/cart.js';

export const cartRouter = Router();

cartRouter.use(optionalAuth);

cartRouter.get('/', async (req, res) => {
  const cart = await findCart(req);
  res.json(await buildCartView(cart));
});

/** Agrega un ítem (o incrementa cantidad si ya existe la variante). */
cartRouter.post('/items', validate(cartItemSchema), async (req, res) => {
  const { productoId, talla, color, cantidad } = req.body as CartItemInput;

  const producto = await Product.findOne({ _id: productoId, activo: true }).lean();
  if (!producto) throw new HttpError(404, 'Producto no disponible');

  const variante = producto.variantes.find((v) => v.talla === talla && v.color === color);
  if (!variante) throw new HttpError(400, 'Variante no existe');

  const cart = await findOrCreateCart(req, res);
  const existing = cart.items.find(
    (i) => String(i.producto) === productoId && i.talla === talla && i.color === color
  );

  const nuevaCantidad = Math.min((existing?.cantidad ?? 0) + cantidad, 10);
  if (variante.stock < nuevaCantidad) {
    throw new HttpError(409, `Solo hay ${variante.stock} unidades disponibles`);
  }

  if (existing) existing.cantidad = nuevaCantidad;
  else cart.items.push({ producto: producto._id, talla, color, cantidad });

  await cart.save();
  res.status(201).json(await buildCartView(cart));
});

/** Fija la cantidad exacta de un ítem; cantidad 0 lo elimina. */
cartRouter.patch('/items', validate(updateCartItemSchema), async (req, res) => {
  const { productoId, talla, color, cantidad } = req.body as UpdateCartItemInput;

  const cart = await findCart(req);
  if (!cart) throw new HttpError(404, 'Carrito vacío');

  const idx = cart.items.findIndex(
    (i) => String(i.producto) === productoId && i.talla === talla && i.color === color
  );
  if (idx === -1) throw new HttpError(404, 'Ítem no está en el carrito');

  if (cantidad === 0) {
    cart.items.splice(idx, 1);
  } else {
    const producto = await Product.findOne({ _id: productoId, activo: true }).lean();
    const variante = producto?.variantes.find((v) => v.talla === talla && v.color === color);
    if (!variante || variante.stock < cantidad) {
      throw new HttpError(409, `Solo hay ${variante?.stock ?? 0} unidades disponibles`);
    }
    cart.items[idx]!.cantidad = cantidad;
  }

  await cart.save();
  res.json(await buildCartView(cart));
});
