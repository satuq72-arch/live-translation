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
    <div className="flex min-h-[calc(100vh-56px)] flex-col bg-page">

      {/* Controls bar */}
      <div className="sticky top-14 z-10 border-b border-white/[0.06] bg-page/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-3">

          {/* Language row */}
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
            <LangSelect value={sourceLang} onChange={setSourceLang} disabled={isRecording} />
            <button
              onClick={swap}
              disabled={isRecording}
              title="Sprachen tauschen"
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-dim transition hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
                <path d="M4 10h12M13 6l4 4-4 4M7 14l-4-4 4-4" />
              </svg>
            </button>
            <LangSelect value={targetLang} onChange={setTargetLang} disabled={isRecording} />
          </div>

          {/* Recording status */}
          {isRecording && (
            <div className="hidden items-center gap-2 sm:flex">
              <AudioWave />
            </div>
          )}

          {/* Mic button */}
          <button
            onClick={isRecording ? stop : start}
            disabled={busy}
            className={[
              'relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 outline-none',
              'transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-page',
              busy && 'cursor-not-allowed opacity-40',
              !isRecording && !busy && 'motion-safe:animate-glow-idle',
            ].filter(Boolean).join(' ')}
            style={{
              background: isRecording
                ? 'linear-gradient(145deg,#ef4444,#b91c1c)'
                : 'linear-gradient(145deg,#6366f1,#7c3aed)',
              boxShadow: isRecording
                ? '0 0 18px rgba(239,68,68,.5)'
                : '0 0 18px rgba(99,102,241,.4)',
            }}
            aria-label={isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isRecording ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5 text-white" aria-hidden>
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white" aria-hidden>
                <rect x="9" y="2" width="6" height="13" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="17" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {(error || wsStatus === 'error') && (
        <div className="border-b border-red-900/30 bg-red-950/20 px-6 py-2.5 text-center text-sm text-red-400">
          {error ?? 'Verbindungsfehler — bitte Seite neu laden'}
        </div>
      )}

      {/* Transcript */}
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-6">
        {lines.length > 0 ? (
          <div className="flex flex-col gap-3">
            {[...lines].reverse().map((line, i) => (
              <TranscriptCard key={line.id} line={line} isLatest={i === 0} />
            ))}
          </div>
        ) : (
          <EmptyState isRecording={isRecording} busy={busy} />
        )}
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
        className="w-full cursor-pointer appearance-none bg-transparent py-0.5 pl-1 pr-6 text-sm font-semibold text-prose outline-none disabled:cursor-default disabled:opacity-60"
      >
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, lbl]) => (
          <option key={code} value={code} className="bg-surface">{lbl}</option>
        ))}
      </select>
      <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" aria-hidden>
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

function AudioWave() {
  return (
    <div className="flex items-end gap-[3px]" role="status" aria-label="Aufnahme läuft">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="w-[2.5px] rounded-full bg-red-400 motion-safe:animate-wave"
          style={{ animationDelay: `${(i * 80) % 480}ms`, animationDuration: `${650 + (i * 130) % 350}ms` }}
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

  return (
    <div className={[
      'motion-safe:animate-slide-in group rounded-2xl border px-5 py-4 transition-all duration-200',
      line.isFinal
        ? isLatest
          ? 'border-indigo-500/30 bg-indigo-950/20'
          : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12]'
        : 'border-white/[0.05] bg-transparent opacity-50',
    ].join(' ')}>

      {/* Original */}
      <p className="mb-2.5 text-xs leading-relaxed text-muted">{line.original}</p>

      {/* Translation */}
      <p className={[
        'text-[15px] leading-relaxed',
        line.isFinal ? 'font-medium text-violet-100' : 'italic text-dim',
      ].join(' ')}>
        {line.isFinal ? (line.translated || line.original) : '— wird erkannt …'}
      </p>

      {line.isFinal && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-violet-500" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-dim">Übersetzt</span>
          </div>
          <button
            onClick={copy}
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-dim opacity-0 transition-all group-hover:opacity-100 hover:bg-white/[0.06] hover:text-muted"
          >
            {copied
              ? <><CheckIcon className="text-emerald-400" /><span className="text-emerald-400">Kopiert</span></>
              : <><CopyIcon /><span>Kopieren</span></>}
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ isRecording, busy }: { isRecording: boolean; busy: boolean }) {
  return (
    <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <div className={[
        'flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors duration-300',
        isRecording ? 'border-red-800/50 bg-red-950/30' : 'border-rim bg-surface',
      ].join(' ')}>
        {isRecording ? (
          <AudioWave />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-dim" aria-hidden>
            <rect x="9" y="2" width="6" height="13" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="17" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        )}
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-muted">
          {isRecording ? 'Warte auf Sprache…' : 'Bereit zum Übersetzen'}
        </p>
        <p className="text-sm text-dim">
          {isRecording
            ? 'Übersetzungen erscheinen sobald du sprichst.'
            : busy ? 'Verbindet…' : 'Klicke auf den Mikrofon-Knopf rechts oben.'}
        </p>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden>
      <rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M3 11V3h8" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-3 w-3 ${className}`} aria-hidden>
      <polyline points="13 3 6 12 3 9" />
    </svg>
  );
}
