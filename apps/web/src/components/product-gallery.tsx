'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Producto } from '@/lib/catalog';

export function ProductGallery({ producto }: { producto: Producto }) {
  const [activa, setActiva] = useState(0);
  const imagenes = producto.imagenes;

  if (imagenes.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
        Sin imagen
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
        <Image
          src={imagenes[activa].url}
          alt={producto.nombre}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {imagenes.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {imagenes.map((img, i) => (
            <button
              key={img.publicId}
              type="button"
              onClick={() => setActiva(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === activa ? 'border-emerald-600' : 'border-transparent'
              }`}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
