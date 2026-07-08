import { Router } from 'express';
import type { FilterQuery } from 'mongoose';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  type CreateProductInput,
  type UpdateProductInput,
} from '@comprafiado/shared';
import { Product } from '../models/product.js';
import { Category } from '../models/category.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError } from '../middleware/error-handler.js';
import { slugify } from '../lib/slug.js';
import { destroyImages } from '../lib/cloudinary.js';

export const productsRouter = Router();

function toPublicProduct(p: {
  _id: unknown;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  categoria?: { _id?: unknown; nombre?: string; slug?: string } | unknown;
  imagenes: { url: string; publicId: string }[];
  variantes: { talla: string; color: string; stock: number }[];
  activo?: boolean | null;
  destacado?: boolean | null;
  createdAt?: Date;
}) {
  const cat = p.categoria as { _id?: unknown; nombre?: string; slug?: string } | null;
  return {
    id: String(p._id),
    nombre: p.nombre,
    slug: p.slug,
    descripcion: p.descripcion,
    precio: p.precio,
    categoria: cat?.nombre
      ? { id: String(cat._id), nombre: cat.nombre, slug: cat.slug }
      : { id: String(p.categoria), nombre: null, slug: null },
    imagenes: p.imagenes.map((i) => ({ url: i.url, publicId: i.publicId })),
    variantes: p.variantes.map((v) => ({ talla: v.talla, color: v.color, stock: v.stock })),
    activo: p.activo ?? true,
    destacado: p.destacado ?? false,
  };
}

productsRouter.get('/', optionalAuth, async (req, res) => {
  const query = productQuerySchema.parse(req.query);
  const isAdmin = req.auth?.rol === 'admin';

  const filter: FilterQuery<typeof Product> = {};
  // Solo el admin puede listar productos inactivos (query todos=1).
  if (!(isAdmin && req.query.todos === '1')) filter.activo = true;

  if (query.categoria) {
    const cat = await Category.findOne({ slug: query.categoria }).lean();
    if (!cat) {
      res.json({ productos: [], total: 0, page: 1, totalPages: 0 });
      return;
    }
    filter.categoria = cat._id;
  }
  if (query.talla) filter['variantes.talla'] = query.talla;
  if (query.precioMin !== undefined || query.precioMax !== undefined) {
    filter.precio = {};
    if (query.precioMin !== undefined) filter.precio.$gte = query.precioMin;
    if (query.precioMax !== undefined) filter.precio.$lte = query.precioMax;
  }
  if (query.q) filter.$text = { $search: query.q };

  const sort: Record<string, 1 | -1> =
    query.orden === 'precio_asc'
      ? { precio: 1 }
      : query.orden === 'precio_desc'
        ? { precio: -1 }
        : { createdAt: -1 };

  const [productos, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate('categoria', 'nombre slug')
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    productos: productos.map(toPublicProduct),
    total,
    page: query.page,
    totalPages: Math.ceil(total / query.limit),
  });
});

/** Detalle por id (admin — incluye inactivos). Antes de /:slug para no chocar. */
productsRouter.get('/id/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const producto = await Product.findById(req.params.id).populate('categoria', 'nombre slug');
  if (!producto) throw new HttpError(404, 'Producto no encontrado');
  res.json({ producto: toPublicProduct(producto.toObject()) });
});

productsRouter.get('/:slug', async (req, res) => {
  const producto = await Product.findOne({ slug: req.params.slug, activo: true })
    .populate('categoria', 'nombre slug')
    .lean();
  if (!producto) throw new HttpError(404, 'Producto no encontrado');
  res.json({ producto: toPublicProduct(producto) });
});

productsRouter.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validate(createProductSchema),
  async (req, res) => {
    const data = req.body as CreateProductInput;

    const categoria = await Category.findById(data.categoriaId).lean();
    if (!categoria) throw new HttpError(400, 'Categoría no existe');

    let slug = slugify(data.nombre);
    if (await Product.exists({ slug })) slug = `${slug}-${Date.now().toString(36)}`;

    const producto = await Product.create({
      nombre: data.nombre,
      slug,
      descripcion: data.descripcion,
      precio: data.precio,
      categoria: categoria._id,
      imagenes: data.imagenes,
      variantes: data.variantes,
      activo: data.activo,
      destacado: data.destacado,
    });

    const populated = await producto.populate('categoria', 'nombre slug');
    res.status(201).json({ producto: toPublicProduct(populated.toObject()) });
  }
);

productsRouter.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate(updateProductSchema),
  async (req, res) => {
    const data = req.body as UpdateProductInput;

    const producto = await Product.findById(req.params.id);
    if (!producto) throw new HttpError(404, 'Producto no encontrado');

    if (data.categoriaId) {
      const categoria = await Category.findById(data.categoriaId).lean();
      if (!categoria) throw new HttpError(400, 'Categoría no existe');
      producto.categoria = categoria._id;
    }
    if (data.nombre && data.nombre !== producto.nombre) {
      let slug = slugify(data.nombre);
      if (await Product.exists({ slug, _id: { $ne: producto._id } })) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
      producto.slug = slug;
    }

    // Imágenes retiradas del producto → borrarlas de Cloudinary.
    if (data.imagenes) {
      const nuevas = new Set(data.imagenes.map((i) => i.publicId));
      const retiradas = producto.imagenes
        .map((i) => i.publicId)
        .filter((id) => !nuevas.has(id));
      await destroyImages(retiradas);
    }

    const { categoriaId: _categoriaId, ...rest } = data;
    producto.set(rest);
    await producto.save();

    const populated = await producto.populate('categoria', 'nombre slug');
    res.json({ producto: toPublicProduct(populated.toObject()) });
  }
);

productsRouter.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const producto = await Product.findByIdAndDelete(req.params.id);
  if (!producto) throw new HttpError(404, 'Producto no encontrado');

  await destroyImages(producto.imagenes.map((i) => i.publicId));
  res.json({ ok: true });
});
