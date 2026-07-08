'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-store';
import { ApiError } from '@/lib/api';
import { formatCOP } from '@/lib/format';

export default function CarritoPage() {
  const { items, subtotal, loaded, fetch, setCantidad } = useCart();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga async inicial
    fetch().catch(() => {});
  }, [fetch]);

  async function cambiar(item: (typeof items)[number], cantidad: number) {
    setError(null);
    try {
      await setCantidad({
        productoId: item.productoId,
        talla: item.talla,
        color: item.color,
        cantidad,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error de conexión');
    }
  }

  if (!loaded) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-gray-500">Cargando carrito…</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Tu carrito está vacío</h1>
        <Link
          href="/productos"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Ir al catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Carrito</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <ul className="divide-y divide-gray-200 rounded-xl bg-white shadow-sm">
        {items.map((item) => (
          <li key={`${item.productoId}-${item.talla}-${item.color}`} className="flex gap-4 p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {item.imagen && (
                <Image src={item.imagen} alt={item.nombre} fill sizes="80px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/productos/${item.slug}`}
                className="block truncate text-sm font-medium hover:text-emerald-700"
              >
                {item.nombre}
              </Link>
              <p className="text-xs text-gray-500">
                Talla {item.talla} · {item.color}
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                {formatCOP(item.precio)}
              </p>
              {item.stock < item.cantidad && (
                <p className="text-xs text-red-600">Solo quedan {item.stock} unidades</p>
              )}
            </div>
            <div className="flex flex-col items-end justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => cambiar(item, item.cantidad - 1)}
                  className="h-7 w-7 rounded-lg border border-gray-300 text-sm hover:border-emerald-600"
                  aria-label="Restar uno"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm">{item.cantidad}</span>
                <button
                  type="button"
                  onClick={() => cambiar(item, item.cantidad + 1)}
                  disabled={item.cantidad >= Math.min(item.stock, 10)}
                  className="h-7 w-7 rounded-lg border border-gray-300 text-sm hover:border-emerald-600 disabled:opacity-40"
                  aria-label="Sumar uno"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => cambiar(item, 0)}
                className="text-xs text-red-600 hover:underline"
              >
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-emerald-700">{formatCOP(subtotal)}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href="/checkout"
            className="rounded-lg bg-emerald-600 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Pagar de contado
          </Link>
          <button
            type="button"
            disabled
            title="Disponible próximamente"
            className="cursor-not-allowed rounded-lg border border-emerald-600 py-3 text-center text-sm font-semibold text-emerald-700 opacity-50"
          >
            Comprar a crédito (próximamente)
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          El crédito estará disponible para residentes de Tierralta y Valencia (Córdoba).
        </p>
      </div>
    </main>
  );
}
