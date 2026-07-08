'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import { Field } from '@/components/field';

const formSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
});
type FormInput = z.infer<typeof formSchema>;

function RestablecerForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({ resolver: zodResolver(formSchema) });

  if (!token || !email) {
    return (
      <p className="text-sm text-gray-700">
        Enlace inválido.{' '}
        <Link href="/recuperar" className="text-emerald-700 hover:underline">
          Solicita uno nuevo
        </Link>
        .
      </p>
    );
  }

  async function onSubmit(data: FormInput) {
    setServerError(null);
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, token, password: data.password }),
      });
      router.push('/login');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Error de conexión');
    }
  }

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Nueva contraseña</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          label="Nueva contraseña"
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
          {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </>
  );
}

export default function RestablecerPage() {
  return (
    <Suspense>
      <RestablecerForm />
    </Suspense>
  );
}
