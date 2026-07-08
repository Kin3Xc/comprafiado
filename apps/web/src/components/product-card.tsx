import Image from 'next/image';
import Link from 'next/link';
import type { Producto } from '@/lib/catalog';
import { formatCOP } from '@/lib/format';

export function ProductCard({ producto }: { producto: Producto }) {
  const imagen = producto.imagenes[0];
  const tallas = [...new Set(producto.variantes.map((v) => v.talla))];

  return (
    <Link
      href={`/productos/${producto.slug}`}
      className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-square bg-gray-100">
        {imagen ? (
          <Image
            src={imagen.url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Sin imagen
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-gray-900">{producto.nombre}</h3>
        <p className="mt-1 text-base font-semibold text-emerald-700">
          {formatCOP(producto.precio)}
        </p>
        <p className="mt-1 truncate text-xs text-gray-500">Tallas: {tallas.join(', ')}</p>
      </div>
    </Link>
  );
}
