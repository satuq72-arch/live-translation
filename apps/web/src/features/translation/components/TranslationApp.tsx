'use client';
import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { SUPPORTED_LANGUAGES } from '@saas/shared';

export function TranslationApp() {
  const [sourceLang, setSourceLang] = useState('de');
  const [targetLang, setTargetLang] = useState('en');
  const { lines, isRecording, error, start, stop, wsStatus } = useTranslation(sourceLang, targetLang);

  const disabled = wsStatus === 'reconnecting';

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center px-6 pt-16 pb-12">

      {/* Radial glow background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, #3730a3 0%, transparent 70%)' }}
      />

      {/* Language selector */}
      <div className="mb-12 flex items-center gap-3">
        <LangSelect value={sourceLang} onChange={setSourceLang} disabled={isRecording} />
        <span className="text-2xl text-dim select-none">→</span>
        <LangSelect value={targetLang} onChange={setTargetLang} disabled={isRecording} />
      </div>

      {/* Mic button */}
      <div className="relative mb-8 flex items-center justify-center">
        {/* Pulse rings when recording */}
        {isRecording && (
          <>
            <span
              className="ring-1-animate absolute inset-0 rounded-full"
              style={{ background: 'rgba(239,68,68,0.2)' }}
            />
            <span
              className="ring-2-animate absolute inset-0 rounded-full"
              style={{ background: 'rgba(239,68,68,0.15)' }}
            />
          </>
        )}

        <button
          onClick={isRecording ? stop : start}
          disabled={disabled}
          className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-0 text-4xl transition-all duration-300 ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          } ${isRecording ? 'glow-recording' : 'glow-idle'}`}
          style={{
            background: isRecording
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
            boxShadow: isRecording
              ? '0 0 40px rgba(239,68,68,0.5), 0 8px 32px rgba(0,0,0,0.4)'
              : '0 0 40px rgba(99,102,241,0.45), 0 8px 32px rgba(0,0,0,0.4)',
          }}
          aria-label={isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
        >
          {isRecording ? '⏹' : '🎙'}
        </button>
      </div>

      {/* Status text */}
      <p className="mb-10 text-sm font-medium text-dim fade-in">
        {isRecording
          ? '● Aufnahme läuft — spreche jetzt'
          : wsStatus === 'reconnecting'
          ? '↻ Verbinde neu…'
          : wsStatus === 'error'
          ? '✕ Verbindungsfehler — Seite neu laden'
          : 'Klicke auf das Mikrofon und fange an zu sprechen'}
      </p>

      {/* Errors */}
      {error && (
        <div className="mb-6 w-full max-w-xl rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400 fade-in">
          {error}
        </div>
      )}

      {/* Transcript */}
      {lines.length > 0 && (
        <div className="flex w-full max-w-xl flex-col gap-3" style={{ maxHeight: '52vh', overflowY: 'auto' }}>
          {[...lines].reverse().map(line => (
            <TranscriptCard key={line.id} line={line} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

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
        className="appearance-none cursor-pointer rounded-lg border border-[#1e1b38] bg-[#0f0d20] py-2 pl-3 pr-8 text-sm font-medium text-[#c4b5fd] outline-none transition hover:border-[#3730a3] disabled:cursor-default disabled:opacity-60"
      >
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, label]) => (
          <option key={code} value={code} className="bg-[#0f0d20]">{label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-dim">▼</span>
    </div>
  );
}

function TranscriptCard({ line }: { line: { id: string; original: string; translated: string; isFinal: boolean } }) {
  return (
    <div
      className={`slide-in flex-shrink-0 rounded-2xl border px-5 py-4 transition-all ${
        line.isFinal
          ? 'border-[#1e1b38] bg-[#0f0d20]'
          : 'border-[#17153a] bg-[#0c0b1e] opacity-80'
      }`}
    >
      {/* Original */}
      <p className="mb-2 font-mono text-xs tracking-wide text-dim">
        {line.original}
      </p>

      {/* Translation */}
      <p
        className={`font-mono text-base leading-relaxed ${
          line.isFinal ? 'text-[#c4b5fd]' : 'italic text-[#4b4870]'
        }`}
      >
        {line.isFinal
          ? (line.translated || line.original)
          : '— wird erkannt …'}
      </p>

      {/* Final badge */}
      {line.isFinal && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-violet-500" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-dim">übersetzt</span>
        </div>
      )}
    </div>
  );
}
