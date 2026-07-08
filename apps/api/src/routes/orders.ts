import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { createOrderSchema, type CreateOrderInput } from '@comprafiado/shared';
import { Order, toPublicOrder } from '../models/order.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError } from '../middleware/error-handler.js';
import { findCart, buildCartView } from '../lib/cart.js';
import { epaycoConfigured, buildCheckoutData } from '../lib/epayco.js';

export const ordersRouter = Router();

function generarNumero(): string {
  return `CF-${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`;
}

/**
 * Crea una orden de contado desde el carrito actual y devuelve los datos
 * para abrir el checkout de ePayco. El stock se descuenta cuando el webhook
 * confirma el pago, no aquí.
 */
ordersRouter.post('/', requireAuth, validate(createOrderSchema), async (req, res) => {
  if (!epaycoConfigured) {
    throw new HttpError(503, 'ePayco no está configurado (variables EPAYCO_* en .env)');
  }

  const { envio } = req.body as CreateOrderInput;

  const cart = await findCart(req);
  const view = await buildCartView(cart);
  if (view.items.length === 0) throw new HttpError(400, 'El carrito está vacío');

  const sinStock = view.items.filter((i) => i.stock < i.cantidad);
  if (sinStock.length > 0) {
    throw new HttpError(
      409,
      `Sin stock suficiente: ${sinStock.map((i) => `${i.nombre} (${i.talla}/${i.color})`).join(', ')}`
    );
  }

  const order = await Order.create({
    numero: generarNumero(),
    userId: req.auth!.sub,
    items: view.items.map((i) => ({
      producto: i.productoId,
      nombre: i.nombre,
      imagen: i.imagen,
      talla: i.talla,
      color: i.color,
      cantidad: i.cantidad,
      precioUnitario: i.precio,
    })),
    total: view.subtotal,
    tipo: 'contado',
    envio,
  });

  // Carrito consumido por la orden.
  cart!.items.splice(0, cart!.items.length);
  await cart!.save();

  res.status(201).json({
    order: toPublicOrder(order),
    epayco: buildCheckoutData({
      numero: order.numero,
      total: order.total,
      items: order.items.length,
    }),
  });
});

ordersRouter.get('/', requireAuth, async (req, res) => {
  const orders = await Order.find({ userId: req.auth!.sub }).sort({ createdAt: -1 }).lean();
  res.json({ orders: orders.map(toPublicOrder) });
});

ordersRouter.get('/:numero', requireAuth, async (req, res) => {
  const order = await Order.findOne({ numero: req.params.numero, userId: req.auth!.sub }).lean();
  if (!order) throw new HttpError(404, 'Orden no encontrada');
  res.json({ order: toPublicOrder(order) });
});
