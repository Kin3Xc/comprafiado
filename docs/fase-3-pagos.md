# Fase 3 — Carrito y pagos con ePayco

Documentación técnica del flujo de compra de contado.

## Arquitectura del flujo

```
Cliente                    Web (Next.js)              API (Express)               ePayco
  │                           │                           │                         │
  │ agrega producto           │  POST /api/cart/items     │                         │
  │──────────────────────────>│──────────────────────────>│ (cookie cart_session    │
  │                           │                           │  si es invitado)        │
  │ inicia sesión             │  POST /api/auth/login     │ merge carrito invitado  │
  │──────────────────────────>│──────────────────────────>│ → carrito del usuario   │
  │ checkout (envío)          │  POST /api/orders         │ crea Order 'pendiente'  │
  │──────────────────────────>│──────────────────────────>│ vacía carrito           │
  │                           │<──── order + epayco ──────│                         │
  │ paga en el modal          │  checkout.js abre modal   │                         │
  │──────────────────────────────────────────────────────────────────────────────>│
  │                           │                           │  POST /confirmation     │
  │                           │                           │<────────────────────────│
  │                           │                           │ valida firma + monto    │
  │                           │                           │ Order → 'pagada'        │
  │                           │                           │ descuenta stock         │
  │                           │                           │ envía email             │
  │ redirigido                │  /pago/respuesta          │                         │
  │<──────────────────────────│ (solo informativa)        │                         │
```

**Fuente de verdad**: el webhook de confirmación. La página `/pago/respuesta` solo consulta el estado en ePayco para mostrarlo; nunca modifica la orden.

## Carrito

- **Invitado**: cookie httpOnly `cart_session` (UUID, 90 días). El documento `Cart` guarda `sessionId`.
- **Autenticado**: `Cart` con `userId`.
- **Merge**: al hacer login/registro, los ítems del carrito de invitado se suman al del usuario (tope 10 por ítem) y el de invitado se elimina.
- Los precios **no** se guardan en el carrito: se leen del producto en cada consulta. Se congelan (`precioUnitario`) al crear la orden.
- Carritos inactivos expiran a los 90 días (índice TTL).

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/cart` | Carrito actual (invitado o usuario) con precios/stock vivos |
| POST | `/api/cart/items` | Agrega ítem `{productoId, talla, color, cantidad}` (incrementa si existe) |
| PATCH | `/api/cart/items` | Fija cantidad exacta; `cantidad: 0` elimina |

## Órdenes

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/orders` | Crea orden de contado desde el carrito (requiere sesión). Devuelve `{order, epayco}` |
| GET | `/api/orders` | Mis pedidos |
| GET | `/api/orders/:numero` | Detalle de mi pedido |

- Número de orden: `CF-<timestamp36><hex>` — es el `invoice` en ePayco.
- Al crear la orden se **valida** stock pero se descuenta solo cuando el pago se confirma.
- El carrito se vacía al crear la orden.

### Estados de la orden

`pendiente` → (webhook aprobado) → `pagada` → `enviada` → `entregada`
`pendiente` → (webhook rechazado) → `cancelada`

## Webhook de confirmación

`POST /api/payments/epayco/confirmation` (form-urlencoded).

Validaciones en orden:
1. **Firma**: `sha256(p_cust_id ^ p_key ^ x_ref_payco ^ x_transaction_id ^ x_amount ^ x_currency_code)` debe coincidir con `x_signature`. Si no → 403.
2. **Idempotencia**: `x_ref_payco` es único (`Payment.refEpayco`). Referencia ya procesada con estado final → 200 sin efectos.
3. **Orden**: `x_id_invoice` debe existir como `Order.numero`.
4. **Monto**: `x_amount` debe ser igual al total de la orden — un pago manipulado no la marca pagada.

Códigos `x_cod_response`: `1` aceptada, `2` rechazada, `3` pendiente, `4` fallida.

Efectos con pago aceptado: orden → `pagada`, stock descontado por variante (guard `$gte` evita negativos; si otro pago consumió el stock queda warning en el log), email de confirmación al cliente.

## Configuración de ePayco — paso a paso

1. **Crear cuenta**: https://epayco.co → "Crea tu cuenta". Piden datos del comercio (para producción, RUT/cámara de comercio).
2. **Obtener llaves**: Dashboard → *Integraciones → Llaves API*. Son 3:
   - `PUBLIC_KEY` → `EPAYCO_PUBLIC_KEY` (abre el checkout en el navegador)
   - `P_CUST_ID_CLIENTE` → `EPAYCO_P_CUST_ID` (valida firma del webhook)
   - `P_KEY` → `EPAYCO_P_KEY` (valida firma del webhook)
3. **Modo pruebas**: `EPAYCO_TEST_MODE=true`. Tarjetas de prueba (documentación oficial: https://docs.epayco.com):
   - Aprobada: `4575 6231 8229 0326`, CVC `123`, fecha futura
   - Rechazada: `4151 6113 6055 3298`, CVC `123`, fecha futura
4. **Webhook en desarrollo local**: ePayco necesita alcanzar la API desde internet.
   ```bash
   ngrok http 4000        # o: cloudflared tunnel --url http://localhost:4000
   ```
   Poner la URL pública en `apps/api/.env` → `API_PUBLIC_URL=https://xxxx.ngrok.io` y reiniciar la API. La URL de confirmación se envía por transacción (no hay que configurarla en el dashboard).
5. **Probar el ciclo completo**: agregar al carrito → checkout → pagar con tarjeta de prueba aprobada → verificar: orden `pagada` en `/cuenta/pedidos`, stock descontado, email en el log de la API (o en Resend).
6. **Producción**: `EPAYCO_TEST_MODE=false`, comercio verificado por ePayco, `API_PUBLIC_URL` con el dominio real.

## Variables de entorno nuevas (Fase 3)

| Variable | App | Descripción |
|---|---|---|
| `API_PUBLIC_URL` | api | URL pública de la API para el webhook |
| `EPAYCO_PUBLIC_KEY` | api | Llave pública (checkout) |
| `EPAYCO_P_CUST_ID` | api | ID de cliente (firma webhook) |
| `EPAYCO_P_KEY` | api | Llave secreta (firma webhook) |
| `EPAYCO_TEST_MODE` | api | `true`/`false` |

## Limitaciones conocidas / mejoras futuras

- Pago rechazado cancela la orden y el carrito ya se vació — el cliente debe armar el carrito de nuevo. Mejora: botón "reintentar pago" en pedidos pendientes.
- El stock se descuenta al confirmar el pago, no al crear la orden: dos clientes pueden pagar el último ítem casi a la vez (queda warning en log para gestión manual). Mejora: reserva temporal de stock.
- ePayco también reintenta webhooks fallidos; la idempotencia por `x_ref_payco` cubre reintentos.
