'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@comprafiado/shared';
import { api, ApiError } from '@/lib/api';
import { Field } from '@/components/field';

export default function RecuperarPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: ForgotPasswordInput) {
    setServerError(null);
    try {
      await api('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) });
      setSent(true);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Error de conexión');
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-gray-700">
        Si el correo existe, enviamos un enlace de recuperación. Revisa tu bandeja de entrada.
      </p>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-xl font-semibold text-gray-900">Recuperar contraseña</h1>
      <p className="mb-6 text-sm text-gray-600">
        Te enviaremos un enlace para restablecerla (vence en 1 hora).
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          registration={register('email')}
          error={errors.email?.message}
        />
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-emerald-700 hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </>
  );
}
