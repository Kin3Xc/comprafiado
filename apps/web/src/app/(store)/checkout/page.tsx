'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { shippingSchema, type ShippingInput } from '@comprafiado/shared';
import { api, ApiError, type PublicUser } from '@/lib/api';
import { useCart } from '@/lib/cart-store';
import { formatCOP } from '@/lib/format';
import { openEpaycoCheckout, type EpaycoCheckoutData } from '@/lib/epayco';
import { Field } from '@/components/field';

interface OrderResponse {
  order: { numero: string; total: number };
  epayco: EpaycoCheckoutData;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, loaded, fetch, reset } = useCart();
  const [serverError, setServerError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<ShippingInput>({ resolver: zodResolver(shippingSchema) });

  useEffect(() => {
    // Requiere sesión: prellena el envío desde el perfil o redirige a login.
    api<{ user: PublicUser }>('/api/users/me')
      .then(({ user }) => {
        resetForm({
          nombre: `${user.nombre} ${user.apellidos}`,
          telefono: user.telefonoWhatsapp ?? undefined,
          municipio: user.municipio ?? undefined,
          direccion: user.direccion ?? undefined,
        });
      })
      .catch(() => router.replace('/login'));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga async inicial
    fetch().catch(() => {});
  }, [router, resetForm, fetch]);

  async function onSubmit(envio: ShippingInput) {
    setServerError(null);
    setProcesando(true);
    try {
      const { epayco } = await api<OrderResponse>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ envio }),
      });
      reset(); // el carrito quedó consumido por la orden
      await openEpaycoCheckout(epayco);
    } catch (err) {
      setServerError(
        err instanceof ApiError || err instanceof Error ? err.message : 'Error de conexión'
      );
    } finally {
      setProcesando(false);
    }
  }

  if (loaded && items.length === 0 && !procesando) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-gray-600">Tu carrito está vacío.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Finalizar compra</h1>

      <section className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Resumen</h2>
        <ul className="space-y-1 text-sm text-gray-700">
          {items.map((i) => (
            <li key={`${i.productoId}-${i.talla}-${i.color}`} className="flex justify-between">
              <span>
                {i.nombre} ({i.talla}/{i.color}) × {i.cantidad}
              </span>
              <span>{formatCOP(i.precio * i.cantidad)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 font-bold">
          <span>Total a pagar</span>
          <span className="text-emerald-700">{formatCOP(subtotal)}</span>
        </div>
      </section>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-xl bg-white p-6 shadow-sm"
        noValidate
      >
        <h2 className="text-sm font-semibold">Datos de envío</h2>
        <Field
          label="Nombre de quien recibe"
          registration={register('nombre')}
          error={errors.nombre?.message}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Celular"
            type="tel"
            placeholder="3001234567"
            registration={register('telefono')}
            error={errors.telefono?.message}
          />
          <Field
            label="Municipio"
            registration={register('municipio')}
            error={errors.municipio?.message}
          />
        </div>
        <Field
          label="Dirección"
          registration={register('direccion')}
          error={errors.direccion?.message}
        />
        <Field
          label="Notas para la entrega (opcional)"
          registration={register('notas')}
          error={errors.notas?.message}
        />

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <button
          type="submit"
          disabled={procesando}
          className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {procesando ? 'Procesando…' : `Pagar ${formatCOP(subtotal)} con ePayco`}
        </button>
        <p className="text-xs text-gray-500">
          Se abrirá la pasarela segura de ePayco para completar el pago.
        </p>
      </form>
    </main>
  );
}
