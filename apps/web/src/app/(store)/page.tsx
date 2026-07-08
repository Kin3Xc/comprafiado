import Link from 'next/link';
import { getProductos, getCategorias } from '@/lib/catalog';
import { ProductCard } from '@/components/product-card';

export const revalidate = 300;

export default async function HomePage() {
  const [{ productos }, categorias] = await Promise.all([
    getProductos({ limit: '8' }),
    getCategorias(),
  ]);

  return (
    <main>
      <section className="bg-emerald-700 px-4 py-16 text-center text-white">
        <h1 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">
          Compra ropa y calzado a crédito, sin complicaciones
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-emerald-50">
          Si vives en Tierralta o Valencia (Córdoba), solicita tu crédito con el total de tu
          carrito y paga en cuotas mensuales. Fuera de la zona también puedes comprar de contado.
        </p>
        <Link
          href="/productos"
          className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          Ver catálogo
        </Link>
      </section>

      {categorias.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="mb-4 text-lg font-semibold">Categorías</h2>
          <div className="flex flex-wrap gap-3">
            {categorias.map((c) => (
              <Link
                key={c.id}
                href={`/productos?categoria=${c.slug}`}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-600 hover:text-emerald-700"
              >
                {c.nombre}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <h2 className="mb-4 text-lg font-semibold">Novedades</h2>
        {productos.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no hay productos publicados.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productos.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
