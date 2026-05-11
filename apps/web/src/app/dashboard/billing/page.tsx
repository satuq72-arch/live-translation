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

  async function callApi(path: string) {
    setWorking(true);
    setError(null);
    try {
      const token = await getToken();
      const res   = await fetch(`${API}${path}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setError('Anfrage fehlgeschlagen. Bitte erneut versuchen.');
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const freeRemaining = status?.freeTierRemaining ?? 30;
  const freePct       = Math.min(100, Math.round((freeRemaining / 30) * 100));

  return (
    <div className="mx-auto max-w-lg px-6 py-12">

      {/* Header */}
      <h1 className="mb-1 text-xl font-bold tracking-tight text-prose">Abrechnung</h1>
      <p className="mb-8 text-sm text-muted">Verwalte deinen Plan und sieh deine Nutzung.</p>

      {/* Success banner */}
      {justSubscribed && (
        <div className="motion-safe:animate-fade-up mb-4 flex items-center gap-3 rounded-2xl border border-emerald-800/40 bg-emerald-950/40 px-5 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">Willkommen im Pro Plan!</p>
            <p className="text-xs text-emerald-700">Unbegrenzte Übersetzungen sind jetzt aktiv.</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Plan card */}
      <div className="mb-3 rounded-2xl border border-rim bg-surface p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-dim">Aktueller Plan</p>

        {status?.isSubscribed ? (
          <div>
            <div className="mb-1 flex items-center gap-3">
              <span className="text-2xl font-bold tracking-tight text-violet-300">Pro</span>
              <span className="rounded-full border border-emerald-800/50 bg-emerald-950/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                aktiv
              </span>
            </div>
            {status.periodEnd && (
              <p className="mb-5 text-sm text-muted">
                Verlängert am{' '}
                {new Date(status.periodEnd).toLocaleDateString('de-DE', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            )}
            <button
              onClick={() => callApi('/stripe/create-portal')}
              disabled={working}
              className="rounded-lg border border-rim px-4 py-2 text-sm font-medium text-violet-300 transition hover:border-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {working ? 'Öffne Portal…' : 'Abo verwalten →'}
            </button>
          </div>
        ) : status?.freeTierUsed ? (
          <div>
            <p className="mb-1 text-2xl font-bold tracking-tight text-red-400">Limit erreicht</p>
            <p className="mb-5 text-sm text-muted">Deine 30 kostenlosen Minuten sind aufgebraucht.</p>
            <button
              onClick={() => callApi('/stripe/create-checkout')}
              disabled={working}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                boxShadow: '0 4px 20px rgba(99,102,241,.3)',
              }}
            >
              {working ? 'Weiterleitung…' : 'Jetzt upgraden — €0,05 / Minute'}
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-prose">{freeRemaining}</span>
              <span className="text-sm text-muted">/ 30 Min frei übrig</span>
            </div>
            <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-raised">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${freePct}%`,
                  background: freePct > 40
                    ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                    : 'linear-gradient(90deg, #f97316, #ef4444)',
                }}
              />
            </div>
            <button
              onClick={() => callApi('/stripe/create-checkout')}
              disabled={working}
              className="rounded-lg border border-rim px-4 py-2 text-sm font-medium text-violet-300 transition hover:border-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {working ? 'Weiterleitung…' : 'Auf Pro upgraden — €0,05 / Min'}
            </button>
          </div>
        )}
      </div>

      {/* Usage stats */}
      <div className="mb-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-rim bg-surface">
        <div className="border-r border-rim px-5 py-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-dim">Gesamt übersetzt</p>
          <p className="text-xl font-bold tracking-tight text-prose">
            {status?.unitsUsed ?? 0}
            <span className="ml-1 text-sm font-normal text-muted">Min</span>
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-dim">
            {status?.isSubscribed ? 'Kosten diesen Monat' : 'Pro-Preis'}
          </p>
          <p className="text-xl font-bold tracking-tight text-prose">
            {status?.isSubscribed
              ? `€${(status.estimatedCost ?? 0).toFixed(2)}`
              : '€0,05'}
            {!status?.isSubscribed && <span className="ml-1 text-sm font-normal text-muted">/ Min</span>}
          </p>
        </div>
      </div>

      <button
        onClick={() => router.push('/dashboard/translate')}
        className="text-sm text-dim transition hover:text-muted"
      >
        ← Zurück zur Übersetzung
      </button>
    </div>
  );
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>;
}
