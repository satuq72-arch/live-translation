import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/auth/sign-in');

  return (
    <div style={{ minHeight: '100vh', background: '#09081a', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: '56px',
        background: '#0d0c1f', borderBottom: '1px solid #1e1c3a',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <span style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.3px' }}>
            🎙 LiveTranslate
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Link href="/dashboard/translate" style={{
              color: '#9ca3af', fontSize: '14px', textDecoration: 'none',
              padding: '6px 12px', borderRadius: '6px',
            }}>
              Übersetzen
            </Link>
            <Link href="/dashboard/billing" style={{
              color: '#9ca3af', fontSize: '14px', textDecoration: 'none',
              padding: '6px 12px', borderRadius: '6px',
            }}>
              Abrechnung
            </Link>
          </div>
        </div>
        <UserButton afterSignOutUrl="/auth/sign-in" />
      </nav>
      <main>{children}</main>
    </div>
  );
}
