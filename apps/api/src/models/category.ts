import { Schema, model } from 'mongoose';

const categorySchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const Category = model('Category', categorySchema);
