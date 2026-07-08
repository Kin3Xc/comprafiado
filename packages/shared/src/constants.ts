/** Municipios donde se pueden otorgar créditos. */
export const CREDIT_MUNICIPALITIES = ['tierralta', 'valencia'] as const;
export type CreditMunicipality = (typeof CREDIT_MUNICIPALITIES)[number];

export const ORDER_TYPES = ['contado', 'credito', 'mixto'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = [
  'pendiente',
  'pagada',
  'enviada',
  'entregada',
  'cancelada',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CREDIT_APPLICATION_STATUSES = [
  'pendiente',
  'en_revision',
  'aprobada',
  'rechazada',
] as const;
export type CreditApplicationStatus = (typeof CREDIT_APPLICATION_STATUSES)[number];

export const CREDIT_ACCOUNT_STATUSES = ['activo', 'pagado', 'en_mora'] as const;
export type CreditAccountStatus = (typeof CREDIT_ACCOUNT_STATUSES)[number];

export const INSTALLMENT_STATUSES = ['pendiente', 'pagada', 'vencida'] as const;
export type InstallmentStatus = (typeof INSTALLMENT_STATUSES)[number];

export const PAYMENT_STATUSES = ['pendiente', 'aprobado', 'rechazado'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const USER_ROLES = ['customer', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Edad mínima para solicitar crédito. */
export const MIN_CREDIT_AGE = 18;
