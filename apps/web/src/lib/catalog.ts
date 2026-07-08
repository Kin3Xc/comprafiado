/**
 * Fetch del catálogo desde Server Components (va directo a la API Express,
 * sin pasar por el proxy) con ISR por revalidate.
 */
const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
}

export interface Producto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  categoria: { id: string; nombre: string | null; slug: string | null };
  imagenes: { url: string; publicId: string }[];
  variantes: { talla: string; color: string; stock: number }[];
  activo: boolean;
  destacado: boolean;
}

export interface ProductListResponse {
  productos: Producto[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getCategorias(): Promise<Categoria[]> {
  const res = await fetch(`${API_URL}/api/categories`, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const body = await res.json();
  return body.categorias;
}

export async function getProductos(
  params: Record<string, string | undefined>
): Promise<ProductListResponse> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const res = await fetch(`${API_URL}/api/products?${qs}`, { next: { revalidate: 60 } });
  if (!res.ok) return { productos: [], total: 0, page: 1, totalPages: 0 };
  return res.json();
}

export async function getProducto(slug: string): Promise<Producto | null> {
  const res = await fetch(`${API_URL}/api/products/${encodeURIComponent(slug)}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body.producto;
}
