'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Producto } from '@/lib/catalog';
import { ProductForm } from '@/components/admin/product-form';

export default function EditarProductoPage() {
  const { id } = useParams<{ id: string }>();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ producto: Producto }>(`/api/products/id/${id}`)
      .then(({ producto }) => setProducto(producto))
      .catch(() => setError('Producto no encontrado'));
  }, [id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!producto) return <p className="text-sm text-gray-500">Cargando…</p>;

  return (
    <>
      <h1 className="mb-6 text-xl font-bold">Editar: {producto.nombre}</h1>
      <ProductForm producto={producto} />
    </>
  );
}
