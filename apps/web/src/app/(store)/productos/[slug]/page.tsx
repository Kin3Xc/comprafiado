import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProducto } from '@/lib/catalog';
import { formatCOP } from '@/lib/format';
import { ProductGallery } from '@/components/product-gallery';
import { VariantSelector } from '@/components/variant-selector';

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const producto = await getProducto(slug);
  if (!producto) return { title: 'Producto no encontrado' };

  return {
    title: producto.nombre,
    description: producto.descripcion.slice(0, 155),
    openGraph: {
      title: producto.nombre,
      description: producto.descripcion.slice(0, 155),
      images: producto.imagenes[0] ? [{ url: producto.imagenes[0].url }] : [],
    },
    alternates: { canonical: `/productos/${producto.slug}` },
  };
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;
  const producto = await getProducto(slug);
  if (!producto) notFound();

  const hayStock = producto.variantes.some((v) => v.stock > 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description: producto.descripcion,
    image: producto.imagenes.map((i) => i.url),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'COP',
      price: producto.precio,
      availability: hayStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `/productos/${producto.slug}`,
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-6 text-sm text-gray-500" aria-label="Miga de pan">
        <Link href="/productos" className="hover:text-emerald-700">
          Catálogo
        </Link>
        {producto.categoria.slug && (
          <>
            {' / '}
            <Link
              href={`/productos?categoria=${producto.categoria.slug}`}
              className="hover:text-emerald-700"
            >
              {producto.categoria.nombre}
            </Link>
          </>
        )}
        {' / '}
        <span className="text-gray-900">{producto.nombre}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery producto={producto} />

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{producto.nombre}</h1>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{formatCOP(producto.precio)}</p>
          <p className="mt-1 text-sm text-gray-500">
            O a crédito en cuotas mensuales (Tierralta y Valencia)
          </p>

          <div className="mt-6">
            <VariantSelector producto={producto} />
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Descripción</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {producto.descripcion}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
