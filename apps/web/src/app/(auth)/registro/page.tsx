'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@comprafiado/shared';
import { api, ApiError, type PublicUser } from '@/lib/api';
import { Field } from '@/components/field';

export default function RegistroPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    try {
      await api<{ user: PublicUser }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      router.push('/cuenta');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Error de conexión');
    }
  }

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Crear cuenta</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          label="Nombre"
          autoComplete="given-name"
          registration={register('nombre')}
          error={errors.nombre?.message}
        />
        <Field
          label="Apellidos"
          autoComplete="family-name"
          registration={register('apellidos')}
          error={errors.apellidos?.message}
        />
        <Field
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          registration={register('email')}
          error={errors.email?.message}
        />
        <Field
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          registration={register('password')}
          error={errors.password?.message}
        />
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Creando cuenta…' : 'Registrarme'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-emerald-700 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
