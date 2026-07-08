import { Schema, model } from 'mongoose';
import { ORDER_TYPES, ORDER_STATUSES } from '@comprafiado/shared';

const orderItemSchema = new Schema(
  {
    producto: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    nombre: { type: String, required: true },
    imagen: { type: String },
    talla: { type: String, required: true },
    color: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    /** Precio unitario en COP congelado al crear la orden. */
    precioUnitario: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingSchema = new Schema(
  {
    nombre: { type: String, required: true },
    telefono: { type: String, required: true },
    municipio: { type: String, required: true },
    direccion: { type: String, required: true },
    notas: { type: String },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    numero: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 1 },
    tipo: { type: String, enum: ORDER_TYPES, required: true },
    estado: { type: String, enum: ORDER_STATUSES, default: 'pendiente', index: true },
    envio: { type: shippingSchema, required: true },
  },
  { timestamps: true }
);

export const Order = model('Order', orderSchema);

export function toPublicOrder(o: {
  _id: unknown;
  numero: string;
  items: {
    producto: unknown;
    nombre: string;
    imagen?: string | null;
    talla: string;
    color: string;
    cantidad: number;
    precioUnitario: number;
  }[];
  total: number;
  tipo: string;
  estado?: string | null;
  envio: {
    nombre: string;
    telefono: string;
    municipio: string;
    direccion: string;
    notas?: string | null;
  };
  createdAt?: Date;
}) {
  return {
    id: String(o._id),
    numero: o.numero,
    items: o.items.map((i) => ({
      productoId: String(i.producto),
      nombre: i.nombre,
      imagen: i.imagen ?? null,
      talla: i.talla,
      color: i.color,
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario,
    })),
    total: o.total,
    tipo: o.tipo,
    estado: o.estado ?? 'pendiente',
    envio: {
      nombre: o.envio.nombre,
      telefono: o.envio.telefono,
      municipio: o.envio.municipio,
      direccion: o.envio.direccion,
      notas: o.envio.notas ?? null,
    },
    createdAt: o.createdAt?.toISOString() ?? null,
  };
}
