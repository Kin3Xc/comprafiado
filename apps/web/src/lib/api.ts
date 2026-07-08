export interface PublicUser {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: 'customer' | 'admin';
  telefonoWhatsapp: string | null;
  documento: string | null;
  municipio: string | null;
  direccion: string | null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
  }
}

/**
 * Cliente de la API (rutas relativas — el proxy de Next las reenvía a Express).
 * Reintenta una vez con refresh de sesión ante un 401.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const doFetch = () =>
    fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      credentials: 'include',
    });

  let res = await doFetch();

  if (res.status === 401 && path !== '/api/auth/refresh' && path !== '/api/auth/login') {
    const refreshed = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) res = await doFetch();
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? 'Error inesperado', body.details);
  }

  return body as T;
}
