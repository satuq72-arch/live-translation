'use client';
import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { SUPPORTED_LANGUAGES } from '@saas/shared';

const selectStyle: React.CSSProperties = {
  background: '#1a1840', border: '1px solid #2a2860', borderRadius: '8px',
  color: '#e0deff', padding: '8px 12px', fontSize: '14px', cursor: 'pointer',
  outline: 'none', appearance: 'none', WebkitAppearance: 'none',
  paddingRight: '28px',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
};

export function TranslationApp() {
  const [sourceLang, setSourceLang] = useState('de');
  const [targetLang, setTargetLang] = useState('en');
  const { lines, isRecording, error, start, stop, wsStatus } = useTranslation(sourceLang, targetLang);

  return (
    <div style={{
      maxWidth: '720px', margin: '0 auto', padding: '48px 32px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>

      {/* Sprachen */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
        <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} disabled={isRecording} style={selectStyle}>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
        <span style={{ color: '#4b4870', fontSize: '18px' }}>→</span>
        <select value={targetLang} onChange={e => setTargetLang(e.target.value)} disabled={isRecording} style={selectStyle}>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      {/* Mikrofon */}
      <div style={{ position: 'relative', marginBottom: '48px' }}>
        {isRecording && (
          <span style={{
            position: 'absolute', inset: '-12px', borderRadius: '50%',
            background: 'rgba(239,68,68,0.15)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        )}
        <button
          onClick={isRecording ? stop : start}
          disabled={wsStatus === 'reconnecting'}
          style={{
            width: '88px', height: '88px', borderRadius: '50%', border: 'none',
            background: isRecording
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: 'white', fontSize: '32px',
            cursor: wsStatus === 'reconnecting' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isRecording
              ? '0 0 0 0 rgba(239,68,68,0), 0 8px 32px rgba(239,68,68,0.4)'
              : '0 8px 32px rgba(99,102,241,0.35)',
            transition: 'all 0.25s ease',
            opacity: wsStatus === 'reconnecting' ? 0.5 : 1,
            position: 'relative',
          }}
        >
          {isRecording ? '⏹' : '🎙'}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
      `}</style>

      {/* Status */}
      <div style={{ width: '100%', maxWidth: '600px' }}>
        {wsStatus === 'reconnecting' && (
          <div style={{
            color: '#fbbf24', marginBottom: '16px', fontSize: '13px',
            padding: '10px 14px', background: '#1c1700', borderRadius: '8px',
            border: '1px solid #2c2200',
          }}>
            Verbindung unterbrochen — verbinde neu…
          </div>
        )}
        {wsStatus === 'error' && (
          <div style={{
            color: '#f87171', marginBottom: '16px', fontSize: '13px',
            padding: '10px 14px', background: '#1f0a0a', borderRadius: '8px',
            border: '1px solid #3a1010',
          }}>
            Verbindung fehlgeschlagen. Bitte Seite neu laden.
          </div>
        )}
        {error && (
          <div style={{
            color: '#f87171', marginBottom: '16px', fontSize: '13px',
            padding: '10px 14px', background: '#1f0a0a', borderRadius: '8px',
            border: '1px solid #3a1010',
          }}>
            {error}
          </div>
        )}

        {/* Hint wenn idle */}
        {!isRecording && lines.length === 0 && (
          <p style={{ color: '#4b4870', fontSize: '14px', textAlign: 'center', margin: '0' }}>
            Klicke auf das Mikrofon und fange an zu sprechen.
          </p>
        )}

        {/* Transkript */}
        {lines.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '55vh', overflowY: 'auto' }}>
            {[...lines].reverse().map(line => (
              <div key={line.id} style={{
                padding: '14px 16px', borderRadius: '12px', flexShrink: 0,
                background: line.isFinal ? '#131130' : '#0f0d28',
                border: `1px solid ${line.isFinal ? '#232048' : '#1a1840'}`,
                opacity: line.isFinal ? 1 : 0.8,
              }}>
                <div style={{ color: '#4b4870', fontSize: '11px', marginBottom: '5px', fontFamily: 'monospace' }}>
                  {line.original}
                </div>
                <div style={{
                  color: line.isFinal ? '#c4b5fd' : '#5b508a',
                  fontSize: '15px', lineHeight: '1.5',
                  fontStyle: line.isFinal ? 'normal' : 'italic',
                  fontFamily: 'monospace',
                }}>
                  {line.isFinal ? (line.translated || line.original) : '— wird erkannt …'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
