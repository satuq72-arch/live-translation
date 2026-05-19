import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

export default async function RootPage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard/translate');

  return (
    <div className="min-h-screen bg-page text-prose">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 border-b border-rim/60 bg-page/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span
            className="text-sm font-bold tracking-tight"
            style={{ background: 'linear-gradient(90deg,#a5b4fc,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            LiveTranslate
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/sign-in"
              className="rounded-lg px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:text-prose"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow: '0 2px 12px rgba(99,102,241,.35)' }}
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-24 text-center">
        {/* Aurora */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-96 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
          <div className="absolute right-1/4 top-10 h-64 w-64 translate-x-1/2 rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
        </div>

        <div className="relative mx-auto max-w-3xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-800/40 bg-indigo-950/40 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span className="text-xs font-semibold text-indigo-300">Powered by Deepgram & DeepL</span>
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
            <span className="text-prose">Translate speech</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg,#a5b4fc,#c4b5fd,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              in real time
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-muted">
            Speak in one language, instantly read the translation in another.
            19 languages, zero delay.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/sign-up"
              className="rounded-xl px-7 py-3 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow: '0 4px 24px rgba(99,102,241,.4)' }}
            >
              Start for free
            </Link>
            <Link
              href="/auth/sign-in"
              className="rounded-xl border border-rim bg-raised px-7 py-3 text-base font-semibold text-prose transition-all hover:border-indigo-700/50 hover:bg-indigo-950/20"
            >
              Sign in →
            </Link>
          </div>

          <p className="mt-4 text-xs text-dim">30 free minutes · No credit card required</p>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-prose">Everything you need</h2>
            <p className="text-sm text-muted">Built for real conversations, not demos.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                    <path d="M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z" />
                    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                  </svg>
                ),
                color: 'text-indigo-400',
                bg: 'bg-indigo-950/40 ring-indigo-800/40',
                title: 'Real-time',
                desc: 'Transcription and translation happen as you speak — under 300ms latency.',
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                ),
                color: 'text-cyan-400',
                bg: 'bg-cyan-950/40 ring-cyan-800/40',
                title: '19 Languages',
                desc: 'German, English, Japanese, Korean, Russian and 14 more — swap instantly.',
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ),
                color: 'text-violet-400',
                bg: 'bg-violet-950/40 ring-violet-800/40',
                title: 'Secure',
                desc: 'Auth via Clerk, payments via Stripe. Your data stays private.',
              },
            ].map(({ icon, color, bg, title, desc }) => (
              <div key={title} className="rounded-2xl border border-rim bg-raised p-6">
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${bg} ${color}`}>
                  {icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-prose">{title}</h3>
                <p className="text-sm leading-relaxed text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-prose">Simple pricing</h2>
            <p className="text-sm text-muted">Start free, pay only when you need more.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border border-rim bg-raised p-6">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-dim">Free</p>
              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-prose">€0</span>
                <span className="text-sm text-muted">/ forever</span>
              </div>
              <ul className="mb-6 space-y-2 text-sm text-muted">
                {['30 free minutes', '19 languages', 'Copy translations'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-indigo-400" aria-hidden>
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/sign-up"
                className="block w-full rounded-xl border border-rim py-2.5 text-center text-sm font-semibold text-prose transition-all hover:border-indigo-700/50 hover:bg-indigo-950/20"
              >
                Get started
              </Link>
            </div>

            {/* Pro */}
            <div className="relative overflow-hidden rounded-2xl border border-indigo-600/30 bg-indigo-950/20 p-6 shadow-[0_0_40px_rgba(99,102,241,0.1)]">
              <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl"
                style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-400">Pro</p>
              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-prose">€0.05</span>
                <span className="text-sm text-muted">/ minute</span>
              </div>
              <ul className="mb-6 space-y-2 text-sm text-muted">
                {['Unlimited minutes', '19 languages', 'Priority support', 'Usage dashboard'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden>
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/sign-up"
                className="block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 4px 16px rgba(249,115,22,.3)' }}
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-rim px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-xs text-dim">© 2025 LiveTranslate</span>
          <div className="flex gap-4 text-xs text-dim">
            <Link href="/auth/sign-in" className="transition-colors hover:text-muted">Sign in</Link>
            <Link href="/auth/sign-up" className="transition-colors hover:text-muted">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
