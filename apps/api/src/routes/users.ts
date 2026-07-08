import { Router } from 'express';
import { updateProfileSchema, type UpdateProfileInput } from '@comprafiado/shared';
import { User, toPublicUser } from '../models/user.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError } from '../middleware/error-handler.js';

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.auth!.sub);
  if (!user) throw new HttpError(404, 'Usuario no encontrado');
  res.json({ user: toPublicUser(user) });
});

usersRouter.patch('/me', requireAuth, validate(updateProfileSchema), async (req, res) => {
  const updates = req.body as UpdateProfileInput;

  const user = await User.findByIdAndUpdate(
    req.auth!.sub,
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!user) throw new HttpError(404, 'Usuario no encontrado');

  res.json({ user: toPublicUser(user) });
});
