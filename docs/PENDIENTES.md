# Pendientes de configuración — CompraFiado

Checklist de todo lo que falta configurar/decidir para que la plataforma funcione de punta a punta. Marcar al completar.

---

## 1. Infraestructura (ya operativa ✅)

- [x] MongoDB Atlas — cluster creado, `MONGODB_URI` en `apps/api/.env`
- [x] Secretos JWT (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)
- [x] Repositorio GitHub + CI (lint, typecheck, build en push a `main`/`develop`)

## 2. Cuenta admin

- [ ] Crear el usuario administrador real:
  ```bash
  cd apps/api
  npx tsx src/scripts/create-admin.ts tu@correo.com TuContraseñaSegura "Tu Nombre" "Tus Apellidos"
  ```

## 3. Cloudinary (imágenes de productos) — Fase 2

- [ ] Crear cuenta gratuita en https://cloudinary.com
- [ ] Dashboard → copiar **Cloud name**, **API Key**, **API Secret**
- [ ] Pegar en `apps/api/.env`:
  ```
  CLOUDINARY_CLOUD_NAME=...
  CLOUDINARY_API_KEY=...
  CLOUDINARY_API_SECRET=...
  ```
- [ ] Probar: `/admin/productos/nuevo` → subir una imagen

## 4. ePayco (pagos) — Fase 3

Ver guía completa en [docs/fase-3-pagos.md](./fase-3-pagos.md).

- [ ] Crear cuenta en https://epayco.co (requiere datos del comercio)
- [ ] Dashboard → Integraciones → Llaves API: copiar **PUBLIC_KEY**, **P_CUST_ID_CLIENTE**, **P_KEY**
- [ ] Pegar en `apps/api/.env`:
  ```
  EPAYCO_PUBLIC_KEY=...
  EPAYCO_P_CUST_ID=...
  EPAYCO_P_KEY=...
  EPAYCO_TEST_MODE=true
  ```
- [ ] Para probar el webhook en local: túnel público (`ngrok http 4000` o `cloudflared tunnel --url http://localhost:4000`) y poner esa URL en `API_PUBLIC_URL` del `.env`
- [ ] Hacer una compra de prueba con tarjetas de prueba de ePayco (ver guía)
- [ ] Antes de producción: `EPAYCO_TEST_MODE=false` y verificar el comercio ante ePayco

## 5. Resend (correos transaccionales) — Fase 3

- [ ] Crear cuenta en https://resend.com
- [ ] Verificar dominio propio (o usar `onboarding@resend.dev` solo para pruebas)
- [ ] Pegar en `apps/api/.env`:
  ```
  RESEND_API_KEY=re_...
  EMAIL_FROM=CompraFiado <pedidos@tudominio.com>
  ```
- Sin API key los correos solo se escriben en el log de la API (modo dev).

## 6. WhatsApp Business Cloud API — Fase 5 (⚠️ trámite lento, iniciar ya)

- [ ] Crear app en https://developers.facebook.com (tipo Business)
- [ ] Vincular/crear cuenta de **Meta Business** y verificarla (puede tardar días/semanas)
- [ ] Agregar producto "WhatsApp" a la app → obtener `WHATSAPP_TOKEN` permanente y `WHATSAPP_PHONE_NUMBER_ID`
- [ ] Registrar número de teléfono del negocio
- [ ] Crear y enviar a aprobación las plantillas de mensaje:
  - Aprobación de crédito
  - Rechazo de solicitud
  - Recordatorio de cuota próxima a vencer
  - Cuota vencida

## 7. Decisiones de negocio (bloquean Fase 4 — módulo de crédito)

- [ ] ¿Tasa de interés o recargo fijo por financiación?
- [ ] ¿Número de cuotas: fijo, elegido por el cliente, o según monto?
- [ ] ¿Monto mínimo/máximo financiable?
- [ ] ¿Abono inicial mínimo en pago mixto (% o valor)?
- [ ] ¿Política de mora (recargo, bloqueo)?
- [ ] ¿La entrega del pedido es tras aprobación o tras primer pago?
- [ ] Validar modelo legal: tasa de usura (Superfinanciera) y política de tratamiento de datos (Ley 1581 de 2012)

## 8. Producción (Fase 9)

- [ ] Dominio propio
- [ ] Deploy web en Vercel (`API_URL`, `SITE_URL` como env vars)
- [ ] Deploy API en Railway/Render (`.env` completo, `NODE_ENV=production`)
- [ ] `API_PUBLIC_URL` = URL pública real de la API (para el webhook de ePayco)
- [ ] `CORS_ORIGIN` y `WEB_URL` = dominio real
- [ ] Atlas: IP allowlist del hosting de la API
- [ ] Sentry u otro monitoreo
