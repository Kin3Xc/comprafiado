import type { Metadata } from 'next';
import Link from 'next/link';
import { getProductos, getCategorias } from '@/lib/catalog';
import { ProductCard } from '@/components/product-card';

export const metadata: Metadata = {
  title: 'Catálogo de productos',
  description:
    'Ropa y calzado con opción de compra a crédito en Tierralta y Valencia (Córdoba). Filtra por categoría, talla y precio.',
};

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export default async function ProductosPage({ searchParams }: Props) {
  const params = await searchParams;
  const [data, categorias] = await Promise.all([
    getProductos({
      categoria: params.categoria,
      talla: params.talla,
      precioMin: params.precioMin,
      precioMax: params.precioMax,
      q: params.q,
      orden: params.orden,
      page: params.page,
    }),
    getCategorias(),
  ]);

  const { productos, total, page, totalPages } = data;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Catálogo</h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filtros */}
        <aside className="lg:w-56 lg:shrink-0">
          <form method="GET" className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
            <div>
              <label htmlFor="q" className="mb-1 block text-xs font-medium text-gray-600">
                Buscar
              </label>
              <input
                id="q"
                name="q"
                defaultValue={params.q}
                placeholder="Camiseta, tenis…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="categoria" className="mb-1 block text-xs font-medium text-gray-600">
                Categoría
              </label>
              <select
                id="categoria"
                name="categoria"
                defaultValue={params.categoria ?? ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="talla" className="mb-1 block text-xs font-medium text-gray-600">
                Talla
              </label>
              <input
                id="talla"
                name="talla"
                defaultValue={params.talla}
                placeholder="M, 40…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="precioMin" className="mb-1 block text-xs font-medium text-gray-600">
                  Precio desde
                </label>
                <input
                  id="precioMin"
                  name="precioMin"
                  type="number"
                  min={0}
                  defaultValue={params.precioMin}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="precioMax" className="mb-1 block text-xs font-medium text-gray-600">
                  Hasta
                </label>
                <input
                  id="precioMax"
                  name="precioMax"
                  type="number"
                  min={0}
                  defaultValue={params.precioMax}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="orden" className="mb-1 block text-xs font-medium text-gray-600">
                Ordenar por
              </label>
              <select
                id="orden"
                name="orden"
                defaultValue={params.orden ?? 'reciente'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="reciente">Más recientes</option>
                <option value="precio_asc">Menor precio</option>
                <option value="precio_desc">Mayor precio</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Aplicar filtros
            </button>
          </form>
        </aside>

        {/* Resultados */}
        <div className="flex-1">
          <p className="mb-4 text-sm text-gray-500">
            {total} producto{total === 1 ? '' : 's'}
          </p>
          {productos.length === 0 ? (
            <p className="rounded-xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
              No encontramos productos con esos filtros.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {productos.map((p) => (
                <ProductCard key={p.id} producto={p} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-8 flex justify-center gap-2" aria-label="Paginación">
              {page > 1 && (
                <Link
                  href={`/productos${buildQuery({ ...params, page: String(page - 1) })}`}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:border-emerald-600"
                >
                  ← Anterior
                </Link>
              )}
              <span className="px-3 py-2 text-sm text-gray-500">
                Página {page} de {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/productos${buildQuery({ ...params, page: String(page + 1) })}`}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:border-emerald-600"
                >
                  Siguiente →
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </main>
  );
}
