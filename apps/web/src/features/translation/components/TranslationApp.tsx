'use client';
import { useState, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { SUPPORTED_LANGUAGES } from '@saas/shared';

export function TranslationApp() {
  const [sourceLang, setSourceLang] = useState('de');
  const [targetLang, setTargetLang] = useState('en');
  const { lines, isRecording, error, start, stop, wsStatus } = useTranslation(sourceLang, targetLang);

  const swapLanguages = useCallback(() => {
    if (isRecording) return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  }, [sourceLang, targetLang, isRecording]);

  const isConnecting = wsStatus === 'reconnecting';

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col">

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[600px] opacity-[0.15]"
        style={{ background: 'radial-gradient(ellipse 90% 60% at 50% -5%, #4338ca, transparent)' }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-16 pt-12">

        {/* ── Language selector ── */}
        <div className="mb-12 flex items-center justify-center gap-3">
          <LangSelect value={sourceLang} onChange={setSourceLang} disabled={isRecording} label="Von" />
          <button
            onClick={swapLanguages}
            disabled={isRecording}
            title="Sprachen tauschen"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-rim bg-surface text-dim transition-all duration-200 hover:border-indigo-600/60 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
              <path d="M7 16V4m0 0L3 8m4-4l4 4" />
              <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
          <LangSelect value={targetLang} onChange={setTargetLang} disabled={isRecording} label="Nach" />
        </div>

        {/* ── Mic button ── */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-6 flex h-32 w-32 items-center justify-center">
            {isRecording && (
              <>
                <span className="motion-safe:animate-ring-out absolute inset-0 rounded-full bg-red-500/20" />
                <span className="motion-safe:animate-ring-out-2 absolute inset-0 rounded-full bg-red-500/10" />
              </>
            )}
            <button
              onClick={isRecording ? stop : start}
              disabled={isConnecting}
              className={[
                'relative flex h-28 w-28 cursor-pointer items-center justify-center rounded-full border-0 outline-none',
                'transition-all duration-300 active:scale-95',
                'ring-offset-4 ring-offset-page focus-visible:ring-2 focus-visible:ring-indigo-400',
                isConnecting && 'cursor-not-allowed opacity-40',
                !isRecording && !isConnecting && 'motion-safe:animate-glow-idle',
              ].filter(Boolean).join(' ')}
              style={{
                background: isRecording
                  ? 'linear-gradient(145deg, #ef4444, #b91c1c)'
                  : 'linear-gradient(145deg, #6366f1, #7c3aed)',
                boxShadow: isRecording
                  ? '0 0 60px rgba(239,68,68,.5), 0 12px 40px rgba(0,0,0,.7)'
                  : '0 0 50px rgba(99,102,241,.5), 0 12px 40px rgba(0,0,0,.7)',
              }}
              aria-label={isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
            >
              {isRecording ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-white" aria-hidden>
                  <rect x="5" y="5" width="14" height="14" rx="3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-white" aria-hidden>
                  <rect x="9" y="2" width="6" height="13" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="17" x2="12" y2="22" />
                  <line x1="8" y1="22" x2="16" y2="22" />
                </svg>
              )}
            </button>
          </div>

          {/* Status bar */}
          <div className="flex h-7 items-center justify-center">
            {isConnecting ? (
              <span className="flex items-center gap-2 text-sm text-muted">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-transparent" />
                Verbinde neu…
              </span>
            ) : wsStatus === 'error' ? (
              <span className="text-sm text-red-400">Verbindungsfehler — Seite neu laden</span>
            ) : isRecording ? (
              <AudioWave />
            ) : (
              <p className="text-sm text-muted">Klicke auf das Mikrofon und fange an zu sprechen</p>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="motion-safe:animate-fade-up mb-5 rounded-xl border border-red-900/40 bg-red-950/25 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── Transcript feed ── */}
        {lines.length > 0 ? (
          <div
            className="flex flex-col gap-2"
            style={{ maxHeight: '48vh', overflowY: 'auto', paddingRight: '2px' }}
          >
            {[...lines].reverse().map(line => (
              <TranscriptCard key={line.id} line={line} />
            ))}
          </div>
        ) : !isRecording ? (
          <EmptyState />
        ) : null}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function LangSelect({
  value, onChange, disabled, label,
}: {
  value: string; onChange: (v: string) => void; disabled: boolean; label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-dim">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="cursor-pointer appearance-none rounded-xl border border-rim bg-surface py-2 pl-4 pr-8 text-sm font-semibold text-prose outline-none transition-colors hover:border-indigo-700 disabled:cursor-default disabled:opacity-60"
        >
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, lbl]) => (
            <option key={code} value={code} className="bg-surface">{lbl}</option>
          ))}
        </select>
        <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" aria-hidden>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}

function AudioWave() {
  const bars = Array.from({ length: 16 });
  return (
    <div className="flex items-end gap-[3px]" aria-label="Aufnahme läuft" role="status">
      {bars.map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-red-400 motion-safe:animate-wave"
          style={{
            animationDelay: `${(i * 73) % 500}ms`,
            animationDuration: `${700 + (i * 137) % 400}ms`,
          }}
        />
      ))}
      <span className="ml-2.5 text-sm font-medium text-red-400">Aufnahme läuft</span>
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
        ? 'border-white/10 bg-white/[0.04] hover:border-white/[0.15] hover:bg-white/[0.06]'
        : 'border-white/5 bg-white/[0.02] opacity-55',
    ].join(' ')}>

      {/* Original */}
      <p className="mb-2 text-[11px] leading-relaxed text-dim">{line.original}</p>

      {/* Translation */}
      <p className={[
        'text-base leading-relaxed',
        line.isFinal ? 'font-medium text-violet-100' : 'italic text-dim',
      ].join(' ')}>
        {line.isFinal ? (line.translated || line.original) : '— wird erkannt …'}
      </p>

      {/* Footer row */}
      {line.isFinal && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-dim">übersetzt</span>
          </div>
          <button
            onClick={copy}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-dim opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-white/[0.07] hover:text-muted"
          >
            {copied ? (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-emerald-400" aria-hidden>
                  <polyline points="13 3 6 12 3 9" />
                </svg>
                <span className="text-emerald-400">Kopiert</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden>
                  <rect x="5" y="5" width="9" height="9" rx="1.5" />
                  <path d="M3 11V3h8" />
                </svg>
                Kopieren
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rim bg-surface">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-dim" aria-hidden>
          <rect x="9" y="2" width="6" height="13" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <line x1="12" y1="17" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-muted">Keine Übersetzungen</p>
        <p className="text-sm text-dim">Drücke den Knopf und fange an zu sprechen.</p>
      </div>
    </div>
  );
}
