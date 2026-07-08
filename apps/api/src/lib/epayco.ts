import { createHash } from 'node:crypto';
import { env } from '../config/env.js';

export const epaycoConfigured = Boolean(
  env.EPAYCO_PUBLIC_KEY && env.EPAYCO_P_CUST_ID && env.EPAYCO_P_KEY
);

/**
 * Datos para abrir el checkout de ePayco en el navegador.
 * El total se envía en COP sin decimales.
 */
export function buildCheckoutData(order: { numero: string; total: number; items: number }) {
  return {
    key: env.EPAYCO_PUBLIC_KEY!,
    test: env.EPAYCO_TEST_MODE,
    name: `Pedido ${order.numero}`,
    description: `CompraFiado — ${order.items} producto(s)`,
    invoice: order.numero,
    currency: 'cop',
    amount: String(order.total),
    tax_base: '0',
    tax: '0',
    country: 'co',
    lang: 'es',
    external: 'false',
    response: `${env.WEB_URL}/pago/respuesta`,
    confirmation: `${env.API_PUBLIC_URL}/api/payments/epayco/confirmation`,
    methodconfirmation: 'post',
  };
}

/**
 * Valida la firma del webhook de confirmación:
 * sha256(p_cust_id ^ p_key ^ x_ref_payco ^ x_transaction_id ^ x_amount ^ x_currency_code)
 */
export function isValidSignature(body: Record<string, string>): boolean {
  const cadena = [
    env.EPAYCO_P_CUST_ID,
    env.EPAYCO_P_KEY,
    body.x_ref_payco,
    body.x_transaction_id,
    body.x_amount,
    body.x_currency_code,
  ].join('^');

  const esperada = createHash('sha256').update(cadena).digest('hex');
  return esperada === body.x_signature;
}

/** Códigos de respuesta de ePayco (x_cod_response). */
export const EPAYCO_COD = {
  ACEPTADA: '1',
  RECHAZADA: '2',
  PENDIENTE: '3',
  FALLIDA: '4',
} as const;
