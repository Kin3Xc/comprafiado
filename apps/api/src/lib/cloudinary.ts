import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger.js';

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

export const cloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

/** Firma para que el navegador del admin suba directo a Cloudinary. */
export function signUpload(folder: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    CLOUDINARY_API_SECRET!
  );
  return {
    cloudName: CLOUDINARY_CLOUD_NAME!,
    apiKey: CLOUDINARY_API_KEY!,
    timestamp,
    folder,
    signature,
  };
}

/** Borra imágenes al eliminar un producto; fallos solo se registran. */
export async function destroyImages(publicIds: string[]): Promise<void> {
  if (!cloudinaryConfigured || publicIds.length === 0) return;
  const results = await Promise.allSettled(
    publicIds.map((id) => cloudinary.uploader.destroy(id))
  );
  for (const r of results) {
    if (r.status === 'rejected') logger.warn({ err: r.reason }, 'No se pudo borrar imagen');
  }
}
