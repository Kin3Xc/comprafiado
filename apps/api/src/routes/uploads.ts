import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError } from '../middleware/error-handler.js';
import { cloudinaryConfigured, signUpload } from '../lib/cloudinary.js';

export const uploadsRouter = Router();

/** Firma de subida directa navegador → Cloudinary (solo admin). */
uploadsRouter.get('/signature', requireAuth, requireRole('admin'), (_req, res) => {
  if (!cloudinaryConfigured) {
    throw new HttpError(503, 'Cloudinary no está configurado (variables CLOUDINARY_* en .env)');
  }
  res.json(signUpload('comprafiado/productos'));
});
