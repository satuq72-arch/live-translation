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

const API  = process.env.NEXT_PUBLIC_API_URL!.replace(/\/$/, '');
const font = "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif";

const card: React.CSSProperties = {
  background: '#111029', border: '1px solid #1e1c3a', borderRadius: '16px',
  padding: '24px', marginBottom: '16px',
};
const label: React.CSSProperties = {
  color: '#6b7280', fontSize: '11px', fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px',
};
const bigNum: React.CSSProperties = { color: '#e0deff', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' };

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
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setError('Checkout konnte nicht gestartet werden.');
      setWorking(false);
    }
  }

  async function handlePortal() {
    setWorking(true);
    setError(null);
    try {
      const token = await getToken();
      const res   = await fetch(`${API}/stripe/create-portal`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setError('Portal konnte nicht geöffnet werden.');
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '64px 32px', fontFamily: font, color: '#4b4870' }}>
        Lade…
      </div>
    );
  }

  const freeRemaining = status?.freeTierRemaining ?? 30;
  const freePct       = Math.round((freeRemaining / 30) * 100);

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 32px', fontFamily: font }}>

      <h1 style={{ color: '#e0deff', fontSize: '22px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.4px' }}>
        Abrechnung
      </h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>
        Verwalte deinen Plan und sieh deine Nutzung.
      </p>

      {justSubscribed && (
        <div style={{ ...card, background: '#0a1f15', border: '1px solid #16422d', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🎉</span>
            <div>
              <div style={{ color: '#34d399', fontWeight: 600, fontSize: '15px' }}>Willkommen im Pro Plan!</div>
              <div style={{ color: '#6b9e87', fontSize: '13px', marginTop: '2px' }}>Unbegrenzte Übersetzungen ab sofort.</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ ...card, background: '#1f0a0a', border: '1px solid #3a1010', marginBottom: '16px' }}>
          <div style={{ color: '#f87171', fontSize: '13px' }}>{error}</div>
        </div>
      )}

      {/* Plan */}
      <div style={card}>
        <div style={label}>Aktueller Plan</div>

        {status?.isSubscribed ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ ...bigNum, color: '#a78bfa' }}>Pro</span>
              <span style={{
                background: '#1a2e1a', color: '#34d399', fontSize: '11px', fontWeight: 600,
                padding: '2px 8px', borderRadius: '20px', border: '1px solid #1f4a1f',
              }}>aktiv</span>
            </div>
            {status.periodEnd && (
              <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>
                Verlängert am {new Date(status.periodEnd).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
            <button
              onClick={handlePortal} disabled={working}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: '1px solid #2a2860',
                background: 'transparent', color: '#a5b4fc', fontSize: '13px', fontWeight: 500,
                cursor: working ? 'not-allowed' : 'pointer', opacity: working ? 0.6 : 1,
              }}
            >
              {working ? 'Öffne Portal…' : 'Abo verwalten →'}
            </button>
          </>
        ) : status?.freeTierUsed ? (
          <>
            <div style={{ ...bigNum, color: '#f87171', marginBottom: '8px' }}>Limit erreicht</div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>
              Deine 30 kostenlosen Minuten sind aufgebraucht.
            </div>
            <button
              onClick={handleCheckout} disabled={working}
              style={{
                padding: '12px 24px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white', fontSize: '14px', fontWeight: 600,
                cursor: working ? 'not-allowed' : 'pointer', opacity: working ? 0.6 : 1,
                boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
              }}
            >
              {working ? 'Weiterleitung…' : 'Jetzt upgraden — €0,05 / Min'}
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
              <span style={bigNum}>{freeRemaining}</span>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>/ 30 Min übrig</span>
            </div>
            <div style={{ background: '#1a1840', borderRadius: '6px', height: '6px', marginBottom: '20px', overflow: 'hidden' }}>
              <div style={{
                width: `${freePct}%`, height: '100%', borderRadius: '6px',
                background: freePct > 30 ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : '#ef4444',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <button
              onClick={handleCheckout} disabled={working}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: '1px solid #2a2860',
                background: 'transparent', color: '#a5b4fc', fontSize: '13px', fontWeight: 500,
                cursor: working ? 'not-allowed' : 'pointer', opacity: working ? 0.6 : 1,
              }}
            >
              {working ? 'Weiterleitung…' : 'Auf Pro upgraden — €0,05 / Min'}
            </button>
          </>
        )}
      </div>

      {/* Nutzung */}
      <div style={{ ...card, display: 'flex', gap: '0', padding: 0, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '20px 24px', borderRight: '1px solid #1e1c3a' }}>
          <div style={label}>Übersetzt gesamt</div>
          <div style={bigNum}>{status?.unitsUsed ?? 0}<span style={{ fontSize: '16px', color: '#6b7280', fontWeight: 400 }}> Min</span></div>
        </div>
        {status?.isSubscribed && (
          <div style={{ flex: 1, padding: '20px 24px' }}>
            <div style={label}>Kosten diesen Monat</div>
            <div style={bigNum}>€<span>{(status?.estimatedCost ?? 0).toFixed(2)}</span></div>
          </div>
        )}
      </div>

      <button
        onClick={() => router.push('/dashboard/translate')}
        style={{ background: 'none', border: 'none', color: '#4b4870', cursor: 'pointer', fontSize: '13px', padding: '8px 0', marginTop: '8px' }}
      >
        ← Zurück zur Übersetzung
      </button>
    </div>
  );
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>;
}
