import { Router } from 'express';
import { Order } from '../models/order.js';
import { Payment } from '../models/payment.js';
import { Product } from '../models/product.js';
import { User } from '../models/user.js';
import { isValidSignature, EPAYCO_COD } from '../lib/epayco.js';
import { sendMail } from '../lib/mailer.js';
import { logger } from '../lib/logger.js';

export const paymentsRouter = Router();

/** Descuenta stock por variante; guard $gte evita dejarlo negativo. */
async function descontarStock(order: InstanceType<typeof Order>): Promise<void> {
  for (const item of order.items) {
    const result = await Product.updateOne(
      {
        _id: item.producto,
        variantes: {
          $elemMatch: { talla: item.talla, color: item.color, stock: { $gte: item.cantidad } },
        },
      },
      { $inc: { 'variantes.$.stock': -item.cantidad } }
    );
    if (result.modifiedCount === 0) {
      logger.warn(
        { orden: order.numero, item: item.nombre, talla: item.talla, color: item.color },
        'Pago confirmado pero stock insuficiente al descontar'
      );
    }
  }
}

async function enviarEmailConfirmacion(order: InstanceType<typeof Order>): Promise<void> {
  const user = await User.findById(order.userId).lean();
  if (!user) return;

  const filas = order.items
    .map(
      (i) =>
        `<tr><td>${i.nombre} (${i.talla}/${i.color})</td><td>${i.cantidad}</td><td>$${i.precioUnitario.toLocaleString('es-CO')}</td></tr>`
    )
    .join('');

  await sendMail({
    to: user.email,
    subject: `Pedido ${order.numero} confirmado — CompraFiado`,
    html: `<p>Hola ${user.nombre},</p>
<p>Recibimos tu pago. Tu pedido <strong>${order.numero}</strong> está confirmado y pronto será enviado a:</p>
<p>${order.envio.nombre} — ${order.envio.direccion}, ${order.envio.municipio}</p>
<table border="1" cellpadding="6" cellspacing="0">
<tr><th>Producto</th><th>Cant.</th><th>Precio</th></tr>
${filas}
</table>
<p><strong>Total: $${order.total.toLocaleString('es-CO')} COP</strong></p>`,
  });
}

/**
 * Webhook de confirmación de ePayco (fuente de verdad del estado del pago).
 * ePayco lo envía como form-urlencoded. Siempre responde 200 para evitar
 * reintentos infinitos; los casos anómalos quedan en el log.
 */
paymentsRouter.post('/epayco/confirmation', async (req, res) => {
  const body = req.body as Record<string, string>;
  const ref = body.x_ref_payco;

  if (!ref || !body.x_id_invoice) {
    logger.warn({ body }, 'Webhook ePayco sin referencia');
    res.status(400).json({ error: 'Referencia faltante' });
    return;
  }

  if (!isValidSignature(body)) {
    logger.warn({ ref }, 'Webhook ePayco con firma inválida');
    res.status(403).json({ error: 'Firma inválida' });
    return;
  }

  // Idempotencia: si la referencia ya fue procesada con estado final, salir.
  const existing = await Payment.findOne({ refEpayco: ref });
  if (existing && existing.estado !== 'pendiente') {
    res.json({ ok: true, processed: 'already' });
    return;
  }

  const order = await Order.findOne({ numero: body.x_id_invoice });
  if (!order) {
    logger.warn({ ref, invoice: body.x_id_invoice }, 'Webhook ePayco para orden inexistente');
    res.json({ ok: true, processed: 'order-not-found' });
    return;
  }

  // Monto debe coincidir con la orden — un pago alterado no la marca pagada.
  const monto = Math.round(Number(body.x_amount));
  if (monto !== order.total) {
    logger.warn({ ref, monto, total: order.total }, 'Webhook ePayco con monto distinto');
    res.json({ ok: true, processed: 'amount-mismatch' });
    return;
  }

  const cod = body.x_cod_response;
  const estado =
    cod === EPAYCO_COD.ACEPTADA
      ? 'aprobado'
      : cod === EPAYCO_COD.PENDIENTE
        ? 'pendiente'
        : 'rechazado';

  await Payment.findOneAndUpdate(
    { refEpayco: ref },
    { orderId: order._id, monto, medio: 'epayco', estado, raw: body },
    { upsert: true }
  );

  if (estado === 'aprobado' && order.estado === 'pendiente') {
    order.estado = 'pagada';
    await order.save();
    await descontarStock(order);
    enviarEmailConfirmacion(order).catch((err) =>
      logger.error({ err, orden: order.numero }, 'Fallo email de confirmación')
    );
  } else if (estado === 'rechazado' && order.estado === 'pendiente') {
    order.estado = 'cancelada';
    await order.save();
  }

  res.json({ ok: true, processed: estado });
});
