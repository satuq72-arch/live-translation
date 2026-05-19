'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard/translate', label: 'Translate' },
  { href: '/dashboard/billing',   label: 'Billing' },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1">
      {links.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150',
              active
                ? 'bg-indigo-600/20 text-indigo-300'
                : 'text-muted hover:bg-white/5 hover:text-prose',
            ].join(' ')}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
