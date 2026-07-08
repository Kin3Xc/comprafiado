'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Producto } from '@/lib/catalog';
import { useCart } from '@/lib/cart-store';
import { ApiError } from '@/lib/api';

export function VariantSelector({ producto }: { producto: Producto }) {
  const tallas = [...new Set(producto.variantes.map((v) => v.talla))];
  const [talla, setTalla] = useState<string | null>(null);
  const add = useCart((s) => s.add);
  const [agregando, setAgregando] = useState(false);
  const [agregado, setAgregado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coloresDisponibles = talla
    ? producto.variantes.filter((v) => v.talla === talla && v.stock > 0)
    : [];
  const [color, setColor] = useState<string | null>(null);

  const variante = producto.variantes.find(
    (v) => v.talla === talla && v.color === color && v.stock > 0
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Talla</p>
        <div className="flex flex-wrap gap-2">
          {tallas.map((t) => {
            const hayStock = producto.variantes.some((v) => v.talla === t && v.stock > 0);
            return (
              <button
                key={t}
                type="button"
                disabled={!hayStock}
                onClick={() => {
                  setTalla(t);
                  setColor(null);
                }}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  talla === t
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-emerald-600'
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {talla && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Color</p>
          <div className="flex flex-wrap gap-2">
            {coloresDisponibles.map((v) => (
              <button
                key={v.color}
                type="button"
                onClick={() => setColor(v.color)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  color === v.color
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-emerald-600'
                }`}
              >
                {v.color}
              </button>
            ))}
          </div>
        </div>
      )}

      {variante && (
        <p className="text-sm text-gray-500">
          {variante.stock} disponible{variante.stock === 1 ? '' : 's'}
        </p>
      )}

      <button
        type="button"
        disabled={!variante || agregando}
        onClick={async () => {
          if (!variante) return;
          setError(null);
          setAgregando(true);
          try {
            await add({
              productoId: producto.id,
              talla: variante.talla,
              color: variante.color,
              cantidad: 1,
            });
            setAgregado(true);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : 'No se pudo agregar');
          } finally {
            setAgregando(false);
          }
        }}
        className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {agregando ? 'Agregando…' : variante ? 'Agregar al carrito' : 'Selecciona talla y color'}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {agregado && (
        <p className="text-sm text-emerald-700">
          Agregado ✓{' '}
          <Link href="/carrito" className="font-semibold underline">
            Ver carrito
          </Link>
        </p>
      )}
    </div>
  );
}
