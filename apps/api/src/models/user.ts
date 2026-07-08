import { Schema, model, type InferSchemaType } from 'mongoose';
import { USER_ROLES } from '@comprafiado/shared';

const userSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellidos: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    rol: { type: String, enum: USER_ROLES, default: 'customer' },
    telefonoWhatsapp: { type: String, trim: true },
    documento: { type: String, trim: true },
    municipio: { type: String, trim: true, lowercase: true },
    direccion: { type: String, trim: true },
    /** Se incrementa para invalidar todos los refresh tokens emitidos. */
    tokenVersion: { type: Number, default: 0 },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Schema.Types.ObjectId };

export const User = model('User', userSchema);

/** Campos seguros para exponer al cliente. */
export function toPublicUser(user: {
  _id: unknown;
  nombre: string;
  apellidos: string;
  email: string;
  rol?: string | null;
  telefonoWhatsapp?: string | null;
  documento?: string | null;
  municipio?: string | null;
  direccion?: string | null;
}) {
  return {
    id: String(user._id),
    nombre: user.nombre,
    apellidos: user.apellidos,
    email: user.email,
    rol: user.rol ?? 'customer',
    telefonoWhatsapp: user.telefonoWhatsapp ?? null,
    documento: user.documento ?? null,
    municipio: user.municipio ?? null,
    direccion: user.direccion ?? null,
  };
}
