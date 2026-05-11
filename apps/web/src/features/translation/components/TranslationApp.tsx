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
    <div className="relative flex min-h-[calc(100vh-56px)] flex-col items-center px-6 pb-16 pt-14">

      {/* Top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-25"
        style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 0%, #4338ca, transparent)' }}
      />

      {/* Language selector */}
      <div className="relative z-10 mb-12 flex items-center gap-3">
        <LangSelect value={sourceLang} onChange={setSourceLang} disabled={isRecording} />
        <button
          onClick={swap}
          disabled={isRecording}
          title="Tauschen"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-rim bg-surface text-dim transition hover:border-indigo-600/50 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
            <path d="M4 10h12M13 6l4 4-4 4M7 14l-4-4 4-4" />
          </svg>
        </button>
        <LangSelect value={targetLang} onChange={setTargetLang} disabled={isRecording} />
      </div>

      {/* Mic button */}
      <div className="relative z-10 mb-5 flex items-center justify-center">
        {isRecording && (
          <>
            <span className="motion-safe:animate-ring-out absolute h-16 w-16 rounded-full bg-red-500/20" />
            <span className="motion-safe:animate-ring-out-2 absolute h-16 w-16 rounded-full bg-red-500/10" />
          </>
        )}
        <button
          onClick={isRecording ? stop : start}
          disabled={busy}
          className={[
            'relative z-10 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-0 outline-none',
            'transition-all duration-200 active:scale-95',
            'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-4 focus-visible:ring-offset-page',
            busy && 'cursor-not-allowed opacity-40',
            !isRecording && !busy && 'motion-safe:animate-glow-idle',
          ].filter(Boolean).join(' ')}
          style={{
            background: isRecording
              ? 'linear-gradient(135deg,#ef4444,#b91c1c)'
              : 'linear-gradient(135deg,#6366f1,#7c3aed)',
            boxShadow: isRecording
              ? '0 0 32px rgba(239,68,68,.5), 0 6px 20px rgba(0,0,0,.6)'
              : '0 0 28px rgba(99,102,241,.5), 0 6px 20px rgba(0,0,0,.6)',
          }}
          aria-label={isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
        >
          {busy ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : isRecording ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white" aria-hidden>
              <rect x="6" y="6" width="12" height="12" rx="2.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white" aria-hidden>
              <rect x="9" y="2" width="6" height="13" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="17" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </svg>
          )}
        </button>
      </div>

      {/* Status / waveform */}
      <div className="relative z-10 mb-10 flex h-6 items-center justify-center">
        {busy ? (
          <span className="text-sm text-muted">Verbinde neu…</span>
        ) : wsStatus === 'error' ? (
          <span className="text-sm text-red-400">Verbindungsfehler — Seite neu laden</span>
        ) : isRecording ? (
          <div className="flex items-center gap-2">
            <AudioWave />
            <span className="text-sm text-red-400">Aufnahme läuft</span>
          </div>
        ) : (
          <span className="text-sm text-muted">Klicke auf das Mikrofon und fange an zu sprechen</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="motion-safe:animate-fade-up relative z-10 mb-6 w-full max-w-xl rounded-xl border border-red-900/40 bg-red-950/25 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Transcript */}
      {lines.length > 0 && (
        <div
          className="relative z-10 w-full max-w-xl"
          style={{ maxHeight: '50vh', overflowY: 'auto' }}
        >
          <div className="flex flex-col gap-2.5">
            {[...lines].reverse().map((line, i) => (
              <TranscriptCard key={line.id} line={line} highlight={i === 0 && line.isFinal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function LangSelect({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="cursor-pointer appearance-none rounded-xl border border-rim bg-surface py-2 pl-4 pr-8 text-sm font-semibold text-prose outline-none transition hover:border-indigo-700 disabled:cursor-default disabled:opacity-60"
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

function TranscriptCard({ line, highlight }: {
  line: { id: string; original: string; translated: string; isFinal: boolean };
  highlight: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(line.translated || line.original).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={[
      'motion-safe:animate-slide-in group rounded-2xl border px-5 py-4 backdrop-blur-sm transition-all duration-200',
      !line.isFinal
        ? 'border-white/[0.05] bg-transparent opacity-55'
        : highlight
          ? 'border-indigo-500/30 bg-indigo-950/25'
          : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.13]',
    ].join(' ')}>

      {/* Original text */}
      <p className="mb-2 text-xs leading-relaxed text-muted">{line.original}</p>

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
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-dim opacity-0 transition group-hover:opacity-100 hover:bg-white/[0.06] hover:text-muted"
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
      )}
    </div>
  );
}
