import { DeepgramClient } from '@deepgram/sdk';
import { translate } from './deepl';

const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY! });
const connections = new Map<string, any>();

const CONNECT_TIMEOUT_MS = 8000;

export const handleAudio = {

  async start(
    userId:    string,
    sessionId: string,
    event:     { sourceLang: string; targetLang: string },
    onResult:  (data: object) => void
  ) {
    const opts: any = {
      model:            'nova-2',
      language:         event.sourceLang,
      encoding:         'linear16',
      sample_rate:      48000,
      interim_results:  'true',
      utterance_end_ms: '1000',
      punctuate:        'true',
    };
    const conn = await deepgram.listen.v1.connect(opts);

    conn.on('message', async (data) => {
      if (data.type !== 'Results') return;
      const transcript = data.channel.alternatives[0]?.transcript;
      if (!transcript) return;

      const isFinal = data.is_final ?? false;

      if (!isFinal) {
        onResult({ type: 'interim', original: transcript, translated: '' });
        return;
      }

      const translated = await translate(transcript, event.sourceLang, event.targetLang);
      onResult({
        type:      'final',
        original:  transcript,
        translated,
        duration:  data.duration,
        timestamp: Date.now(),
      });
    });

    conn.on('error', (err) => {
      connections.delete(sessionId);
      onResult({ type: 'error', code: 'DEEPGRAM_ERROR', message: err.message });
    });

    conn.on('close', () => {
      connections.delete(sessionId);
    });

    conn.connect();

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Deepgram connection timeout')), CONNECT_TIMEOUT_MS)
    );
    await Promise.race([conn.waitForOpen(), timeout]);

    connections.set(sessionId, conn);
  },

  sendAudio(sessionId: string, chunk: Buffer) {
    connections.get(sessionId)?.sendMedia(chunk);
  },

  async stop(sessionId: string) {
    const conn = connections.get(sessionId);
    if (!conn) return;
    connections.delete(sessionId);
    try { conn.close(); } catch { /* already closed */ }
  },
};
