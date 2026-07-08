import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-emerald-700">
          CompraFiado
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-gray-700">
          <Link href="/productos" className="hover:text-emerald-700">
            Productos
          </Link>
          <Link href="/cuenta" className="hover:text-emerald-700">
            Mi cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}
