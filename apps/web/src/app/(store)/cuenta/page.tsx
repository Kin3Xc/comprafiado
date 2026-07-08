'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileInput } from '@comprafiado/shared';
import { api, ApiError, type PublicUser } from '@/lib/api';
import { Field } from '@/components/field';

export default function CuentaPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({ resolver: zodResolver(updateProfileSchema) });

  useEffect(() => {
    api<{ user: PublicUser }>('/api/users/me')
      .then(({ user }) => {
        setUser(user);
        reset({
          nombre: user.nombre,
          apellidos: user.apellidos,
          telefonoWhatsapp: user.telefonoWhatsapp ?? undefined,
          documento: user.documento ?? undefined,
          municipio: user.municipio ?? undefined,
          direccion: user.direccion ?? undefined,
        });
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [reset, router]);

  async function onSubmit(data: UpdateProfileInput) {
    setMessage(null);
    try {
      const { user } = await api<{ user: PublicUser }>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      setUser(user);
      setMessage({ type: 'ok', text: 'Perfil actualizado' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'Error de conexión',
      });
    }
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Cargando…</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi cuenta</h1>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/cuenta/pedidos"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Mis pedidos
          </Link>
          <button
            onClick={logout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Datos personales</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" registration={register('nombre')} error={errors.nombre?.message} />
            <Field
              label="Apellidos"
              registration={register('apellidos')}
              error={errors.apellidos?.message}
            />
            <Field
              label="Celular (WhatsApp)"
              type="tel"
              placeholder="3001234567"
              registration={register('telefonoWhatsapp')}
              error={errors.telefonoWhatsapp?.message}
            />
            <Field
              label="Documento de identidad"
              inputMode="numeric"
              registration={register('documento')}
              error={errors.documento?.message}
            />
            <Field
              label="Municipio"
              placeholder="Tierralta"
              registration={register('municipio')}
              error={errors.municipio?.message}
            />
            <Field
              label="Dirección"
              registration={register('direccion')}
              error={errors.direccion?.message}
            />
          </div>
          {message && (
            <p
              className={`text-sm ${message.type === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </section>
    </main>
  );
}
