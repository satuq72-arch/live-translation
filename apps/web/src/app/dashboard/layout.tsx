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
            <span className="text-sm font-bold tracking-tight text-violet-300">
              🎙 LiveTranslate
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
