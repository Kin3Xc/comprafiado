import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'CompraFiado — Compra a crédito en Tierralta y Valencia',
    template: '%s | CompraFiado',
  },
  description:
    'Ropa y calzado a crédito en Tierralta y Valencia (Córdoba). Solicita tu cupo, paga en cuotas mensuales y recibe tu pedido.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
