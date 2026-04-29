'use client';
import { useEffect, useRef, useCallback, useState } from 'react';

export type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

const MAX_RETRIES = 5;

export function useWebSocket(url: string) {
  const ws           = useRef<WebSocket | null>(null);
  const retryCount   = useRef(0);
  const retryTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlerRef   = useRef<((data: any) => void) | null>(null);
  const openResolve  = useRef<(() => void) | null>(null);
  const currentUrl   = useRef<string>(url);
  const [status, setStatus] = useState<WSStatus>('disconnected');

  const applyHandler = useCallback(() => {
    if (!ws.current || !handlerRef.current) return;
    const handler = handlerRef.current;
    ws.current.onmessage = (event) => {
      try { handler(JSON.parse(event.data)); }
      catch { /* binary frame or parse error */ }
    };
  }, []);

  const connectInternal = useCallback((resolve?: () => void) => {
    setStatus('connecting');
    ws.current = new WebSocket(currentUrl.current);

    ws.current.onopen = () => {
      setStatus('connected');
      retryCount.current = 0;
      applyHandler();
      openResolve.current?.();
      openResolve.current = null;
      resolve?.();
    };

    ws.current.onclose = (event) => {
      if (event.code === 1000) {
        setStatus('disconnected');
        return;
      }
      if (retryCount.current < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount.current) * 1000;
        retryCount.current += 1;
        setStatus('reconnecting');
        retryTimer.current = setTimeout(() => connectInternal(), delay);
      } else {
        setStatus('error');
      }
    };

    ws.current.onerror = () => setStatus('error');
  }, [applyHandler]);

  // connectUrl is optional — pass a token-bearing URL on first connect,
  // reconnects reuse the same URL stored in currentUrl ref.
  const connect = useCallback((connectUrl?: string): Promise<void> => {
    if (ws.current?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (connectUrl) currentUrl.current = connectUrl;
    retryCount.current = 0;
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
    return new Promise((resolve) => {
      openResolve.current = resolve;
      connectInternal(resolve);
    });
  }, [connectInternal]);

  const disconnect = useCallback(() => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryCount.current = MAX_RETRIES;
    ws.current?.close(1000);
  }, []);

  const sendJSON = useCallback((data: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  const sendBinary = useCallback((data: ArrayBuffer) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(data);
    }
  }, []);

  const onMessage = useCallback((handler: (data: any) => void) => {
    handlerRef.current = handler;
    applyHandler();
  }, [applyHandler]);

  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    ws.current?.close();
  }, []);

  return { connect, disconnect, sendJSON, sendBinary, onMessage, status };
}
