'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Categoria } from '@/lib/catalog';

export default function AdminCategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { categorias } = await api<{ categorias: Categoria[] }>('/api/categories');
    setCategorias(categorias);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga async inicial, no es setState síncrono
    load().catch(() => setError('No se pudieron cargar las categorías'));
  }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api('/api/categories', { method: 'POST', body: JSON.stringify({ nombre }) });
      setNombre('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  async function borrar(id: string) {
    setError(null);
    try {
      await api(`/api/categories/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error de conexión');
    }
  }

  return (
    <>
      <h1 className="mb-6 text-xl font-bold">Categorías</h1>

      <form onSubmit={crear} className="mb-6 flex max-w-md gap-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la categoría"
          required
          minLength={2}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Crear
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <ul className="max-w-md divide-y divide-gray-200 rounded-xl bg-white shadow-sm">
        {categorias.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              {c.nombre} <span className="text-gray-400">/{c.slug}</span>
            </span>
            <button
              onClick={() => borrar(c.id)}
              className="text-red-600 hover:underline"
              type="button"
            >
              Eliminar
            </button>
          </li>
        ))}
        {categorias.length === 0 && (
          <li className="px-4 py-3 text-sm text-gray-500">Sin categorías aún.</li>
        )}
      </ul>
    </>
  );
}
