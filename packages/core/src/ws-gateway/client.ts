// packages/core/src/ws-gateway/client.ts
import { useEffect, useRef, useCallback, useState } from 'react';

export type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

const MAX_RETRIES = 5;

export function useWebSocket(url: string) {
  const ws          = useRef<WebSocket | null>(null);
  const retryCount  = useRef(0);
  const retryTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlerRef  = useRef<((data: any) => void) | null>(null);
  const [status, setStatus] = useState<WSStatus>('disconnected');

  // Re-applies the stored handler to the current WebSocket instance.
  // Called in onopen so reconnects don't lose the handler.
  const applyHandler = useCallback(() => {
    if (!ws.current || !handlerRef.current) return;
    const handler = handlerRef.current;
    ws.current.onmessage = (event) => {
      try { handler(JSON.parse(event.data)); }
      catch { /* binary frame */ }
    };
  }, []);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      setStatus('connected');
      retryCount.current = 0;
      applyHandler();
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
        retryTimer.current = setTimeout(() => connect(), delay);
      } else {
        setStatus('error');
      }
    };

    ws.current.onerror = () => setStatus('error');
  }, [url, applyHandler]);

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

  // Stores handler in ref so it survives reconnects.
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
