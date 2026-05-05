// features/translation/components/TranslationApp.tsx
'use client';
import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { SUPPORTED_LANGUAGES } from '@saas/shared';

export function TranslationApp() {
  const [sourceLang, setSourceLang] = useState('de');
  const [targetLang, setTargetLang] = useState('en');
  const { lines, isRecording, error, start, stop, wsStatus } = useTranslation(sourceLang, targetLang);

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
        disabled={wsStatus === 'reconnecting'}
        style={{
          width: '80px', height: '80px', borderRadius: '50%', border: 'none',
          background: isRecording ? '#ef4444' : '#4f46e5',
          color: 'white', fontSize: '28px', cursor: wsStatus === 'reconnecting' ? 'not-allowed' : 'pointer',
          marginBottom: '24px', display: 'block',
          boxShadow: isRecording ? '0 0 0 8px rgba(239,68,68,0.2)' : 'none',
          transition: 'all 0.2s',
          opacity: wsStatus === 'reconnecting' ? 0.6 : 1,
        }}
      >
        {isRecording ? '⏹' : '🎙'}
      </button>

      {/* Reconnect Status */}
      {wsStatus === 'reconnecting' && (
        <div style={{ color: '#f59e0b', marginBottom: '16px', fontSize: '13px' }}>
          Verbindung unterbrochen — verbinde neu...
        </div>
      )}
      {wsStatus === 'error' && (
        <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '13px' }}>
          Verbindung fehlgeschlagen. Bitte Seite neu laden.
        </div>
      )}

      {/* App-Fehler */}
      {error && (
        <div style={{
          color: '#ef4444', marginBottom: '16px', fontSize: '13px',
          padding: '12px', background: '#1f0000', borderRadius: '8px', border: '1px solid #3f0000',
        }}>
          {error}
        </div>
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
            <div style={{ color: line.isFinal ? '#e0deff' : '#4b4870', fontSize: '16px', fontStyle: line.isFinal ? 'normal' : 'italic' }}>
              {line.isFinal ? (line.translated || line.original) : '— wird erkannt …'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
