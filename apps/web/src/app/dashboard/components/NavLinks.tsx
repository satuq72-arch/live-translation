'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard/translate', label: 'Übersetzen' },
  { href: '/dashboard/billing',   label: 'Abrechnung' },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1">
      {links.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              active
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
