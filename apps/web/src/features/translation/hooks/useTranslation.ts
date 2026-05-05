'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useWebSocket } from '@saas/core/ws-gateway/client';
import type { WSTranscriptEvent, WSErrorEvent } from '@saas/shared';

export interface TranscriptLine {
  id:         string;
  original:   string;
  translated: string;
  isFinal:    boolean;
  timestamp:  number;
}

export function useTranslation(sourceLang: string, targetLang: string) {
  const { getToken }                      = useAuth();
  const [lines, setLines]                 = useState<TranscriptLine[]>([]);
  const [isRecording, setIsRec]           = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const workletRef                        = useRef<AudioWorkletNode | null>(null);
  const contextRef                        = useRef<AudioContext | null>(null);
  const streamRef                         = useRef<MediaStream | null>(null);
  const interimIdRef                      = useRef<string>('interim');

  const wsBaseUrl = useMemo(() => {
    const u = new URL(process.env.NEXT_PUBLIC_API_URL!);
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${u.toString()}ws/translate`;
  }, []);

  const ws = useWebSocket(wsBaseUrl);

  useEffect(() => {
    ws.onMessage((data: WSTranscriptEvent | WSErrorEvent) => {
      if (data.type === 'interim') {
        setLines(prev => {
          const rest = prev.filter(l => l.id !== interimIdRef.current);
          return [...rest, {
            id: interimIdRef.current,
            original: (data as WSTranscriptEvent).original,
            translated: '',
            isFinal: false,
            timestamp: Date.now(),
          }];
        });
      }
      if (data.type === 'final') {
        setLines(prev => {
          const rest = prev.filter(l => l.id !== interimIdRef.current);
          return [...rest, {
            id: crypto.randomUUID(),
            original: (data as WSTranscriptEvent).original,
            translated: (data as WSTranscriptEvent).translated,
            isFinal: true,
            timestamp: Date.now(),
          }];
        });
      }
      if (data.type === 'error') {
        const err = data as WSErrorEvent;
        setIsRec(false);
        if (err.code === 'BILLING_LIMIT') {
          setError('Dein Kontingent ist aufgebraucht. Bitte abonniere einen Plan.');
        } else if (err.code === 'AUTH_ERROR') {
          setError(err.message || 'Authentifizierungsfehler. Bitte Seite neu laden.');
        } else {
          setError(err.message);
        }
      }
    });
  }, [ws]);

  const start = useCallback(async () => {
    setError(null);
    setLines([]);

    let stream:  MediaStream  | null = null;
    let context: AudioContext | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      context = new AudioContext({ sampleRate: 48000 });
      await context.audioWorklet.addModule('/worklets/pcm-processor.js');

      const source  = context.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(context, 'pcm-processor');

      worklet.port.onmessage = (e) => ws.sendBinary(e.data);
      source.connect(worklet);
      worklet.connect(context.destination); // keep worklet in the audio graph

      contextRef.current = context;
      workletRef.current = worklet;

      // Pass Clerk token in WebSocket URL for cross-origin auth
      const token = await getToken();
      const wsUrl = token ? `${wsBaseUrl}?token=${token}` : wsBaseUrl;
      await ws.connect(wsUrl);
      ws.sendJSON({ type: 'start', sourceLang, targetLang, sessionId: crypto.randomUUID() });
      setIsRec(true);
    } catch (err: any) {
      stream?.getTracks().forEach(t => t.stop());
      await context?.close();
      streamRef.current  = null;
      contextRef.current = null;
      workletRef.current = null;
      const msg = err?.name === 'NotAllowedError'
        ? 'Mikrofonzugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.'
        : err?.message ?? 'Fehler beim Starten der Aufnahme.';
      setError(msg);
    }
  }, [sourceLang, targetLang, ws, getToken, wsBaseUrl]);

  const stop = useCallback(async () => {
    ws.sendJSON({ type: 'stop' });
    ws.disconnect();
    workletRef.current?.disconnect();
    await contextRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsRec(false);
  }, [ws]);

  return { lines, isRecording, error, start, stop, wsStatus: ws.status };
}
