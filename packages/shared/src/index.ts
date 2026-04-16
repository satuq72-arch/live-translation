// Geteilte Typen & Konstanten (Frontend + Backend)

export type Plan = 'free' | 'usage-based';

export type WSEventType = 'start' | 'stop' | 'interim' | 'final' | 'error';

export interface WSStartEvent {
  type: 'start';
  sourceLang: string;
  targetLang: string;
  sessionId: string;
}

export interface WSTranscriptEvent {
  type: 'interim' | 'final';
  original: string;
  translated: string;
  duration?: number;     // Sekunden (nur bei 'final')
  timestamp: number;
}

export interface WSErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export type WSEvent = WSStartEvent | WSTranscriptEvent | WSErrorEvent;

export interface UsageLog {
  id: string;
  userId: string;
  sessionId: string;
  minutesUsed: number;
  sourceLang: string;
  targetLang: string;
  createdAt: string;
}

export const SUPPORTED_LANGUAGES = {
  de: 'Deutsch',
  en: 'Englisch',
  fr: 'Französisch',
  es: 'Spanisch',
  it: 'Italienisch',
  pt: 'Portugiesisch',
  nl: 'Niederländisch',
  pl: 'Polnisch',
} as const;

export type LangCode = keyof typeof SUPPORTED_LANGUAGES;
