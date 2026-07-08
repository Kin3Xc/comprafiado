import { Router } from 'express';
import { categorySchema, type CategoryInput } from '@comprafiado/shared';
import { Category } from '../models/category.js';
import { Product } from '../models/product.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError } from '../middleware/error-handler.js';
import { slugify } from '../lib/slug.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_req, res) => {
  const categorias = await Category.find().sort({ nombre: 1 }).lean();
  res.json({
    categorias: categorias.map((c) => ({ id: String(c._id), nombre: c.nombre, slug: c.slug })),
  });
});

categoriesRouter.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validate(categorySchema),
  async (req, res) => {
    const { nombre } = req.body as CategoryInput;
    const slug = slugify(nombre);

    const exists = await Category.findOne({ slug }).lean();
    if (exists) throw new HttpError(409, 'Ya existe una categoría con ese nombre');

    const categoria = await Category.create({ nombre, slug });
    res.status(201).json({
      categoria: { id: String(categoria._id), nombre: categoria.nombre, slug: categoria.slug },
    });
  }
);

categoriesRouter.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const enUso = await Product.exists({ categoria: req.params.id });
  if (enUso) throw new HttpError(409, 'La categoría tiene productos asociados');

  const borrada = await Category.findByIdAndDelete(req.params.id);
  if (!borrada) throw new HttpError(404, 'Categoría no encontrada');

  res.json({ ok: true });
});
