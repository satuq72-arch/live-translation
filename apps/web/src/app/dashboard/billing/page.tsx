'use client';
import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const { getToken }  = useAuth();
  const router        = useRouter();
  const params        = useSearchParams();
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
        setError('Statusabfrage fehlgeschlagen.');
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
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const freeUsed      = 30 - (status?.freeTierRemaining ?? 30);
  const freePct       = Math.min(100, Math.round((freeUsed / 30) * 100));
  const freeRemaining = status?.freeTierRemaining ?? 30;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-page px-6 py-12">
      <div className="mx-auto max-w-md">

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-prose">Abrechnung</h1>
          <p className="text-sm text-muted">Verwalte deinen Plan und sieh deine Nutzung.</p>
        </div>

        {/* Success banner */}
        {justSubscribed && (
          <div className="motion-safe:animate-fade-up mb-5 flex items-center gap-3 rounded-2xl border border-emerald-800/30 bg-emerald-950/25 px-5 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-700/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-300">Willkommen im Pro Plan!</p>
              <p className="mt-0.5 text-xs text-emerald-700">Unbegrenzte Übersetzungen sind aktiv.</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-900/40 bg-red-950/25 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Plan card */}
        <div className="mb-4 rounded-2xl border border-rim bg-raised">
          <div className="border-b border-rim px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-dim">Aktueller Plan</p>
          </div>
          <div className="px-5 py-5">
            {status?.isSubscribed ? (
              <SubscribedPlan status={status} working={working} onPortal={() => callApi('/stripe/create-portal')} />
            ) : status?.freeTierUsed ? (
              <LimitReachedPlan working={working} onUpgrade={() => callApi('/stripe/create-checkout')} />
            ) : (
              <FreePlan freeRemaining={freeRemaining} freePct={freePct} working={working} onUpgrade={() => callApi('/stripe/create-checkout')} />
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="mb-10 grid grid-cols-2 overflow-hidden rounded-2xl border border-rim bg-raised">
          <div className="border-r border-rim px-5 py-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-dim">Gesamt übersetzt</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-prose">{status?.unitsUsed ?? 0}</span>
              <span className="text-sm text-muted">Min</span>
            </div>
          </div>
          <div className="px-5 py-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-dim">
              {status?.isSubscribed ? 'Kosten (Monat)' : 'Pro-Preis'}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-prose">
                {status?.isSubscribed
                  ? `€${(status.estimatedCost ?? 0).toFixed(2)}`
                  : '€0,05'}
              </span>
              {!status?.isSubscribed && <span className="text-sm text-muted">/ Min</span>}
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard/translate')}
          className="flex cursor-pointer items-center gap-1.5 text-sm text-dim transition hover:text-muted"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L4.863 9.25H16.25A.75.75 0 0 1 17 10z" clipRule="evenodd" />
          </svg>
          Zurück zur Übersetzung
        </button>
      </div>
    </div>
  );
}

/* ── Plan variants ── */

function SubscribedPlan({ status, working, onPortal }: {
  status: BillingStatus; working: boolean; onPortal: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="mb-1 flex items-center gap-2.5">
          <span className="text-xl font-bold tracking-tight text-violet-300">Pro</span>
          <span className="rounded-full border border-emerald-800/40 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            aktiv
          </span>
        </div>
        {status.periodEnd && (
          <p className="text-sm text-muted">
            Verlängert am{' '}
            {new Date(status.periodEnd).toLocaleDateString('de-DE', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}
      </div>
      <button
        onClick={onPortal}
        disabled={working}
        className="cursor-pointer whitespace-nowrap rounded-xl border border-rim px-4 py-2 text-sm font-medium text-violet-300 transition hover:border-indigo-600/50 hover:bg-indigo-950/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {working ? 'Öffne…' : 'Abo verwalten →'}
      </button>
    </div>
  );
}

function LimitReachedPlan({ working, onUpgrade }: { working: boolean; onUpgrade: () => void }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2.5">
        <span className="text-xl font-bold tracking-tight text-prose">Free</span>
        <span className="rounded-full border border-red-800/40 bg-red-950/30 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">
          Limit erreicht
        </span>
      </div>
      <p className="mb-5 text-sm text-muted">Deine 30 kostenlosen Minuten sind aufgebraucht.</p>
      <UpgradeButton working={working} onUpgrade={onUpgrade} />
    </div>
  );
}

function FreePlan({ freeRemaining, freePct, working, onUpgrade }: {
  freeRemaining: number; freePct: number; working: boolean; onUpgrade: () => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2.5">
        <span className="text-xl font-bold tracking-tight text-prose">Free</span>
      </div>
      <p className="mb-4 text-sm text-muted">
        <span className="font-semibold text-prose">{freeRemaining}</span> von 30 kostenlosen Minuten übrig
      </p>
      <div className="mb-5 overflow-hidden rounded-full bg-page" style={{ height: '5px' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${freePct}%`,
            background: freePct < 60
              ? 'linear-gradient(90deg,#6366f1,#8b5cf6)'
              : 'linear-gradient(90deg,#f97316,#ef4444)',
          }}
        />
      </div>
      <UpgradeButton working={working} onUpgrade={onUpgrade} />
    </div>
  );
}

function UpgradeButton({ working, onUpgrade }: { working: boolean; onUpgrade: () => void }) {
  return (
    <button
      onClick={onUpgrade}
      disabled={working}
      className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: 'linear-gradient(135deg,#6366f1,#7c3aed)',
        boxShadow: '0 4px 18px rgba(99,102,241,.3)',
      }}
    >
      {working ? 'Weiterleitung…' : 'Auf Pro upgraden — €0,05 / Min'}
    </button>
  );
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>;
}
