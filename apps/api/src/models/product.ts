import { Schema, model } from 'mongoose';

const variantSchema = new Schema(
  {
    talla: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    descripcion: { type: String, required: true },
    /** Precio en COP, sin decimales. */
    precio: { type: Number, required: true, min: 1 },
    categoria: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    imagenes: { type: [imageSchema], default: [] },
    variantes: { type: [variantSchema], required: true },
    activo: { type: Boolean, default: true, index: true },
    destacado: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ precio: 1 });
productSchema.index({ 'variantes.talla': 1 });
productSchema.index({ nombre: 'text', descripcion: 'text' });

export const Product = model('Product', productSchema);
