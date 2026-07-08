'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-store';

export function CartBadge() {
  const { items, loaded, fetch } = useCart();
  const count = items.reduce((s, i) => s + i.cantidad, 0);

  useEffect(() => {
    if (!loaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carga async inicial
      fetch().catch(() => {});
    }
  }, [loaded, fetch]);

  return (
    <Link href="/carrito" className="relative hover:text-emerald-700" aria-label="Carrito">
      🛒
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
