# Live Translation Fix & Deploy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all bugs, add WebSocket reconnect robustness, configure external services, and deploy the live-translation app to Vercel + Railway.

**Architecture:** Monorepo — `packages/core` (shared WS + billing logic), `apps/api` (Fastify + Deepgram + DeepL), `apps/web` (Next.js 14 + Clerk). Changes flow outward: fix shared packages first, then API, then frontend.

**Tech Stack:** TypeScript, Next.js 14, Fastify 4, Deepgram SDK, deepl-node, Clerk, Stripe, Supabase, Vercel, Railway.

---

## File Map

| File | Change |
|------|--------|
| `packages/shared/src/index.ts` | Add `WSErrorCode` union type |
| `packages/core/src/ws-gateway/server.ts` | Key sessions by `sessionId`, update all method signatures |
| `packages/core/src/ws-gateway/client.ts` | Add reconnect logic (5 retries, exponential backoff), export `status` |
| `apps/api/src/routes/ws.ts` | Enforce free tier, fix auth typing, use event.sessionId, add try/catch |
| `apps/api/src/services/deepgram.ts` | Listen to Close event, clean up connections Map |
| `apps/web/src/features/translation/hooks/useTranslation.ts` | Fix URL, fix stream stop, register handler once, expose wsStatus |
| `apps/web/src/features/translation/components/TranslationApp.tsx` | Show reconnecting indicator, error code handling |

---

## Task 1: Add WSErrorCode to shared types

**Files:**
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Add error code union type**

Open `packages/shared/src/index.ts` and replace the `WSErrorEvent` interface:

```typescript
// BEFORE:
export interface WSErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

// AFTER:
export type WSErrorCode = 'DEEPGRAM_ERROR' | 'BILLING_LIMIT' | 'AUTH_ERROR';

export interface WSErrorEvent {
  type: 'error';
  code: WSErrorCode;
  message: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/mehmet/live-translation && npx tsc --noEmit -p packages/shared/tsconfig.json 2>/dev/null || npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/index.ts
git commit -m "fix: add WSErrorCode union type to shared"
```

---

## Task 2: Fix WSSessionManager — key by sessionId

**Files:**
- Modify: `packages/core/src/ws-gateway/server.ts`

- [ ] **Step 1: Replace full file content**

```typescript
// packages/core/src/ws-gateway/server.ts
import type { WebSocket } from 'ws';

export interface Session {
  userId:    string;
  sessionId: string;
  socket:    WebSocket;
  meta:      Record<string, string>;
  startedAt: Date;
}

export class WSSessionManager {
  private sessions = new Map<string, Session>();

  add(userId: string, sessionId: string, socket: WebSocket, meta: Record<string, string> = {}) {
    this.sessions.set(sessionId, { userId, sessionId, socket, meta, startedAt: new Date() });
  }

  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  remove(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  send(sessionId: string, data: object) {
    const session = this.sessions.get(sessionId);
    if (session?.socket.readyState === 1) {
      session.socket.send(JSON.stringify(data));
    }
  }

  count(): number {
    return this.sessions.size;
  }
}

export const sessionManager = new WSSessionManager();
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/mehmet/live-translation && npx tsc --noEmit -p packages/core/tsconfig.json 2>/dev/null || echo "check manually"
```

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/ws-gateway/server.ts
git commit -m "fix: key WSSessionManager by sessionId instead of userId"
```

---

## Task 3: Fix WS client — URL helper + reconnect logic

**Files:**
- Modify: `packages/core/src/ws-gateway/client.ts`

- [ ] **Step 1: Replace full file content**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/ws-gateway/client.ts
git commit -m "fix: add WS reconnect logic with exponential backoff"
```

---

## Task 4: Fix ws.ts route

**Files:**
- Modify: `apps/api/src/routes/ws.ts`

Fixes: free-tier enforcement (#1), auth typing (#9), sessionId from client (#6), try/catch on handleAudio (#7), sessionManager uses sessionId (#3).

- [ ] **Step 1: Replace full file content**

```typescript
// apps/api/src/routes/ws.ts
import type { FastifyPluginAsync } from 'fastify';
import { getAuth } from '@clerk/fastify';
import { sessionManager } from '@saas/core/ws-gateway/server';
import { UsageTracker }   from '@saas/core/usage/tracker';
import { checkFreeTier }  from '@saas/core/billing/usage';
import { handleAudio }    from '../services/deepgram';
import type { WSErrorEvent } from '@saas/shared';

const wsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/translate', { websocket: true }, async (socket, req) => {

    // 1. Auth
    const { userId } = getAuth(req);
    if (!userId) {
      socket.close(1008, 'Unauthorized');
      return;
    }

    // 2. Free Tier prüfen und durchsetzen
    const { hasFreeTier, remaining } = await checkFreeTier(userId);
    if (!hasFreeTier || remaining <= 0) {
      const err: WSErrorEvent = { type: 'error', code: 'BILLING_LIMIT', message: 'Dein Free-Tier-Kontingent ist aufgebraucht.' };
      socket.send(JSON.stringify(err));
      socket.close(1000, 'Billing limit');
      return;
    }

    let sessionId: string | null = null;
    let tracker: UsageTracker | null = null;

    socket.on('message', async (msg: Buffer) => {
      const isJSON = msg[0] === 123; // '{'

      if (isJSON) {
        let event: any;
        try { event = JSON.parse(msg.toString()); } catch { return; }

        if (event.type === 'start') {
          // sessionId vom Frontend übernehmen
          sessionId = event.sessionId ?? crypto.randomUUID();
          tracker   = new UsageTracker(userId, sessionId);
          sessionManager.add(userId, sessionId, socket as any);

          try {
            await handleAudio.start(userId, sessionId, event, (result) => {
              sessionManager.send(sessionId!, result);
              if ((result as any).type === 'final') {
                tracker!.tick(((result as any).duration ?? 0) / 60);
              }
            });
          } catch (err: any) {
            const wsErr: WSErrorEvent = { type: 'error', code: 'DEEPGRAM_ERROR', message: err.message };
            socket.send(JSON.stringify(wsErr));
          }
        }

        if (event.type === 'stop' && sessionId) {
          await handleAudio.stop(userId);
          await tracker?.stop();
          sessionManager.remove(sessionId);
          sessionId = null;
        }

      } else {
        // Binary PCM Audio → Deepgram
        handleAudio.sendAudio(userId, msg);
      }
    });

    socket.on('close', async () => {
      await handleAudio.stop(userId);
      await tracker?.stop();
      if (sessionId) sessionManager.remove(sessionId);
    });
  });
};

export default wsRoutes;
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/routes/ws.ts
git commit -m "fix: enforce free tier, fix auth typing, use client sessionId, add error handling in ws route"
```

---

## Task 5: Fix Deepgram memory leak

**Files:**
- Modify: `apps/api/src/services/deepgram.ts`

- [ ] **Step 1: Add Close event listener in start()**

In `start()`, after registering the Error listener, add:

```typescript
// AFTER the live.on(LiveTranscriptionEvents.Error, ...) block, add:
live.on(LiveTranscriptionEvents.Close, () => {
  connections.delete(userId);
});
```

The full `start()` method after the fix:

```typescript
async start(
  userId:    string,
  sessionId: string,
  event:     { sourceLang: string; targetLang: string },
  onResult:  (data: object) => void
) {
  const live = deepgram.listen.live({
    model:            'nova-2',
    language:         event.sourceLang,
    encoding:         'linear16',
    sample_rate:      48000,
    interim_results:  true,
    utterance_end_ms: 1000,
    punctuate:        true,
  });

  live.on(LiveTranscriptionEvents.Transcript, async (data) => {
    const transcript = data.channel.alternatives[0].transcript;
    if (!transcript) return;

    const isFinal = data.is_final;

    if (!isFinal) {
      onResult({ type: 'interim', original: transcript, translated: '' });
      return;
    }

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
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/services/deepgram.ts
git commit -m "fix: clean up deepgram connections map on close event"
```

---

## Task 6: Fix useTranslation hook

**Files:**
- Modify: `apps/web/src/features/translation/hooks/useTranslation.ts`

Fixes: URL conversion (#5), stream not stopped (#2), stacked message handlers (#4). Adds reconnect status exposure.

- [ ] **Step 1: Replace full file content**

```typescript
// features/translation/hooks/useTranslation.ts
'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  const [lines, setLines]       = useState<TranscriptLine[]>([]);
  const [isRecording, setIsRec] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const workletRef              = useRef<AudioWorkletNode | null>(null);
  const contextRef              = useRef<AudioContext | null>(null);
  const streamRef               = useRef<MediaStream | null>(null);
  const interimIdRef            = useRef<string>('interim');

  // Fix: safe protocol replacement
  const wsUrl = useMemo(() => {
    const u = new URL(process.env.NEXT_PUBLIC_API_URL!);
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${u.toString()}ws/translate`;
  }, []);

  const ws = useWebSocket(wsUrl);

  // Fix: register message handler once, not on every start()
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
        if (err.code === 'BILLING_LIMIT') {
          setError('Dein Free-Tier-Kontingent ist aufgebraucht. Bitte abonniere einen Plan.');
          setIsRec(false);
        } else if (err.code === 'AUTH_ERROR') {
          window.location.href = '/auth/sign-in';
        } else {
          setError(err.message);
        }
      }
    });
  }, [ws]);

  const start = useCallback(async () => {
    setError(null);
    setLines([]);

    const stream  = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const context = new AudioContext({ sampleRate: 48000 });
    await context.audioWorklet.addModule('/worklets/pcm-processor.js');

    const source  = context.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(context, 'pcm-processor');

    worklet.port.onmessage = (e) => ws.sendBinary(e.data);
    source.connect(worklet);

    contextRef.current = context;
    workletRef.current = worklet;

    ws.connect();
    ws.sendJSON({ type: 'start', sourceLang, targetLang, sessionId: crypto.randomUUID() });
    setIsRec(true);
  }, [sourceLang, targetLang, ws]);

  const stop = useCallback(async () => {
    ws.sendJSON({ type: 'stop' });
    ws.disconnect();
    workletRef.current?.disconnect();
    await contextRef.current?.close();
    // Fix: stop mic stream so browser indicator goes off
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsRec(false);
  }, [ws]);

  return { lines, isRecording, error, start, stop, wsStatus: ws.status };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/translation/hooks/useTranslation.ts
git commit -m "fix: stop mic stream on stop, fix WS URL, register message handler once"
```

---

## Task 7: Update TranslationApp UI

**Files:**
- Modify: `apps/web/src/features/translation/components/TranslationApp.tsx`

- [ ] **Step 1: Replace full file content**

```typescript
// features/translation/components/TranslationApp.tsx
'use client';
import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { SUPPORTED_LANGUAGES } from '@saas/shared';

export function TranslationApp() {
  const [sourceLang, setSourceLang] = useState('de');
  const [targetLang, setTargetLang] = useState('en');
  const { lines, isRecording, error, start, stop, wsStatus } = useTranslation(sourceLang, targetLang);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px', fontFamily: 'monospace' }}>

      {/* Sprachauswahl */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
        <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} disabled={isRecording}>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
        <span>→</span>
        <select value={targetLang} onChange={e => setTargetLang(e.target.value)} disabled={isRecording}>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      {/* Mikrofon Button */}
      <button
        onClick={isRecording ? stop : start}
        disabled={wsStatus === 'reconnecting'}
        style={{
          width: '80px', height: '80px', borderRadius: '50%', border: 'none',
          background: isRecording ? '#ef4444' : '#4f46e5',
          color: 'white', fontSize: '28px', cursor: wsStatus === 'reconnecting' ? 'not-allowed' : 'pointer',
          marginBottom: '24px', display: 'block',
          boxShadow: isRecording ? '0 0 0 8px rgba(239,68,68,0.2)' : 'none',
          transition: 'all 0.2s',
          opacity: wsStatus === 'reconnecting' ? 0.6 : 1,
        }}
      >
        {isRecording ? '⏹' : '🎙'}
      </button>

      {/* Reconnect Status */}
      {wsStatus === 'reconnecting' && (
        <div style={{ color: '#f59e0b', marginBottom: '16px', fontSize: '13px' }}>
          Verbindung unterbrochen — verbinde neu...
        </div>
      )}
      {wsStatus === 'error' && (
        <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '13px' }}>
          Verbindung fehlgeschlagen. Bitte Seite neu laden.
        </div>
      )}

      {/* App-Fehler */}
      {error && (
        <div style={{
          color: '#ef4444', marginBottom: '16px', fontSize: '13px',
          padding: '12px', background: '#1f0000', borderRadius: '8px', border: '1px solid #3f0000',
        }}>
          {error}
        </div>
      )}

      {/* Transkript */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {lines.map(line => (
          <div key={line.id} style={{
            padding: '16px', borderRadius: '10px',
            background: line.isFinal ? '#0f0e1a' : '#07061a',
            border: `1px solid ${line.isFinal ? '#1f1d35' : '#13112a'}`,
            opacity: line.isFinal ? 1 : 0.7,
          }}>
            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '6px' }}>
              {line.original}
            </div>
            <div style={{ color: '#e0deff', fontSize: '16px' }}>
              {line.translated || (line.isFinal ? '...' : '')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/translation/components/TranslationApp.tsx
git commit -m "feat: show reconnecting/error status, handle billing limit error in UI"
```

---

## Task 8: Local test — verify app builds

- [ ] **Step 1: Install all dependencies**

```bash
cd /Users/mehmet/live-translation && npm install
```

- [ ] **Step 2: Create .env for API**

```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env` and fill in real values:
```
DEEPGRAM_API_KEY=your_key
DEEPL_API_KEY=your_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key
CLERK_SECRET_KEY=sk_...
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 3: Create .env for web**

```bash
cp .env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_API_URL=http://localhost:3001
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
```

- [ ] **Step 4: Build API**

```bash
cd /Users/mehmet/live-translation/apps/api && npm run build
```
Expected: no TypeScript errors, `dist/` folder created

- [ ] **Step 5: Build web**

```bash
cd /Users/mehmet/live-translation/apps/web && npm run build
```
Expected: no TypeScript errors, `.next/` folder created

- [ ] **Step 6: Start both apps**

Terminal 1:
```bash
cd /Users/mehmet/live-translation/apps/api && npm run dev
```

Terminal 2:
```bash
cd /Users/mehmet/live-translation/apps/web && npm run dev
```

- [ ] **Step 7: Manual test**

Open `http://localhost:3000/auth/sign-in`, create account, navigate to `/dashboard/translate`, test mic → transcription → translation flow.

---

## Task 9: Supabase schema setup

- [ ] **Step 1: Open Supabase SQL Editor**

Go to `https://supabase.com/dashboard` → your project → SQL Editor

- [ ] **Step 2: Run schema**

Copy the contents of `supabase/schema.sql` and execute it in the SQL editor.

Expected: 4 tables created (`users`, `subscriptions`, `usage_logs`, `sessions`), RLS policies applied.

- [ ] **Step 3: Verify tables**

In Supabase dashboard → Table Editor: confirm `users`, `subscriptions`, `usage_logs`, `sessions` tables exist.

---

## Task 10: Clerk webhook configuration

- [ ] **Step 1: After Vercel deployment (Task 12), go to Clerk Dashboard**

`https://dashboard.clerk.com` → your application → Webhooks → Add Endpoint

- [ ] **Step 2: Configure endpoint**

- URL: `https://<your-vercel-domain>/api/webhooks/clerk`
- Events: select `user.created`
- Copy the Signing Secret → save as `CLERK_WEBHOOK_SECRET` in Vercel env vars

---

## Task 11: Stripe product setup

- [ ] **Step 1: Create product in Stripe Dashboard**

`https://dashboard.stripe.com` → Products → Create product

- Name: `Live Translation`
- Pricing model: `Usage-based` (metered)
- Unit: per minute
- Price: `0.05` per unit

- [ ] **Step 2: Copy price ID**

After creating, copy the `price_xxx` ID — needed when creating subscriptions.

- [ ] **Step 3: Create Stripe webhook**

Stripe Dashboard → Webhooks → Add endpoint

- URL: `https://<your-railway-domain>/stripe/webhook`
- Events: `customer.subscription.created`, `customer.subscription.deleted`, `invoice.payment_failed`
- Copy Signing Secret → save as `STRIPE_WEBHOOK_SECRET` in Railway env vars

---

## Task 12: Deploy API to Railway

- [ ] **Step 1: Go to Railway**

`https://railway.app` → New Project → Deploy from GitHub repo

- [ ] **Step 2: Configure service**

- Root directory: `apps/api`
- Start command: `npm start`
- Node version: 20

- [ ] **Step 3: Add all API environment variables**

In Railway service → Variables, add all vars from the API `.env` section:
```
DEEPGRAM_API_KEY
DEEPL_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CLERK_SECRET_KEY
FRONTEND_URL   ← set to Vercel URL after Task 13
```

- [ ] **Step 4: Note Railway URL**

After deploy, copy the Railway-provided domain (e.g. `https://live-translation-api.up.railway.app`).

---

## Task 13: Deploy Frontend to Vercel

- [ ] **Step 1: Go to Vercel**

`https://vercel.com` → New Project → Import from GitHub

- [ ] **Step 2: Configure project**

- Root directory: `apps/web`
- Build command: `npm run build`
- Node version: 20

- [ ] **Step 3: Add all Frontend environment variables**

In Vercel project → Settings → Environment Variables:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_URL   ← Railway URL from Task 12
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET  ← from Clerk after Task 10
```

- [ ] **Step 4: Deploy and note Vercel URL**

After deploy, copy the Vercel domain (e.g. `https://live-translation.vercel.app`).

---

## Task 14: Connect URLs and verify end-to-end

- [ ] **Step 1: Update FRONTEND_URL in Railway**

In Railway → Variables, set:
```
FRONTEND_URL=https://<your-vercel-domain>
```

Trigger redeploy.

- [ ] **Step 2: Register Clerk webhook (Task 10)**

Now that Vercel URL is known, complete Task 10 in Clerk Dashboard.

- [ ] **Step 3: Register Stripe webhook (Task 11)**

Now that Railway URL is known, complete Task 11 in Stripe Dashboard.

- [ ] **Step 4: End-to-end test**

1. Open `https://<your-vercel-domain>/auth/sign-up`
2. Create account → verify Supabase `users` table gets a new row
3. Navigate to `/dashboard/translate`
4. Select source and target language
5. Click mic button → grant microphone permission
6. Speak → verify interim transcript appears in real time
7. Pause → verify final transcript + translation appears
8. Click stop → verify mic indicator disappears in browser
9. Disconnect network briefly → verify "Verbindung unterbrochen" indicator → reconnect

- [ ] **Step 5: Final commit**

```bash
cd /Users/mehmet/live-translation
git add .
git commit -m "chore: production deployment complete"
```
