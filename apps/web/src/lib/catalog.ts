/**
 * Fetch del catálogo desde Server Components (va directo a la API Express,
 * sin pasar por el proxy) con ISR por revalidate.
 *
 * Si la API no responde (p. ej. build en CI sin backend) se degrada a
 * resultados vacíos; ISR rellena el contenido en runtime.
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

async function safeFetch(url: string, revalidate: number): Promise<Response | null> {
  try {
    const res = await fetch(url, { next: { revalidate } });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

export async function getCategorias(): Promise<Categoria[]> {
  const res = await safeFetch(`${API_URL}/api/categories`, 300);
  if (!res) return [];
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
  const res = await safeFetch(`${API_URL}/api/products?${qs}`, 60);
  if (!res) return { productos: [], total: 0, page: 1, totalPages: 0 };
  return res.json();
}

export async function getProducto(slug: string): Promise<Producto | null> {
  const res = await safeFetch(`${API_URL}/api/products/${encodeURIComponent(slug)}`, 300);
  if (!res) return null;
  const body = await res.json();
  return body.producto;
}
