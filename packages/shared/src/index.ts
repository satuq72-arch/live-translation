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

export type WSErrorCode = 'DEEPGRAM_ERROR' | 'BILLING_LIMIT' | 'AUTH_ERROR';

export interface WSErrorEvent {
  type: 'error';
  code: WSErrorCode;
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
  de: 'German',
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  tr: 'Turkish',
  uk: 'Ukrainian',
  sv: 'Swedish',
  da: 'Danish',
  no: 'Norwegian',
  cs: 'Czech',
  hu: 'Hungarian',
  ro: 'Romanian',
} as const;

export type LangCode = keyof typeof SUPPORTED_LANGUAGES;
