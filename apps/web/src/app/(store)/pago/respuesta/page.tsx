import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ ref_payco?: string }>;
}

interface EpaycoValidation {
  success: boolean;
  data?: {
    x_cod_response: string;
    x_response: string;
    x_response_reason_text: string;
    x_id_invoice: string;
    x_amount: number;
  };
}

/** Página informativa: el estado real de la orden lo fija el webhook. */
async function validar(ref: string): Promise<EpaycoValidation | null> {
  try {
    const res = await fetch(`https://secure.epayco.co/validation/v1/reference/${ref}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PagoRespuestaPage({ searchParams }: Props) {
  const { ref_payco } = await searchParams;
  const validation = ref_payco ? await validar(ref_payco) : null;
  const data = validation?.success ? validation.data : undefined;

  const aprobada = data?.x_cod_response === '1';
  const pendiente = data?.x_cod_response === '3';

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      {aprobada ? (
        <>
          <p className="text-5xl">✅</p>
          <h1 className="mt-4 text-2xl font-bold">¡Pago aprobado!</h1>
          <p className="mt-2 text-sm text-gray-600">
            Tu pedido <strong>{data?.x_id_invoice}</strong> quedó confirmado. Te enviamos un correo
            con el detalle.
          </p>
        </>
      ) : pendiente ? (
        <>
          <p className="text-5xl">⏳</p>
          <h1 className="mt-4 text-2xl font-bold">Pago en proceso</h1>
          <p className="mt-2 text-sm text-gray-600">
            Tu pago está pendiente de confirmación. Te avisaremos cuando se apruebe; puedes revisar
            el estado en tus pedidos.
          </p>
        </>
      ) : data ? (
        <>
          <p className="text-5xl">❌</p>
          <h1 className="mt-4 text-2xl font-bold">Pago no aprobado</h1>
          <p className="mt-2 text-sm text-gray-600">
            {data.x_response_reason_text || 'La transacción fue rechazada.'} Puedes intentar de
            nuevo desde el catálogo.
          </p>
        </>
      ) : (
        <>
          <p className="text-5xl">ℹ️</p>
          <h1 className="mt-4 text-2xl font-bold">Sin información del pago</h1>
          <p className="mt-2 text-sm text-gray-600">
            No pudimos consultar la transacción. Revisa el estado en tus pedidos.
          </p>
        </>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/cuenta/pedidos"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Ver mis pedidos
        </Link>
        <Link
          href="/productos"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-emerald-600"
        >
          Seguir comprando
        </Link>
      </div>
    </main>
  );
}
