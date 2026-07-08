# CompraFiado — Plan de Trabajo

Ecommerce responsive de venta de productos a crédito (inicialmente ropa y calzado). Los créditos solo se otorgan a residentes de **Tierralta** y **Valencia** (Córdoba, Colombia). Fuera de esas zonas, cualquier persona puede comprar con pago normal.

---

## 1. Stack Tecnológico

### Frontend — `apps/web`
| Tecnología | Uso | Justificación |
|---|---|---|
| **Next.js 15 (App Router)** | Framework | SSR/ISR/RSC → SEO y performance óptimos |
| **Tailwind CSS v4** | Estilos | Cero CSS runtime, purge automático |
| **TypeScript** | Lenguaje | Tipado end-to-end |
| **Zustand** | Estado del carrito (cliente) | ~1 KB, sin boilerplate, no impacta bundle |
| **TanStack Query** | Data fetching en cliente (cuenta, cuotas) | Cache y revalidación; solo en rutas privadas |
| **React Hook Form + Zod** | Formularios (solicitud de crédito, checkout) | Validación performante, schemas compartidos con backend |
| **next/image + next/font** | Imágenes y fuentes | Optimización automática (LCP, CLS) |

> Regla de performance: las rutas públicas (home, catálogo, producto) se renderizan con **Server Components + ISR** — sin JS de librerías de estado ni fetching en el bundle inicial. Zustand/TanStack Query solo se cargan en rutas privadas (cuenta, checkout).

### Backend — `apps/api`
| Tecnología | Uso |
|---|---|
| **Node.js 22 LTS + Express 5 + TypeScript** | API REST |
| **Mongoose 8** | ODM para MongoDB Atlas |
| **Zod** | Validación de request bodies (schemas compartidos con el front vía `packages/shared`) |
| **jsonwebtoken + bcrypt** | Auth JWT (access + refresh en cookies httpOnly) |
| **helmet, cors, express-rate-limit** | Seguridad básica |
| **pino** | Logging estructurado |
| **BullMQ + Redis** (o node-cron si se quiere evitar Redis al inicio) | Jobs: recordatorios de cuotas, reintento de notificaciones |

### Servicios externos
| Servicio | Uso |
|---|---|
| **MongoDB Atlas** | Base de datos |
| **ePayco** | Pasarela de pagos (checkout estándar + webhook de confirmación) |
| **WhatsApp Business Cloud API (Meta)** | Notificaciones de aprobación de crédito y recordatorios de cuotas |
| **Resend** (o Brevo) | Correos transaccionales |
| **Cloudinary** | Imágenes de productos (CDN + transformaciones on-the-fly) |
| **Vercel** | Hosting del frontend |
| **Railway / Render** | Hosting del backend |

### Estructura del monorepo (pnpm workspaces)
```
comprafiado/
├── apps/
│   ├── web/          # Next.js (tienda + cuenta cliente + admin)
│   └── api/          # Express + TypeScript
├── packages/
│   └── shared/       # Schemas Zod, tipos, constantes (municipios, estados)
├── package.json
└── pnpm-workspace.yaml
```

---

## 2. Modelo de Datos (MongoDB)

```
User            → nombre, apellidos, documento, teléfono (WhatsApp), email,
                  passwordHash, municipio, dirección, rol (customer|admin)
Category        → nombre, slug
Product         → nombre, slug, descripción, precio, imágenes, categoría,
                  variantes (talla/color), stock por variante, activo, SEO meta
Cart            → userId | sessionId (invitado), items [{ productId, variante, qty, precio }]
Order           → userId, items snapshot, total, tipo (contado | credito | mixto),
                  abonoInicial, estado (pendiente|pagada|enviada|entregada|cancelada),
                  dirección de envío
CreditApplication → userId, cartSnapshot, total solicitado, abonoInicial,
                    ocupación, tiempoEnCargo, municipio,
                    estado (pendiente|en_revision|aprobada|rechazada),
                    revisadaPor, fechaDecision, notas internas
CreditAccount   → userId, orderId, applicationId, montoFinanciado, tasa,
                  numeroCuotas, estado (activo|pagado|en_mora)
Installment     → creditAccountId, numero, monto, fechaVencimiento,
                  estado (pendiente|pagada|vencida), paymentId
Payment         → orderId | installmentId, monto, medio (epayco),
                  refEpayco, estado (pendiente|aprobado|rechazado), raw webhook
```

**Reglas de negocio clave:**
- Solicitud de crédito requiere: carrito definido + nombre, apellidos, documento, teléfono WhatsApp, email, ocupación y tiempo en el cargo.
- El crédito se calcula sobre el **total del carrito** (menos abono inicial si el cliente elige pago mixto).
- Las cuotas se generan al **aprobar** el crédito, con programación mensual y fecha de pago.
- Municipio ∈ {Tierralta, Valencia} es requisito **solo para crédito**; compras de contado sin restricción geográfica.
- Validación de mayoría de edad en la solicitud.

**⚠️ Definiciones pendientes del negocio (bloquean la fase 6):**
1. ¿Tasa de interés? ¿O crédito sin interés con recargo fijo?
2. ¿Número de cuotas: fijo, elegido por el cliente, o según monto?
3. ¿Monto mínimo/máximo financiable?
4. ¿Abono inicial mínimo en pago mixto (% o valor)?
5. ¿Política de mora (recargo, bloqueo de cuenta)?
6. ¿Se exige entrega del pedido solo tras aprobación, o tras primer pago?

---

## 3. Flujos Principales

### A. Compra de contado (cualquier ubicación)
Carrito → checkout → datos de envío → ePayco (checkout estándar) → webhook confirma → orden pagada → email de confirmación.

### B. Compra 100% a crédito (solo Tierralta/Valencia)
Carrito → "Comprar a crédito" → formulario de solicitud (datos personales + ocupación + tiempo en cargo) → validación de municipio y edad → solicitud en `en_revision` → **panel admin: aprobar/rechazar** → si aprueba: se crea cuenta + orden + plan de cuotas → notificación por **WhatsApp y correo** → cliente recibe pedido → paga cuotas mensuales desde su cuenta (cada cuota se paga vía ePayco).

### C. Pago mixto (abono + crédito)
Igual que B, pero el cliente define un abono inicial; al aprobarse el crédito paga el abono vía ePayco y el saldo restante se difiere en cuotas.

### D. Integración ePayco
- Checkout estándar (onpage/redirect) con `p_cust_id`, firma y referencia única por pago.
- **Webhook de confirmación** (`/api/payments/epayco/confirmation`): validar firma, idempotencia por referencia, actualizar Payment → Order/Installment.
- Página de respuesta (`/pago/respuesta`) solo informativa — la fuente de verdad es el webhook.

---

## 4. Fases de Trabajo

### Fase 0 — Setup (2-3 días) ✅
- [x] Monorepo pnpm, TypeScript, ESLint/Prettier, git
- [x] Next.js + Tailwind configurados; Express + estructura de carpetas
- [x] MongoDB Atlas (cluster, usuario, IP allowlist), variables de entorno
- [x] CI básico (lint + typecheck + build)

### Fase 1 — Auth y usuarios (3-4 días) ✅
- [x] Registro/login (JWT httpOnly + refresh con rotación), recuperación de contraseña
- [x] Perfil de usuario, middleware de roles (customer/admin), script create-admin
- [x] Páginas web: /login, /registro, /recuperar, /restablecer, /cuenta
- Carrito de invitado movido a Fase 3 (requiere modelo de productos)

### Fase 2 — Catálogo (1 semana) ✅
- [x] CRUD de productos/categorías (admin), variantes talla/color, stock
- [x] Carga de imágenes a Cloudinary (upload firmado directo desde el navegador)
- [x] PLP con filtros (categoría, talla, precio, búsqueda) y paginación — ISR
- [x] PDP con galería, selector de variantes — ISR + JSON-LD Product
- [x] Home con hero, categorías y novedades; panel /admin con guard de rol

### Fase 3 — Carrito y checkout de contado (1 semana)
- [ ] Carrito persistente (Zustand + sync a API), carrito de invitado con merge al iniciar sesión
- [ ] Checkout: datos de envío, resumen
- [ ] Integración ePayco: checkout, webhook, página de respuesta, idempotencia
- [ ] Emails transaccionales de orden (Resend)

### Fase 4 — Módulo de crédito (1.5-2 semanas) ← núcleo del negocio
- [ ] Formulario de solicitud (React Hook Form + Zod): datos, ocupación, tiempo en cargo, municipio, mayoría de edad
- [ ] Selección: crédito total vs pago mixto (abono inicial)
- [ ] Motor de cuotas: cálculo del plan mensual al aprobar (según definiciones pendientes)
- [ ] Panel admin: cola de solicitudes, detalle, aprobar/rechazar con notas
- [ ] Al aprobar: crear CreditAccount + Installments + Order; cobrar abono si es mixto

### Fase 5 — Notificaciones (3-4 días)
- [ ] WhatsApp Cloud API: plantillas aprobadas por Meta (aprobación, rechazo, recordatorio de cuota)
- [ ] Emails: aprobación con plan de cuotas, recordatorios
- [ ] Job diario: cuotas próximas a vencer y vencidas (marcar en_mora)

### Fase 6 — Cuenta del cliente (4-5 días)
- [ ] Dashboard: pedidos, crédito activo, plan de cuotas con fechas y estados
- [ ] Pagar cuota individual vía ePayco
- [ ] Historial de pagos

### Fase 7 — Admin completo (1 semana)
- [ ] Dashboard: ventas, créditos activos, cartera, mora
- [ ] Gestión de órdenes (estados de envío), clientes, créditos

### Fase 8 — SEO y performance (3-4 días)
- [ ] Metadata API por ruta, Open Graph, sitemap.xml y robots.txt dinámicos
- [ ] JSON-LD: Product, BreadcrumbList, Organization
- [ ] Canonicals, ISR con revalidación por webhook al editar productos
- [ ] Auditoría Lighthouse ≥ 90 en Performance y SEO; Core Web Vitals

### Fase 9 — QA y lanzamiento (1 semana)
- [ ] Tests: unitarios del motor de cuotas (crítico), integración de webhooks ePayco (modo pruebas), E2E de flujos A/B/C con Playwright
- [ ] Seguridad: rate limiting, sanitización, revisión de manejo de datos personales (Ley 1581 de 2012 — habeas data; se recopilan cédulas y datos financieros → política de tratamiento de datos obligatoria)
- [ ] Deploy producción, dominio, monitoreo (Sentry)

**Estimación total: ~8-9 semanas** (1 desarrollador full-time).

---

## 5. Riesgos y Notas

- **WhatsApp Cloud API** requiere Meta Business verificado y plantillas pre-aprobadas — iniciar ese trámite en la Fase 0 (puede tardar días/semanas).
- **ePayco**: usar modo pruebas hasta Fase 9; el webhook es la única fuente de verdad del estado del pago.
- **Datos sensibles**: cédula + información laboral → cifrado en tránsito (TLS), acceso restringido en admin, política de privacidad visible en el formulario de solicitud.
- **Regulación**: otorgar crédito directo en Colombia puede tener implicaciones legales (tasa de usura certificada por la Superfinanciera). Validar el modelo con un contador/abogado antes del lanzamiento.
