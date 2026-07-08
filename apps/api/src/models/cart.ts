import { Schema, model } from 'mongoose';

const cartItemSchema = new Schema(
  {
    producto: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    talla: { type: String, required: true },
    color: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1, max: 10 },
  },
  { _id: false }
);

/**
 * Carrito de usuario autenticado (userId) o de invitado (sessionId).
 * Los de invitado expiran a los 90 días.
 */
const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
    sessionId: { type: String, index: true, sparse: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Cart = model('Cart', cartSchema);
