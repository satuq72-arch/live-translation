// features/translation/components/TranslationApp.tsx
'use client';
import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { SUPPORTED_LANGUAGES } from '@saas/shared';

export function TranslationApp() {
  const [sourceLang, setSourceLang] = useState('de');
  const [targetLang, setTargetLang] = useState('en');
  const { lines, isRecording, error, start, stop } = useTranslation(sourceLang, targetLang);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px', fontFamily: 'monospace' }}>

      {/* Sprachauswahl */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
        <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} disabled={isRecording}>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
        <span>→</span>
        <select value={targetLang} onChange={e => setTargetLang(e.target.value)} disabled={isRecording}>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      {/* Mikrofon Button */}
      <button
        onClick={isRecording ? stop : start}
        style={{
          width: '80px', height: '80px', borderRadius: '50%', border: 'none',
          background: isRecording ? '#ef4444' : '#4f46e5',
          color: 'white', fontSize: '28px', cursor: 'pointer',
          marginBottom: '32px', display: 'block',
          boxShadow: isRecording ? '0 0 0 8px rgba(239,68,68,0.2)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        {isRecording ? '⏹' : '🎙'}
      </button>

      {/* Fehler */}
      {error && (
        <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '13px' }}>{error}</div>
      )}

      {/* Transkript */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {lines.map(line => (
          <div key={line.id} style={{
            padding: '16px', borderRadius: '10px',
            background: line.isFinal ? '#0f0e1a' : '#07061a',
            border: `1px solid ${line.isFinal ? '#1f1d35' : '#13112a'}`,
            opacity: line.isFinal ? 1 : 0.7,
          }}>
            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '6px' }}>
              {line.original}
            </div>
            <div style={{ color: '#e0deff', fontSize: '16px' }}>
              {line.translated || (line.isFinal ? '...' : '')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
