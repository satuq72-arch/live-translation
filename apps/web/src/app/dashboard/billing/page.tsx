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
        setError('Failed to load billing status.');
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
      setError('Request failed. Please try again.');
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
    <div className="relative min-h-[calc(100vh-56px)] bg-page px-6 py-12">
      {/* Ambient gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-md">

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-prose">Billing</h1>
          <p className="text-sm text-muted">Manage your subscription and track usage.</p>
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
              <p className="text-sm font-semibold text-emerald-300">Welcome to Pro!</p>
              <p className="mt-0.5 text-xs text-emerald-700">Unlimited translations are now active.</p>
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
        <div className="mb-4 overflow-hidden rounded-2xl border border-rim bg-raised">
          {/* Card header */}
          <div className="border-b border-rim bg-surface/60 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-dim">Current Plan</p>
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

        {/* Stats */}
        <div className="mb-10 grid grid-cols-2 overflow-hidden rounded-2xl border border-rim bg-raised">
          <div className="border-r border-rim px-5 py-5">
            <div className="mb-2 flex items-center gap-1.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-indigo-400" aria-hidden>
                <path d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15h-3.105a3.501 3.501 0 0 0 1.1 1.677A.75.75 0 0 1 13.26 18H6.74a.75.75 0 0 1-.484-1.323A3.501 3.501 0 0 0 7.355 15H4.25A2.25 2.25 0 0 1 2 12.75v-8.5z" />
              </svg>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-dim">Total Translated</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight text-prose">{status?.unitsUsed ?? 0}</span>
              <span className="text-sm text-muted">min</span>
            </div>
          </div>
          <div className="px-5 py-5">
            <div className="mb-2 flex items-center gap-1.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-cyan-400" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.798 7.45c.512-.67 1.135-1.2 1.763-1.2.628 0 1.25.53 1.762 1.2.51.667.927 1.587 1.103 2.55H7.695c.176-.963.594-1.883 1.103-2.55zM7.5 11.5c0-.169.01-.336.027-.5h4.946c.017.164.027.331.027.5s-.01.336-.027.5H7.527A6.25 6.25 0 0 1 7.5 11.5zm.195 2c.176.963.594 1.883 1.103 2.55.512.67 1.135 1.2 1.763 1.2.628 0 1.25-.53 1.762-1.2.51-.667.927-1.587 1.103-2.55H7.695z" clipRule="evenodd" />
              </svg>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-dim">
                {status?.isSubscribed ? 'Cost This Month' : 'Pro Price'}
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight text-prose">
                {status?.isSubscribed
                  ? `€${(status.estimatedCost ?? 0).toFixed(2)}`
                  : '€0.05'}
              </span>
              {!status?.isSubscribed && <span className="text-sm text-muted">/ min</span>}
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard/translate')}
          className="flex cursor-pointer items-center gap-1.5 text-sm text-dim transition-colors hover:text-muted"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L4.863 9.25H16.25A.75.75 0 0 1 17 10z" clipRule="evenodd" />
          </svg>
          Back to translation
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
          <span
            className="text-xl font-bold tracking-tight"
            style={{ background: 'linear-gradient(135deg,#a5b4fc,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Pro
          </span>
          <span className="rounded-full border border-emerald-800/40 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            active
          </span>
        </div>
        {status.periodEnd && (
          <p className="text-sm text-muted">
            Renews on{' '}
            {new Date(status.periodEnd).toLocaleDateString('en-US', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}
      </div>
      <button
        onClick={onPortal}
        disabled={working}
        className="cursor-pointer whitespace-nowrap rounded-xl border border-rim px-4 py-2 text-sm font-medium text-violet-300 transition-all hover:border-indigo-600/50 hover:bg-indigo-950/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {working ? 'Opening…' : 'Manage subscription →'}
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
          Limit reached
        </span>
      </div>
      <p className="mb-5 text-sm text-muted">Your 30 free minutes have been used up.</p>
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
        <span className="font-semibold text-prose">{freeRemaining}</span> of 30 free minutes remaining
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
      className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: 'linear-gradient(135deg,#f97316,#ea580c)',
        boxShadow: '0 4px 20px rgba(249,115,22,.35)',
      }}
    >
      {working ? 'Redirecting…' : 'Upgrade to Pro — €0.05 / min'}
    </button>
  );
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>;
}
