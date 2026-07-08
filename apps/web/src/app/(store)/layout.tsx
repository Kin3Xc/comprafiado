import type { ReactNode } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      <footer className="mt-12 border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
        <p>CompraFiado — Tierralta y Valencia, Córdoba</p>
        <p className="mt-2">
          <Link href="/productos" className="text-emerald-700 hover:underline">
            Catálogo
          </Link>
        </p>
      </footer>
    </>
  );
}
