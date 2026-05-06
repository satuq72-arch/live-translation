import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/auth/sign-in');

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', gap: '24px',
        padding: '12px 32px', borderBottom: '1px solid #1f1d35',
        fontFamily: 'monospace',
      }}>
        <span style={{ color: '#e0deff', fontWeight: 700, fontSize: '15px', marginRight: '8px' }}>
          LiveTranslate
        </span>
        <Link href="/dashboard/translate" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none' }}>
          Übersetzen
        </Link>
        <Link href="/dashboard/billing" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none' }}>
          Abrechnung
        </Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
