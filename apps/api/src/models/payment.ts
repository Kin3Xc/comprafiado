import { Schema, model } from 'mongoose';
import { PAYMENT_STATUSES } from '@comprafiado/shared';

const paymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    monto: { type: Number, required: true },
    medio: { type: String, default: 'epayco' },
    /** Referencia única de ePayco (x_ref_payco) — clave de idempotencia. */
    refEpayco: { type: String, required: true, unique: true },
    estado: { type: String, enum: PAYMENT_STATUSES, default: 'pendiente' },
    /** Payload crudo del webhook para auditoría. */
    raw: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Payment = model('Payment', paymentSchema);
