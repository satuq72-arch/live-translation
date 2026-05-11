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

  const isConnecting = wsStatus === 'reconnecting';

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col">

      {/* Subtle ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-14 h-72 opacity-20"
        style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 0%, #4338ca, transparent)' }}
      />

      {/* ── Scrollable body ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-48 pt-6">
        <div className="mx-auto max-w-xl">

          {/* Language bar */}
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm">
            <LangSelect value={sourceLang} onChange={setSourceLang} disabled={isRecording} />
            <button
              onClick={swap}
              disabled={isRecording}
              title="Sprachen tauschen"
              className="mx-auto flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-rim bg-raised text-dim transition hover:border-indigo-600/60 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
                <path d="M6 14V6m0 0L3 9m3-3 3 3" />
                <path d="M14 6v8m0 0 3-3m-3 3-3-3" />
              </svg>
            </button>
            <LangSelect value={targetLang} onChange={setTargetLang} disabled={isRecording} />
          </div>

          {/* Error */}
          {error && (
            <div className="motion-safe:animate-fade-up mb-4 rounded-xl border border-red-900/40 bg-red-950/25 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Transcript feed or empty state */}
          {lines.length > 0 ? (
            <div className="flex flex-col gap-2">
              {[...lines].reverse().map(line => (
                <TranscriptCard key={line.id} line={line} />
              ))}
            </div>
          ) : (
            <EmptyState isRecording={isRecording} />
          )}
        </div>
      </div>

      {/* ── Sticky bottom bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/[0.06] bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-5 py-5">

          {/* Status line */}
          <div className="flex h-6 items-center">
            {isConnecting ? (
              <span className="flex items-center gap-2 text-xs text-muted">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-transparent" />
                Verbinde neu…
              </span>
            ) : wsStatus === 'error' ? (
              <span className="text-xs text-red-400">Verbindungsfehler — Seite neu laden</span>
            ) : isRecording ? (
              <AudioWave />
            ) : (
              <span className="text-xs text-muted">Drücke den Knopf und fange an zu sprechen</span>
            )}
          </div>

          {/* Mic button */}
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <>
                <span className="motion-safe:animate-ring-out absolute h-16 w-16 rounded-full bg-red-500/25" />
                <span className="motion-safe:animate-ring-out-2 absolute h-16 w-16 rounded-full bg-red-500/15" />
              </>
            )}
            <button
              onClick={isRecording ? stop : start}
              disabled={isConnecting}
              className={[
                'relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-0 outline-none',
                'transition-all duration-200 active:scale-95',
                'ring-offset-4 ring-offset-page focus-visible:ring-2 focus-visible:ring-indigo-400',
                isConnecting && 'cursor-not-allowed opacity-40',
                !isRecording && !isConnecting && 'motion-safe:animate-glow-idle',
              ].filter(Boolean).join(' ')}
              style={{
                background: isRecording
                  ? 'linear-gradient(145deg, #ef4444, #b91c1c)'
                  : 'linear-gradient(145deg, #6366f1, #7c3aed)',
                boxShadow: isRecording
                  ? '0 0 32px rgba(239,68,68,.5), 0 4px 20px rgba(0,0,0,.6)'
                  : '0 0 28px rgba(99,102,241,.5), 0 4px 20px rgba(0,0,0,.6)',
              }}
              aria-label={isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
            >
              {isRecording ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-white" aria-hidden>
                  <rect x="5" y="5" width="14" height="14" rx="3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-white" aria-hidden>
                  <rect x="9" y="2" width="6" height="13" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="17" x2="12" y2="22" />
                  <line x1="8" y1="22" x2="16" y2="22" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function LangSelect({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled: boolean;
}) {
  return (
    <div className="relative flex-1">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full cursor-pointer appearance-none rounded-xl bg-transparent py-2 pl-3 pr-7 text-sm font-semibold text-prose outline-none transition disabled:cursor-default disabled:opacity-60"
      >
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, lbl]) => (
          <option key={code} value={code} className="bg-surface">{lbl}</option>
        ))}
      </select>
      <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" aria-hidden>
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

function AudioWave() {
  return (
    <div className="flex items-end gap-[3px]" role="status" aria-label="Aufnahme läuft">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-red-400 motion-safe:animate-wave"
          style={{
            animationDelay: `${(i * 73) % 500}ms`,
            animationDuration: `${700 + (i * 137) % 400}ms`,
          }}
        />
      ))}
      <span className="ml-2 text-xs font-medium text-red-400">Aufnahme läuft</span>
    </div>
  );
}

function TranscriptCard({ line }: {
  line: { id: string; original: string; translated: string; isFinal: boolean };
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(line.translated || line.original).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={[
      'motion-safe:animate-slide-in group relative rounded-2xl border px-5 py-4 backdrop-blur-sm transition-all duration-200',
      line.isFinal
        ? 'border-white/10 bg-white/[0.04] hover:border-white/[0.15]'
        : 'border-white/[0.06] bg-white/[0.02] opacity-60',
    ].join(' ')}>
      <p className="mb-2 text-[11px] leading-relaxed text-dim">{line.original}</p>
      <p className={[
        'text-base leading-relaxed',
        line.isFinal ? 'font-medium text-violet-100' : 'italic text-dim',
      ].join(' ')}>
        {line.isFinal ? (line.translated || line.original) : '— wird erkannt …'}
      </p>
      {line.isFinal && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-dim">übersetzt</span>
          </div>
          <button
            onClick={copy}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-dim opacity-0 transition group-hover:opacity-100 hover:bg-white/[0.07] hover:text-muted"
          >
            {copied ? (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-emerald-400" aria-hidden><polyline points="13 3 6 12 3 9" /></svg>
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
      )}
    </div>
  );
}

function EmptyState({ isRecording }: { isRecording: boolean }) {
  if (isRecording) return null;
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rim bg-surface">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-dim" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p className="text-sm text-muted">Übersetzungen erscheinen hier.</p>
    </div>
  );
}
