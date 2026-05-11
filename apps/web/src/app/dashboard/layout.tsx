import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { NavLinks } from './components/NavLinks';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/auth/sign-in');

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-20 border-b border-rim bg-page/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-sm font-bold tracking-tight text-violet-300">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <rect x="7" y="3" width="6" height="10" rx="3" />
                <path d="M4 9a6 6 0 0 0 12 0" />
                <line x1="10" y1="15" x2="10" y2="18" />
                <line x1="7" y1="18" x2="13" y2="18" />
              </svg>
              LiveTranslate
            </span>
            <NavLinks />
          </div>
          <UserButton afterSignOutUrl="/auth/sign-in" />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
