import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-2xl font-bold text-emerald-700">
          CompraFiado
        </Link>
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}
