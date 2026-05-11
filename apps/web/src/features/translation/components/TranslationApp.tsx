'use client';
import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { SUPPORTED_LANGUAGES } from '@saas/shared';

export function TranslationApp() {
  const [sourceLang, setSourceLang] = useState('de');
  const [targetLang, setTargetLang] = useState('en');
  const { lines, isRecording, error, start, stop, wsStatus } = useTranslation(sourceLang, targetLang);

  return (
    <div className="relative flex min-h-[calc(100vh-56px)] flex-col items-center px-6 pb-12 pt-16">

      {/* Subtle top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-96 opacity-30"
        style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 0%, #4338ca, transparent)' }}
      />

      {/* Language selector */}
      <div className="relative z-10 mb-14 flex items-center gap-3">
        <LangSelect value={sourceLang} onChange={setSourceLang} disabled={isRecording} />
        <span className="text-xl text-dim">→</span>
        <LangSelect value={targetLang} onChange={setTargetLang} disabled={isRecording} />
      </div>

      {/* Mic button */}
      <div className="relative z-10 mb-6 flex items-center justify-center">
        {isRecording && (
          <>
            <span className="motion-safe:animate-ring-out absolute inset-0 rounded-full bg-red-500/20" />
            <span className="motion-safe:animate-ring-out-2 absolute inset-0 rounded-full bg-red-500/15" />
          </>
        )}
        <button
          onClick={isRecording ? stop : start}
          disabled={wsStatus === 'reconnecting'}
          className={[
            'relative z-10 flex h-24 w-24 items-center justify-center rounded-full',
            'border-0 outline-none ring-offset-2 ring-offset-page transition-all duration-300',
            'focus-visible:ring-2 focus-visible:ring-indigo-400',
            wsStatus === 'reconnecting' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            !isRecording && 'motion-safe:animate-glow-idle',
          ].filter(Boolean).join(' ')}
          style={{
            background: isRecording
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #6366f1, #7c3aed)',
            boxShadow: isRecording
              ? '0 0 40px rgba(239,68,68,.45), 0 8px 24px rgba(0,0,0,.5)'
              : '0 0 36px rgba(99,102,241,.4), 0 8px 24px rgba(0,0,0,.5)',
          }}
          aria-label={isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
        >
          {isRecording ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-9 w-9 text-white" aria-hidden>
              <rect x="5" y="5" width="14" height="14" rx="2.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-9 w-9 text-white" aria-hidden>
              <rect x="9" y="2" width="6" height="13" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="17" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </svg>
          )}
        </button>
      </div>

      {/* Status */}
      <p className="relative z-10 mb-10 text-sm text-muted">
        {wsStatus === 'reconnecting'  ? '↻ Verbinde neu…'
          : wsStatus === 'error'       ? '✕ Verbindungsfehler — Seite neu laden'
          : isRecording               ? '● Aufnahme läuft — spreche jetzt'
          : 'Klicke auf das Mikrofon und fange an zu sprechen'}
      </p>

      {/* Error */}
      {error && (
        <div className="motion-safe:animate-fade-up relative z-10 mb-6 w-full max-w-xl rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Transcript */}
      {lines.length > 0 && (
        <div
          className="relative z-10 flex w-full max-w-xl flex-col gap-3"
          style={{ maxHeight: '52vh', overflowY: 'auto' }}
        >
          {[...lines].reverse().map(line => (
            <TranscriptCard key={line.id} line={line} />
          ))}
        </div>
      )}
    </div>
  );
}

function LangSelect({
  value, onChange, disabled,
}: {
  value: string; onChange: (v: string) => void; disabled: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="cursor-pointer appearance-none rounded-lg border border-rim bg-surface py-2 pl-3 pr-8 text-sm font-medium text-violet-300 outline-none transition-colors hover:border-indigo-700 disabled:cursor-default disabled:opacity-60"
      >
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, label]) => (
          <option key={code} value={code} className="bg-surface">{label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-dim">▼</span>
    </div>
  );
}

function TranscriptCard({ line }: {
  line: { id: string; original: string; translated: string; isFinal: boolean }
}) {
  return (
    <div className={[
      'motion-safe:animate-slide-in flex-shrink-0 rounded-2xl border px-5 py-4 backdrop-blur-sm transition-opacity duration-300',
      line.isFinal
        ? 'border-white/10 bg-white/[0.04]'
        : 'border-white/5 bg-white/[0.02] opacity-60',
    ].join(' ')}>
      <p className="mb-1.5 font-mono text-xs text-dim">{line.original}</p>
      <p className={[
        'text-base leading-relaxed',
        line.isFinal ? 'text-violet-200' : 'italic text-dim',
      ].join(' ')}>
        {line.isFinal ? (line.translated || line.original) : '— wird erkannt …'}
      </p>
      {line.isFinal && (
        <div className="mt-3 flex items-center gap-1.5">
          <svg viewBox="0 0 8 8" fill="none" className="h-2 w-2 text-violet-500" aria-hidden>
            <circle cx="4" cy="4" r="4" fill="currentColor" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-dim">übersetzt</span>
        </div>
      )}
    </div>
  );
}
