const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** Formatea COP: 89900 → "$ 89.900". */
export function formatCOP(value: number): string {
  return copFormatter.format(value);
}
