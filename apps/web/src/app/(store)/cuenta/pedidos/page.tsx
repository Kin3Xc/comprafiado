'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCOP } from '@/lib/format';

interface OrderSummary {
  id: string;
  numero: string;
  total: number;
  tipo: string;
  estado: string;
  createdAt: string | null;
  items: { nombre: string; cantidad: number }[];
}

const ESTADO_ESTILO: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  pagada: 'bg-emerald-100 text-emerald-700',
  enviada: 'bg-blue-100 text-blue-700',
  entregada: 'bg-gray-200 text-gray-700',
  cancelada: 'bg-red-100 text-red-700',
};

export default function PedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);

  useEffect(() => {
    api<{ orders: OrderSummary[] }>('/api/orders')
      .then(({ orders }) => setOrders(orders))
      .catch(() => router.replace('/login'));
  }, [router]);

  if (!orders) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-gray-500">Cargando pedidos…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis pedidos</h1>
        <Link href="/cuenta" className="text-sm text-emerald-700 hover:underline">
          ← Mi cuenta
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
          Aún no tienes pedidos.
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{o.numero}</p>
                  <p className="text-xs text-gray-500">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-CO') : ''} ·{' '}
                    {o.items.reduce((s, i) => s + i.cantidad, 0)} producto(s) · {o.tipo}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_ESTILO[o.estado] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {o.estado}
                  </span>
                  <span className="font-semibold text-emerald-700">{formatCOP(o.total)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
