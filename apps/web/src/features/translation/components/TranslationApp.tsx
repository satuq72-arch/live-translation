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
  const finalCount = lines.filter(l => l.isFinal).length;

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col bg-page">

      {/* ── Control strip ── */}
      <div className="relative border-b border-rim bg-surface">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 120% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-lg px-6 pb-10 pt-8">

          {/* Language row */}
          <div className="mb-8 flex items-center gap-2">
            <LangSelect value={sourceLang} onChange={setSourceLang} disabled={isRecording} />
            <button
              onClick={swap}
              disabled={isRecording}
              title="Sprachen tauschen"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-rim text-dim transition-all hover:border-indigo-700/40 hover:bg-indigo-950/30 hover:text-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                <path fillRule="evenodd" d="M13.2 2.24a.75.75 0 0 0-.04 1.06l2.1 2.2H6.75a.75.75 0 0 0 0 1.5h8.51l-2.1 2.2a.75.75 0 1 0 1.08 1.04l3.5-3.75a.75.75 0 0 0 0-1.04l-3.5-3.75a.75.75 0 0 0-1.06-.04zm-6.4 8a.75.75 0 0 0-1.06.04l-3.5 3.75a.75.75 0 0 0 0 1.04l3.5 3.75a.75.75 0 1 0 1.1-1.04l-2.1-2.2h8.51a.75.75 0 0 0 0-1.5H4.74l2.1-2.2a.75.75 0 0 0-.04-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            <LangSelect value={targetLang} onChange={setTargetLang} disabled={isRecording} />
          </div>

          {/* Mic button */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center">
              {isRecording && (
                <>
                  <span className="motion-safe:animate-ring-out absolute h-14 w-14 rounded-full border border-red-500/40" />
                  <span className="motion-safe:animate-ring-out-2 absolute h-14 w-14 rounded-full border border-red-500/20" />
                </>
              )}
              <button
                onClick={isRecording ? stop : start}
                disabled={busy}
                aria-label={isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
                className={[
                  'relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full',
                  'transition-all duration-200 active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-4 focus-visible:ring-offset-surface',
                  !isRecording && !busy ? 'motion-safe:animate-glow-idle' : '',
                  busy ? 'cursor-not-allowed opacity-40' : '',
                ].filter(Boolean).join(' ')}
                style={{
                  background: isRecording
                    ? 'linear-gradient(135deg,#ef4444,#b91c1c)'
                    : 'linear-gradient(135deg,#6366f1,#7c3aed)',
                  boxShadow: isRecording
                    ? '0 0 0 1px rgba(239,68,68,.35),0 4px 20px rgba(239,68,68,.25)'
                    : '0 0 0 1px rgba(99,102,241,.35),0 4px 20px rgba(99,102,241,.25)',
                }}
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

            {/* Status */}
            <div className="flex h-5 items-center gap-2">
              {isRecording ? (
                <>
                  <AudioWave />
                  <span className="text-xs font-medium text-red-400">Aufnahme läuft</span>
                </>
              ) : busy ? (
                <span className="text-xs text-muted">Verbindet…</span>
              ) : wsStatus === 'error' ? (
                <span className="text-xs text-red-400">Fehler — Seite neu laden</span>
              ) : (
                <span className="text-xs text-dim">Knopf drücken und sprechen</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Transcript ── */}
      <div className="mx-auto w-full max-w-lg flex-1 px-6 py-5">

        {error && (
          <div className="mb-4 rounded-xl border border-red-900/40 bg-red-950/25 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-dim">
            Transkript
          </span>
          {finalCount > 0 && (
            <span className="rounded-full bg-indigo-950/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 ring-1 ring-indigo-800/40">
              {finalCount}
            </span>
          )}
        </div>

        {lines.length > 0 ? (
          <div className="flex flex-col gap-2">
            {[...lines].reverse().map((line, i) => (
              <TranscriptCard key={line.id} line={line} isLatest={i === 0} />
            ))}
          </div>
        ) : (
          <EmptyState isRecording={isRecording} />
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
    <div className="relative flex-1">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full cursor-pointer appearance-none rounded-xl border border-rim bg-raised py-2 pl-3.5 pr-8 text-sm font-semibold text-prose outline-none transition-colors hover:border-indigo-700/40 focus:border-indigo-600/50 focus:ring-1 focus:ring-indigo-600/20 disabled:cursor-default disabled:opacity-60"
      >
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, lbl]) => (
          <option key={code} value={code} className="bg-raised">{lbl}</option>
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
      {[80, 0, 160, 40, 120].map((delay, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-red-400 motion-safe:animate-wave"
          style={{ animationDelay: `${delay}ms`, animationDuration: `${700 + i * 80}ms` }}
        />
      ))}
    </div>
  );
}

function EmptyState({ isRecording }: { isRecording: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rim bg-surface text-dim">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
          <rect x="9" y="2" width="6" height="13" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <line x1="12" y1="17" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-muted">
          {isRecording ? 'Warte auf Sprache…' : 'Übersetzungen erscheinen hier'}
        </p>
        {!isRecording && (
          <p className="mt-1 text-xs text-dim">Starte die Aufnahme oben</p>
        )}
      </div>
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
      <div className="motion-safe:animate-slide-in rounded-xl border border-rim/30 bg-surface/40 px-4 py-3 opacity-60">
        <p className="mb-1 text-xs text-dim">{line.original}</p>
        <p className="text-sm italic text-dim/60">wird transkribiert…</p>
      </div>
    );
  }

  return (
    <div
      className={[
        'motion-safe:animate-slide-in group rounded-xl border px-4 py-3 transition-colors duration-150',
        isLatest
          ? 'border-indigo-600/20 bg-indigo-950/20 shadow-[0_0_20px_rgba(99,102,241,0.05)]'
          : 'border-rim/50 bg-raised hover:border-rim',
      ].join(' ')}
    >
      <p className="mb-2 text-xs leading-relaxed text-muted">{line.original}</p>
      <p className="text-sm font-medium leading-relaxed text-violet-100">
        {line.translated || line.original}
      </p>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-indigo-500/60" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-dim">Übersetzt</span>
        </div>
        <button
          onClick={copy}
          className="flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-[11px] text-dim opacity-0 transition-all group-hover:opacity-100 hover:bg-white/5 hover:text-muted"
        >
          {copied ? <span className="text-emerald-400">✓ Kopiert</span> : 'Kopieren'}
        </button>
      </div>
    </div>
  );
}
