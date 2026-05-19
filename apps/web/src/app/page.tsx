import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

const LANGUAGES = [
  'German','English','French','Spanish','Italian','Portuguese',
  'Dutch','Polish','Russian','Japanese','Korean','Turkish',
  'Ukrainian','Swedish','Danish','Norwegian','Czech','Hungarian','Romanian',
];

export default async function RootPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-page text-prose">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 border-b border-rim/50 bg-page/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span
            className="text-sm font-bold tracking-tight"
            style={{ background: 'linear-gradient(90deg,#a5b4fc,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            LiveTranslate
          </span>
          <div className="flex items-center gap-3">
            {userId ? (
              <Link
                href="/dashboard/translate"
                className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow: '0 2px 12px rgba(99,102,241,.35)' }}
              >
                Go to app →
              </Link>
            ) : (
              <>
                <Link href="/auth/sign-in" className="rounded-lg px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:text-prose">
                  Sign in
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow: '0 2px 12px rgba(99,102,241,.35)' }}
                >
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-20">
        {/* Aurora background */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-[0.15] blur-[80px]"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
          <div className="absolute right-1/4 top-20 h-72 w-72 rounded-full opacity-[0.08] blur-[60px]"
            style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }} />
          <div className="absolute bottom-0 left-1/2 h-48 w-96 -translate-x-1/2 opacity-[0.06] blur-[60px]"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* Left — copy */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-800/40 bg-indigo-950/50 px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span className="text-xs font-semibold text-indigo-300">Real-time · 19 languages · Powered by AI</span>
              </div>

              <h1 className="mb-5 text-5xl font-bold leading-[1.1] tracking-tight lg:text-6xl">
                <span className="text-prose">Break language</span>
                <br />
                <span style={{ background: 'linear-gradient(135deg,#a5b4fc 0%,#c4b5fd 50%,#67e8f9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  barriers live
                </span>
              </h1>

              <p className="mb-8 text-lg leading-relaxed text-muted">
                Speak in one language — read the translation instantly.
                Built for meetings, travel, and every real conversation in between.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={userId ? '/dashboard/translate' : '/auth/sign-up'}
                  className="rounded-xl px-7 py-3 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow: '0 4px 24px rgba(99,102,241,.4)' }}
                >
                  {userId ? 'Open app' : 'Start for free'}
                </Link>
                {!userId && (
                  <Link
                    href="/auth/sign-in"
                    className="rounded-xl border border-rim bg-raised px-7 py-3 text-base font-semibold text-prose transition-all hover:border-indigo-700/50 hover:bg-indigo-950/20"
                  >
                    Sign in →
                  </Link>
                )}
              </div>

              {!userId && (
                <p className="mt-4 text-xs text-dim">30 free minutes · No credit card required</p>
              )}
            </div>

            {/* Right — product preview */}
            <div className="relative">
              {/* Glow behind card */}
              <div aria-hidden className="absolute inset-0 rounded-3xl opacity-30 blur-3xl"
                style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }} />
              <AppPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-indigo-400">How it works</p>
            <h2 className="text-2xl font-bold tracking-tight text-prose">Three steps. Zero friction.</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { num: '01', title: 'Pick languages', desc: 'Choose your source and target language from 19 supported options.' },
              { num: '02', title: 'Press & speak', desc: 'Hit the microphone button and talk naturally — no special pacing needed.' },
              { num: '03', title: 'Read instantly', desc: 'Your words appear translated in real time, phrase by phrase.' },
            ].map(({ num, title, desc }) => (
              <div key={num} className="relative rounded-2xl border border-rim bg-raised p-6">
                <span
                  className="mb-4 block text-3xl font-bold"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  {num}
                </span>
                <h3 className="mb-2 text-sm font-semibold text-prose">{title}</h3>
                <p className="text-sm leading-relaxed text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-400">Features</p>
            <h2 className="text-2xl font-bold tracking-tight text-prose">Built for real conversations</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
                color: 'text-indigo-400', ring: 'ring-indigo-800/40 bg-indigo-950/40',
                title: 'Under 300ms latency', desc: 'Deepgram\'s streaming STT delivers transcription as fast as you speak.',
              },
              {
                icon: <><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
                color: 'text-cyan-400', ring: 'ring-cyan-800/40 bg-cyan-950/40',
                title: '19 languages', desc: 'European, Asian, and Slavic languages — swap with one click, swap back the same way.',
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
                color: 'text-violet-400', ring: 'ring-violet-800/40 bg-violet-950/40',
                title: 'Secure by default', desc: 'Clerk auth, Stripe billing, end-to-end encrypted WebSocket sessions.',
              },
            ].map(({ icon, color, ring, title, desc }) => (
              <div key={title} className="rounded-2xl border border-rim bg-raised p-6">
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${ring} ${color}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden>
                    {icon}
                  </svg>
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-prose">{title}</h3>
                <p className="text-sm leading-relaxed text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Languages ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-violet-400">Languages</p>
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-prose">19 languages, one button</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {LANGUAGES.map((lang, i) => (
              <span
                key={lang}
                className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  borderColor: i % 3 === 0 ? 'rgba(99,102,241,0.3)' : i % 3 === 1 ? 'rgba(6,182,212,0.3)' : 'rgba(139,92,246,0.3)',
                  color: i % 3 === 0 ? '#a5b4fc' : i % 3 === 1 ? '#67e8f9' : '#c4b5fd',
                  background: i % 3 === 0 ? 'rgba(99,102,241,0.08)' : i % 3 === 1 ? 'rgba(6,182,212,0.08)' : 'rgba(139,92,246,0.08)',
                }}
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-orange-400">Pricing</p>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-prose">Simple, honest pricing</h2>
            <p className="text-sm text-muted">Start free. Choose how you pay.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">

            {/* Free */}
            <div className="rounded-2xl border border-rim bg-raised p-7">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-dim">Free</p>
              <div className="mb-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-prose">€0</span>
                <span className="text-sm text-muted">forever</span>
              </div>
              <ul className="mb-7 space-y-3 text-sm text-muted">
                {['30 free minutes','19 languages','Real-time translation','Copy transcripts'].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0 text-dim" aria-hidden>
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={userId ? '/dashboard/translate' : '/auth/sign-up'}
                className="block w-full rounded-xl border border-rim py-2.5 text-center text-sm font-semibold text-prose transition-all hover:border-indigo-700/50 hover:bg-indigo-950/20"
              >
                {userId ? 'Open app' : 'Get started free'}
              </Link>
            </div>

            {/* Monthly flat — highlighted */}
            <div className="relative overflow-hidden rounded-2xl border border-indigo-600/30 bg-indigo-950/15 p-7 shadow-[0_0_48px_rgba(99,102,241,0.12)]">
              <div aria-hidden className="pointer-events-none absolute -left-8 -top-8 h-36 w-36 rounded-full opacity-20 blur-3xl"
                style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
              <div className="mb-1 flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Monthly</p>
                <span className="rounded-full bg-indigo-900/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 ring-1 ring-indigo-800/40">Best value</span>
              </div>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-prose">€39</span>
                <span className="text-sm text-muted">/ month</span>
              </div>
              <p className="mb-5 text-[11px] text-dim">Unlimited minutes included</p>
              <ul className="mb-7 space-y-3 text-sm text-muted">
                {['Unlimited minutes','19 languages','Real-time translation','Copy transcripts','Priority support'].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden>
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={userId ? '/dashboard/billing' : '/auth/sign-up'}
                className="relative block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow: '0 4px 20px rgba(99,102,241,.35)' }}
              >
                {userId ? 'Switch to Monthly' : 'Start Monthly'}
              </Link>
            </div>

            {/* Pay-per-minute */}
            <div className="relative overflow-hidden rounded-2xl border border-orange-900/25 bg-orange-950/8 p-7">
              <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-15 blur-3xl"
                style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-400">Pay as you go</p>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-prose">€0.05</span>
                <span className="text-sm text-muted">/ minute</span>
              </div>
              <p className="mb-5 text-[11px] text-dim">Only pay for what you use</p>
              <ul className="mb-7 space-y-3 text-sm text-muted">
                {['No monthly commitment','19 languages','Real-time translation','Copy transcripts','Priority support'].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0 text-orange-500/70" aria-hidden>
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={userId ? '/dashboard/billing' : '/auth/sign-up'}
                className="relative block w-full rounded-xl border border-orange-800/30 py-2.5 text-center text-sm font-semibold text-orange-300 transition-all hover:bg-orange-950/20 active:scale-95"
              >
                {userId ? 'Switch to Pay-per-minute' : 'Start Pay-per-minute'}
              </Link>
            </div>

          </div>
          <p className="mt-4 text-center text-xs text-dim">Monthly plan pays off after ~780 minutes/month compared to pay-as-you-go.</p>
        </div>
      </section>

      {/* ── CTA strip ── */}
      {!userId && (
        <section className="px-6 pb-24">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-indigo-800/30 p-12 text-center"
            style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(124,58,237,0.08))' }}>
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{ background: 'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
            <h2 className="relative mb-3 text-3xl font-bold tracking-tight text-prose">Ready to start?</h2>
            <p className="relative mb-8 text-base text-muted">30 free minutes, no credit card. Upgrade when you need more.</p>
            <Link
              href="/auth/sign-up"
              className="relative inline-block rounded-xl px-9 py-3.5 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow: '0 4px 28px rgba(99,102,241,.45)' }}
            >
              Create free account
            </Link>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-rim px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-xs text-dim">© 2025 LiveTranslate</span>
          <div className="flex gap-4 text-xs text-dim">
            {userId ? (
              <Link href="/dashboard/translate" className="transition-colors hover:text-muted">Open app</Link>
            ) : (
              <>
                <Link href="/auth/sign-in" className="transition-colors hover:text-muted">Sign in</Link>
                <Link href="/auth/sign-up" className="transition-colors hover:text-muted">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}

/* ── Product preview mockup ── */
function AppPreview() {
  return (
    <div className="relative rounded-2xl border border-rim/80 bg-raised p-5 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
      {/* Top bar */}
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
      </div>

      {/* Lang row */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex-1 rounded-xl border border-rim bg-surface py-2 pl-3 text-xs font-semibold text-prose">German</div>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-rim bg-surface text-dim">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden>
            <path fillRule="evenodd" d="M13.2 2.24a.75.75 0 0 0-.04 1.06l2.1 2.2H6.75a.75.75 0 0 0 0 1.5h8.51l-2.1 2.2a.75.75 0 1 0 1.08 1.04l3.5-3.75a.75.75 0 0 0 0-1.04l-3.5-3.75a.75.75 0 0 0-1.06-.04zm-6.4 8a.75.75 0 0 0-1.06.04l-3.5 3.75a.75.75 0 0 0 0 1.04l3.5 3.75a.75.75 0 1 0 1.1-1.04l-2.1-2.2h8.51a.75.75 0 0 0 0-1.5H4.74l2.1-2.2a.75.75 0 0 0-.04-1.06z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 rounded-xl border border-rim bg-surface py-2 pl-3 text-xs font-semibold text-prose">English</div>
      </div>

      {/* Mic */}
      <div className="mb-4 flex justify-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow: '0 0 0 1px rgba(99,102,241,.4),0 4px 20px rgba(99,102,241,.4)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <rect x="9" y="2" width="6" height="13" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="17" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        </div>
      </div>

      {/* Transcript cards */}
      <div className="space-y-2">
        <div className="rounded-xl border border-indigo-600/20 bg-indigo-950/25 px-3.5 py-3">
          <p className="mb-1.5 text-[10px] text-muted">Guten Morgen! Wie geht es Ihnen heute?</p>
          <p className="text-xs font-semibold" style={{ background: 'linear-gradient(135deg,#e0deff,#c4b5fd,#a5f3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Good morning! How are you today?
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-indigo-400 ring-1 ring-inset ring-indigo-800/40 bg-indigo-950/60">German</span>
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-2 w-2 text-dim" aria-hidden>
              <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L9.22 5.03a.75.75 0 0 1 1.06-1.06l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 1 1-1.06-1.06l2.22-2.22H2.75A.75.75 0 0 1 2 8z" clipRule="evenodd" />
            </svg>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-cyan-400 ring-1 ring-inset ring-cyan-800/40 bg-cyan-950/50">English</span>
          </div>
        </div>
        <div className="rounded-xl border border-rim/50 bg-raised px-3.5 py-3 opacity-70">
          <p className="mb-1.5 text-[10px] text-muted">Das Meeting beginnt in zehn Minuten.</p>
          <p className="text-xs font-semibold text-prose">The meeting starts in ten minutes.</p>
        </div>
      </div>
    </div>
  );
}
