/**
 * Crea o promueve un usuario admin.
 * Uso: pnpm --filter @comprafiado/api exec tsx src/scripts/create-admin.ts <email> <password> [nombre] [apellidos]
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/user.js';

const [email, password, nombre = 'Admin', apellidos = 'CompraFiado'] = process.argv.slice(2);

if (!email || !password) {
  console.error('Uso: tsx src/scripts/create-admin.ts <email> <password> [nombre] [apellidos]');
  process.exit(1);
}

await mongoose.connect(env.MONGODB_URI);

const passwordHash = await bcrypt.hash(password, 12);
const user = await User.findOneAndUpdate(
  { email: email.toLowerCase() },
  { $set: { rol: 'admin', passwordHash }, $setOnInsert: { nombre, apellidos } },
  { upsert: true, new: true }
);

console.log(`Admin listo: ${user.email} (${user._id})`);
await mongoose.disconnect();
