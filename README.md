# CompraFiado

Ecommerce de venta de productos a crédito para Tierralta y Valencia (Córdoba, Colombia). Compras de contado disponibles sin restricción geográfica.

Plan de trabajo completo: [PLAN.md](./PLAN.md)

## Estructura

```
apps/
  web/       # Next.js 16 + Tailwind v4 (tienda, cuenta cliente, admin)
  api/       # Express 5 + TypeScript + Mongoose (API REST)
packages/
  shared/    # Schemas Zod, tipos y constantes compartidas
```

## Requisitos

- Node.js >= 22
- pnpm >= 11 (`npm install -g pnpm`)
- Cuenta en MongoDB Atlas

## Desarrollo

```bash
pnpm install

# variables de entorno
cp apps/api/.env.example apps/api/.env    # completar MONGODB_URI
cp apps/web/.env.example apps/web/.env.local

# compilar el paquete compartido (primera vez)
pnpm --filter @comprafiado/shared build

# levantar web (:3000) y api (:4000) en paralelo
pnpm dev
```

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Web y API en modo desarrollo |
| `pnpm build` | Build de producción (shared → apps) |
| `pnpm lint` | ESLint en todos los paquetes |
| `pnpm typecheck` | TypeScript sin emitir |
| `pnpm format` | Prettier |
