'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { api, type PublicUser } from '@/lib/api';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<{ user: PublicUser }>('/api/users/me')
      .then(({ user }) => {
        if (user.rol !== 'admin') router.replace('/');
        else setReady(true);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Verificando acceso…</p>
      </main>
    );
  }

  const links = [
    { href: '/admin/productos', label: 'Productos' },
    { href: '/admin/categorias', label: 'Categorías' },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/admin/productos" className="font-bold text-emerald-700">
            CompraFiado · Admin
          </Link>
          <nav className="flex gap-4 text-sm font-medium">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  pathname.startsWith(l.href)
                    ? 'text-emerald-700'
                    : 'text-gray-600 hover:text-emerald-700'
                }
              >
                {l.label}
              </Link>
            ))}
            <Link href="/" className="text-gray-600 hover:text-emerald-700">
              Ver tienda
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
