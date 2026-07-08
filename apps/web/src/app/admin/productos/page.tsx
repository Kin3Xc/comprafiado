'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import type { Producto, ProductListResponse } from '@/lib/catalog';
import { formatCOP } from '@/lib/format';

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await api<ProductListResponse>('/api/products?todos=1&limit=48');
    setProductos(data.productos);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga async inicial, no es setState síncrono
    load().catch(() => setError('No se pudieron cargar los productos'));
  }, []);

  async function borrar(p: Producto) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    setError(null);
    try {
      await api(`/api/products/${p.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error de conexión');
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Nuevo producto
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {productos.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.nombre}</td>
                <td className="px-4 py-3">{formatCOP(p.precio)}</td>
                <td className="px-4 py-3">{p.variantes.reduce((s, v) => s + v.stock, 0)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="mr-3 text-emerald-700 hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => borrar(p)}
                    type="button"
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Sin productos aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
