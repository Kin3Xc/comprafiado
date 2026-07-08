'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createProductSchema, type CreateProductInput } from '@comprafiado/shared';

/** Valores del formulario antes de aplicar defaults del schema. */
type FormValues = z.input<typeof createProductSchema>;
import { api, ApiError } from '@/lib/api';
import type { Categoria, Producto } from '@/lib/catalog';
import { Field } from '@/components/field';

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

async function uploadToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
  const sig = await api<UploadSignature>('/api/uploads/signature');

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Fallo la subida de la imagen');
  const data = await res.json();
  return { url: data.secure_url, publicId: data.public_id };
}

export function ProductForm({ producto }: { producto?: Producto }) {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: producto
      ? {
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          categoriaId: producto.categoria.id,
          imagenes: producto.imagenes,
          variantes: producto.variantes,
          activo: producto.activo,
          destacado: producto.destacado,
        }
      : {
          imagenes: [],
          variantes: [{ talla: '', color: '', stock: 0 }],
          activo: true,
          destacado: false,
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'variantes' });
  const imagenes = watch('imagenes');

  useEffect(() => {
    api<{ categorias: Categoria[] }>('/api/categories')
      .then(({ categorias }) => setCategorias(categorias))
      .catch(() => setServerError('No se pudieron cargar las categorías'));
  }, []);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setServerError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const img = await uploadToCloudinary(file);
        setValue('imagenes', [...(watch('imagenes') ?? []), img], { shouldValidate: true });
      }
    } catch (err) {
      setServerError(
        err instanceof ApiError || err instanceof Error ? err.message : 'Fallo la subida'
      );
    } finally {
      setUploading(false);
    }
  }

  function quitarImagen(publicId: string) {
    setValue(
      'imagenes',
      (imagenes ?? []).filter((i) => i.publicId !== publicId)
    );
  }

  async function onSubmit(data: CreateProductInput) {
    setServerError(null);
    try {
      if (producto) {
        await api(`/api/products/${producto.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        await api('/api/products', { method: 'POST', body: JSON.stringify(data) });
      }
      router.push('/admin/productos');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Error de conexión');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6" noValidate>
      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <Field label="Nombre" registration={register('nombre')} error={errors.nombre?.message} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Descripción</span>
          <textarea
            {...register('descripcion')}
            rows={5}
            className={`w-full rounded-lg border px-3 py-2 text-sm ${
              errors.descripcion ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.descripcion && (
            <span className="mt-1 block text-xs text-red-600">{errors.descripcion.message}</span>
          )}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Precio (COP)"
            type="number"
            registration={register('precio', { valueAsNumber: true })}
            error={errors.precio?.message}
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Categoría</span>
            <select
              {...register('categoriaId')}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${
                errors.categoriaId ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Selecciona…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {errors.categoriaId && (
              <span className="mt-1 block text-xs text-red-600">{errors.categoriaId.message}</span>
            )}
          </label>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('activo')} className="h-4 w-4" />
            Activo (visible en la tienda)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('destacado')} className="h-4 w-4" />
            Destacado
          </label>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Imágenes</h2>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onFiles(e.target.files)}
          className="text-sm"
        />
        {uploading && <p className="mt-2 text-xs text-gray-500">Subiendo…</p>}
        {errors.imagenes && (
          <p className="mt-2 text-xs text-red-600">{errors.imagenes.message}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-3">
          {(imagenes ?? []).map((img) => (
            <div key={img.publicId} className="relative h-24 w-24">
              <Image
                src={img.url}
                alt=""
                fill
                sizes="96px"
                className="rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => quitarImagen(img.publicId)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                aria-label="Quitar imagen"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Variantes (talla / color / stock)</h2>
        {errors.variantes?.message && (
          <p className="mb-2 text-xs text-red-600">{errors.variantes.message}</p>
        )}
        <div className="space-y-3">
          {fields.map((field, i) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="w-24">
                <input
                  {...register(`variantes.${i}.talla`)}
                  placeholder="Talla"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                {errors.variantes?.[i]?.talla && (
                  <span className="text-xs text-red-600">
                    {errors.variantes[i]?.talla?.message}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <input
                  {...register(`variantes.${i}.color`)}
                  placeholder="Color"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                {errors.variantes?.[i]?.color && (
                  <span className="text-xs text-red-600">
                    {errors.variantes[i]?.color?.message}
                  </span>
                )}
              </div>
              <div className="w-24">
                <input
                  {...register(`variantes.${i}.stock`, { valueAsNumber: true })}
                  type="number"
                  min={0}
                  placeholder="Stock"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                {errors.variantes?.[i]?.stock && (
                  <span className="text-xs text-red-600">
                    {errors.variantes[i]?.stock?.message}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={fields.length === 1}
                className="mt-2 text-sm text-red-600 disabled:opacity-30"
                aria-label="Quitar variante"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => append({ talla: '', color: '', stock: 0 })}
          className="mt-3 text-sm font-medium text-emerald-700 hover:underline"
        >
          + Agregar variante
        </button>
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting || uploading}
        className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Guardando…' : producto ? 'Guardar cambios' : 'Crear producto'}
      </button>
    </form>
  );
}
