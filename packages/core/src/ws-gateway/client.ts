// packages/core/ws-gateway/client.ts
// ✅ Wiederverwendbar — React Hook für WebSocket

import { useEffect, useRef, useCallback, useState } from 'react';

type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useWebSocket(url: string) {
  const ws        = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WSStatus>('disconnected');

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    ws.current = new WebSocket(url);

    ws.current.onopen  = () => setStatus('connected');
    ws.current.onclose = () => setStatus('disconnected');
    ws.current.onerror = () => setStatus('error');
  }, [url]);

  const disconnect = useCallback(() => {
    ws.current?.close();
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
    if (!ws.current) return;
    ws.current.onmessage = (event) => {
      try { handler(JSON.parse(event.data)); }
      catch { /* binary frame, kein JSON */ }
    };
  }, []);

  useEffect(() => () => { ws.current?.close(); }, []);

  return { connect, disconnect, sendJSON, sendBinary, onMessage, status };
}
