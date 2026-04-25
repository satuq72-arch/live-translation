// apps/api/src/services/deepgram.ts — Schritt 6
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { translate } from './deepl';

const deepgram    = createClient(process.env.DEEPGRAM_API_KEY!);
const connections = new Map<string, any>();

export const handleAudio = {

  async start(
    userId:    string,
    sessionId: string,
    event:     { sourceLang: string; targetLang: string },
    onResult:  (data: object) => void
  ) {
    const live = deepgram.listen.live({
      model:             'nova-2',
      language:          event.sourceLang,
      encoding:          'linear16',
      sample_rate:       48000,
      interim_results:   true,
      utterance_end_ms:  1000,
      punctuate:         true,
    });

    live.on(LiveTranscriptionEvents.Transcript, async (data) => {
      const transcript = data.channel.alternatives[0].transcript;
      if (!transcript) return;

      const isFinal = data.is_final;

      // Interim: sofort anzeigen (kein DeepL)
      if (!isFinal) {
        onResult({ type: 'interim', original: transcript, translated: '' });
        return;
      }

      // Final: übersetzen
      const translated = await translate(transcript, event.sourceLang, event.targetLang);
      onResult({
        type:       'final',
        original:   transcript,
        translated,
        duration:   data.duration,
        timestamp:  Date.now(),
      });
    });

    live.on(LiveTranscriptionEvents.Error, (err) => {
      onResult({ type: 'error', code: 'DEEPGRAM_ERROR', message: err.message });
    });

    live.on(LiveTranscriptionEvents.Close, () => {
      connections.delete(userId);
    });

    connections.set(userId, live);
  },

  sendAudio(userId: string, chunk: Buffer) {
    connections.get(userId)?.send(chunk);
  },

  async stop(userId: string) {
    const conn = connections.get(userId);
    if (conn) { conn.finish(); connections.delete(userId); }
  },
};
