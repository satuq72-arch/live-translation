import WebSocket from 'ws';
import { translate } from './deepl';

const connections = new Map<string, WebSocket>();
const CONNECT_TIMEOUT_MS = 10000;

const DG_BASE = 'wss://api.deepgram.com/v1/listen';

export const handleAudio = {

  async start(
    userId:    string,
    sessionId: string,
    event:     { sourceLang: string; targetLang: string },
    onResult:  (data: object) => void
  ) {
    const params = new URLSearchParams({
      model:            'nova-2',
      language:         event.sourceLang,
      encoding:         'linear16',
      sample_rate:      '48000',
      interim_results:  'true',
      utterance_end_ms: '1000',
      punctuate:        'true',
    });

    const ws = new WebSocket(`${DG_BASE}?${params}`, {
      headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
    });

    // Wait for open with timeout
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => {
        ws.terminate();
        reject(new Error('Deepgram connection timeout'));
      }, CONNECT_TIMEOUT_MS);

      ws.once('open', () => { clearTimeout(t); resolve(); });
      ws.once('error', (err) => { clearTimeout(t); reject(err); });
    });

    ws.on('message', async (raw) => {
      let data: any;
      try { data = JSON.parse(raw.toString()); } catch { return; }
      if (data.type !== 'Results') return;

      const transcript = data.channel?.alternatives?.[0]?.transcript;
      if (!transcript) return;

      const isFinal = data.is_final ?? false;
      if (!isFinal) {
        onResult({ type: 'interim', original: transcript, translated: '' });
        return;
      }

      let translated = transcript;
      try {
        translated = await translate(transcript, event.sourceLang, event.targetLang);
      } catch { /* fallback: show original text */ }

      onResult({
        type:      'final',
        original:  transcript,
        translated,
        duration:  data.duration,
        timestamp: Date.now(),
      });
    });

    ws.on('error', (err) => {
      connections.delete(sessionId);
      onResult({ type: 'error', code: 'DEEPGRAM_ERROR', message: err.message });
    });

    ws.on('close', () => {
      connections.delete(sessionId);
    });

    connections.set(sessionId, ws);
  },

  sendAudio(sessionId: string, chunk: Buffer) {
    const ws = connections.get(sessionId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(chunk);
    }
  },

  async stop(sessionId: string) {
    const ws = connections.get(sessionId);
    if (!ws) return;
    connections.delete(sessionId);
    try { ws.close(1000); } catch { /* already closed */ }
  },
};
