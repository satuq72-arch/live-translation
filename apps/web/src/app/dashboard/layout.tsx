import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { NavLinks } from './components/NavLinks';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/auth/sign-in');

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-20 border-b border-rim bg-page/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-5">
            <span
              className="text-sm font-bold tracking-tight"
              style={{ background: 'linear-gradient(90deg,#a5b4fc,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
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
