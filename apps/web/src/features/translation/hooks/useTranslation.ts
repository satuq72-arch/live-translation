// features/translation/hooks/useTranslation.ts
'use client';
import { useState, useRef, useCallback } from 'react';
import { useWebSocket } from '@saas/core/ws-gateway/client';
import type { WSTranscriptEvent } from '@saas/shared';

export interface TranscriptLine {
  id:          string;
  original:    string;
  translated:  string;
  isFinal:     boolean;
  timestamp:   number;
}

export function useTranslation(sourceLang: string, targetLang: string) {
  const [lines, setLines]         = useState<TranscriptLine[]>([]);
  const [isRecording, setIsRec]   = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const workletRef                = useRef<AudioWorkletNode | null>(null);
  const contextRef                = useRef<AudioContext | null>(null);
  const interimIdRef              = useRef<string>('interim');

  const ws = useWebSocket(
    `${process.env.NEXT_PUBLIC_API_URL!.replace('http', 'ws')}/ws/translate`
  );

  // Nachrichten vom Server verarbeiten
  const handleMessage = useCallback((data: WSTranscriptEvent) => {
    if (data.type === 'interim') {
      setLines(prev => {
        const rest = prev.filter(l => l.id !== interimIdRef.current);
        return [...rest, { id: interimIdRef.current, original: data.original, translated: '', isFinal: false, timestamp: Date.now() }];
      });
    }
    if (data.type === 'final') {
      setLines(prev => {
        const rest = prev.filter(l => l.id !== interimIdRef.current);
        return [...rest, { id: crypto.randomUUID(), original: data.original, translated: data.translated, isFinal: true, timestamp: Date.now() }];
      });
    }
    if (data.type === 'error') setError(data.message);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setLines([]);

    // Mikrofon + AudioWorklet
    const stream  = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = new AudioContext({ sampleRate: 48000 });
    await context.audioWorklet.addModule('/worklets/pcm-processor.js');

    const source  = context.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(context, 'pcm-processor');

    worklet.port.onmessage = (e) => ws.sendBinary(e.data);
    source.connect(worklet);

    contextRef.current = context;
    workletRef.current = worklet;

    // WS starten
    ws.connect();
    ws.onMessage(handleMessage);
    ws.sendJSON({ type: 'start', sourceLang, targetLang, sessionId: crypto.randomUUID() });
    setIsRec(true);
  }, [sourceLang, targetLang, ws, handleMessage]);

  const stop = useCallback(async () => {
    ws.sendJSON({ type: 'stop' });
    ws.disconnect();
    workletRef.current?.disconnect();
    await contextRef.current?.close();
    setIsRec(false);
  }, [ws]);

  return { lines, isRecording, error, start, stop };
}
