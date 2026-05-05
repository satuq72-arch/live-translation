'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface BillingStatus {
  freeTierRemaining: number;
  freeTierUsed:      boolean;
  isSubscribed:      boolean;
  periodEnd:         string | null;
  unitsUsed:         number;
  estimatedCost:     number;
}

const API = process.env.NEXT_PUBLIC_API_URL!.replace(/\/$/, '');

function BillingContent() {
  const { getToken } = useAuth();
  const router       = useRouter();
  const params       = useSearchParams();
  const [status, setStatus]   = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const justSubscribed        = params.get('success') === 'true';

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res   = await fetch(`${API}/usage/billing-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStatus(await res.json());
      } catch {
        setError('Statusabfrage fehlgeschlagen. Bitte Seite neu laden.');
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  async function handleCheckout() {
    setWorking(true);
    setError(null);
    try {
      const token = await getToken();
      const res   = await fetch(`${API}/stripe/create-checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setError('Checkout konnte nicht gestartet werden. Bitte erneut versuchen.');
      setWorking(false);
    }
  }

  async function handlePortal() {
    setWorking(true);
    setError(null);
    try {
      const token = await getToken();
      const res   = await fetch(`${API}/stripe/create-portal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setError('Portal konnte nicht geöffnet werden. Bitte erneut versuchen.');
      setWorking(false);
    }
  }

  const s: React.CSSProperties = {
    maxWidth: '600px', margin: '0 auto', padding: '32px', fontFamily: 'monospace',
  };
  const card: React.CSSProperties = {
    background: '#0f0e1a', border: '1px solid #1f1d35', borderRadius: '12px',
    padding: '24px', marginBottom: '20px',
  };
  const label: React.CSSProperties = { color: '#6b7280', fontSize: '12px', marginBottom: '4px' };
  const value: React.CSSProperties = { color: '#e0deff', fontSize: '22px', fontWeight: 600 };
  const btn = (primary: boolean): React.CSSProperties => ({
    padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: working ? 'not-allowed' : 'pointer',
    background: primary ? '#4f46e5' : '#1f1d35', color: 'white', fontSize: '14px',
    opacity: working ? 0.6 : 1, transition: 'opacity 0.2s',
  });

  if (loading) {
    return <div style={{ ...s, color: '#6b7280' }}>Lade Abrechnungsdaten…</div>;
  }

  return (
    <div style={s}>
      <h1 style={{ color: '#e0deff', marginBottom: '32px', fontSize: '20px' }}>Abrechnung</h1>

      {justSubscribed && (
        <div style={{ ...card, background: '#0a1f0a', border: '1px solid #1a3a1a', marginBottom: '20px' }}>
          <div style={{ color: '#4ade80', fontSize: '15px' }}>
            Abonnement aktiviert. Danke!
          </div>
        </div>
      )}

      {error && (
        <div style={{ ...card, background: '#1f0000', border: '1px solid #3f0000', marginBottom: '20px' }}>
          <div style={{ color: '#ef4444', fontSize: '13px' }}>{error}</div>
        </div>
      )}

      {/* Plan Status */}
      <div style={card}>
        <div style={{ ...label, marginBottom: '12px' }}>AKTUELLER PLAN</div>

        {status?.isSubscribed ? (
          <>
            <div style={{ ...value, color: '#4ade80', marginBottom: '8px' }}>Pro Plan aktiv</div>
            {status.periodEnd && (
              <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>
                Nächste Verlängerung: {new Date(status.periodEnd).toLocaleDateString('de-DE')}
              </div>
            )}
            <button style={btn(false)} onClick={handlePortal} disabled={working}>
              {working ? 'Öffne Portal…' : 'Abo verwalten'}
            </button>
          </>
        ) : status?.freeTierUsed ? (
          <>
            <div style={{ ...value, color: '#ef4444', marginBottom: '8px' }}>Free Tier aufgebraucht</div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>
              30 kostenlose Minuten verbraucht. Abonniere, um weiter zu übersetzen.
            </div>
            <button style={btn(true)} onClick={handleCheckout} disabled={working}>
              {working ? 'Weiterleitung…' : 'Jetzt abonnieren — €0,05 / Minute'}
            </button>
          </>
        ) : (
          <>
            <div style={{ ...value, marginBottom: '8px' }}>Free Tier</div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>
              Noch {status?.freeTierRemaining ?? 30} kostenlose Minuten verfügbar.
            </div>
            <button style={btn(false)} onClick={handleCheckout} disabled={working}>
              {working ? 'Weiterleitung…' : 'Auf Pro upgraden — €0,05 / Minute'}
            </button>
          </>
        )}
      </div>

      {/* Usage */}
      <div style={card}>
        <div style={{ ...label, marginBottom: '16px' }}>NUTZUNG GESAMT</div>
        <div style={{ display: 'flex', gap: '32px' }}>
          <div>
            <div style={label}>Übersetzt</div>
            <div style={value}>{status?.unitsUsed ?? 0} Min</div>
          </div>
          {status?.isSubscribed && (
            <div>
              <div style={label}>Geschätzte Kosten</div>
              <div style={value}>€{(status?.estimatedCost ?? 0).toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>

      <button
        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', padding: 0 }}
        onClick={() => router.push('/dashboard/translate')}
      >
        ← Zurück zur Übersetzung
      </button>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  );
}
