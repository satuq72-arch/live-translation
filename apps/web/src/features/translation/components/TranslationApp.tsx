'use client';
import { useState, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { SUPPORTED_LANGUAGES } from '@saas/shared';

export function TranslationApp() {
  const [sourceLang, setSourceLang] = useState('de');
  const [targetLang, setTargetLang] = useState('en');
  const { lines, isRecording, error, start, stop, wsStatus } = useTranslation(sourceLang, targetLang);

  const swap = useCallback(() => {
    if (isRecording) return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  }, [sourceLang, targetLang, isRecording]);

  const busy = wsStatus === 'reconnecting';

  return (
    <div className="relative flex min-h-[calc(100vh-56px)] flex-col items-center px-4 pb-16 pt-14 sm:px-8">

      {/* background gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40"
        style={{ background: 'radial-gradient(ellipse 80% 100% at 50% 0%, #3730a3 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-lg">

        {/* ── Language bar ── */}
        <div className="mb-10 flex items-center gap-2 rounded-2xl border border-rim bg-raised p-2 shadow-[0_2px_16px_rgba(0,0,0,0.5)]">
          <LangSelect value={sourceLang} onChange={setSourceLang} disabled={isRecording} />
          <button
            onClick={swap}
            disabled={isRecording}
            title="Sprachen tauschen"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-surface text-dim transition hover:bg-rim hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
          <LangSelect value={targetLang} onChange={setTargetLang} disabled={isRecording} />
        </div>

        {/* ── Mic section ── */}
        <div className="mb-10 flex flex-col items-center">
          {/* rings */}
          <div className="relative mb-5 flex items-center justify-center">
            {isRecording && (
              <>
                <span className="motion-safe:animate-ring-out absolute h-16 w-16 rounded-full border border-red-500/30" />
                <span className="motion-safe:animate-ring-out-2 absolute h-16 w-16 rounded-full border border-red-500/20" />
              </>
            )}

            <button
              onClick={isRecording ? stop : start}
              disabled={busy}
              className={[
                'relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full',
                'border-0 outline-none transition-all duration-200 active:scale-[0.93]',
                'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-4 focus-visible:ring-offset-page',
                busy && 'cursor-not-allowed opacity-40',
                !isRecording && !busy && 'motion-safe:animate-glow-idle',
              ].filter(Boolean).join(' ')}
              style={{
                background: isRecording
                  ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                  : 'linear-gradient(135deg, #6366f1, #7c3aed)',
                boxShadow: isRecording
                  ? '0 0 0 1px rgba(239,68,68,.3), 0 0 24px rgba(239,68,68,.4), 0 8px 24px rgba(0,0,0,.6)'
                  : '0 0 0 1px rgba(99,102,241,.3), 0 0 24px rgba(99,102,241,.4), 0 8px 24px rgba(0,0,0,.6)',
              }}
              aria-label={isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
            >
              {busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : isRecording ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white" aria-hidden>
                  <rect x="7" y="7" width="10" height="10" rx="2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white" aria-hidden>
                  <rect x="9" y="2" width="6" height="13" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="17" x2="12" y2="22" />
                  <line x1="8" y1="22" x2="16" y2="22" />
                </svg>
              )}
            </button>
          </div>

          {/* status */}
          <div className="flex h-5 items-center gap-2.5">
            {isRecording ? (
              <>
                <AudioWave />
                <span className="text-xs font-medium text-red-400">Aufnahme läuft</span>
              </>
            ) : busy ? (
              <span className="text-xs text-muted">Verbinde…</span>
            ) : wsStatus === 'error' ? (
              <span className="text-xs text-red-400">Verbindungsfehler — Seite neu laden</span>
            ) : (
              <span className="text-xs text-dim">Klicke auf das Mikrofon und beginne zu sprechen</span>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="motion-safe:animate-fade-up mb-5 rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── Transcript ── */}
        {lines.length > 0 ? (
          <div
            className="flex flex-col gap-3"
            style={{ maxHeight: '50vh', overflowY: 'auto' }}
          >
            {[...lines].reverse().map((line, i) => (
              <TranscriptCard key={line.id} line={line} isLatest={i === 0} />
            ))}
          </div>
        ) : !isRecording && (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="text-sm text-dim">Übersetzungen erscheinen hier.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function LangSelect({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled: boolean;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full cursor-pointer appearance-none rounded-xl bg-surface px-3 py-2.5 pr-8 text-sm font-semibold text-prose outline-none transition hover:bg-rim disabled:cursor-default disabled:opacity-60"
      >
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, lbl]) => (
          <option key={code} value={code} className="bg-surface">{lbl}</option>
        ))}
      </select>
      <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" aria-hidden>
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

function AudioWave() {
  return (
    <div className="flex items-end gap-[3px]" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-red-400 motion-safe:animate-wave"
          style={{ animationDelay: `${(i * 80) % 480}ms`, animationDuration: `${700 + (i * 130) % 350}ms` }}
        />
      ))}
    </div>
  );
}

function TranscriptCard({ line, isLatest }: {
  line: { id: string; original: string; translated: string; isFinal: boolean };
  isLatest: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(line.translated || line.original).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!line.isFinal) {
    return (
      <div className="motion-safe:animate-slide-in rounded-2xl border border-rim/50 bg-raised/50 px-5 py-4 opacity-60">
        <p className="mb-1.5 text-xs text-dim">{line.original}</p>
        <p className="italic text-sm text-dim">— wird erkannt …</p>
      </div>
    );
  }

  return (
    <div className={[
      'motion-safe:animate-slide-in group rounded-2xl border px-5 py-4 transition-all duration-200',
      isLatest
        ? 'border-indigo-500/40 bg-indigo-950/40 shadow-[0_2px_20px_rgba(99,102,241,0.15)]'
        : 'border-rim bg-raised shadow-[0_2px_12px_rgba(0,0,0,0.4)] hover:border-indigo-800/40',
    ].join(' ')}>

      <p className="mb-2.5 text-xs leading-relaxed text-muted">{line.original}</p>

      <p className="text-[15px] font-medium leading-relaxed text-violet-100">
        {line.translated || line.original}
      </p>

      <div className="mt-3.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-dim">Übersetzt</span>
        </div>
        <button
          onClick={copy}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-dim opacity-0 transition group-hover:opacity-100 hover:bg-white/5 hover:text-muted"
        >
          {copied ? (
            <>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-emerald-400" aria-hidden><polyline points="13 3 6 12 3 9" /></svg>
              <span className="text-emerald-400">Kopiert</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden><rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M3 11V3h8" /></svg>
              Kopieren
            </>
          )}
        </button>
      </div>
    </div>
  );
}
