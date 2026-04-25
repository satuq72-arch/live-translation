# Live Translation — Complete Design Spec
Date: 2026-04-25

## Goal
Make the existing live-translation monorepo a fully deployed, production-ready webapp with: Auth (Clerk), Billing (Stripe metered), Database (Supabase), live audio transcription (Deepgram) and translation (DeepL).

## Scope
- Fix all known bugs in the existing codebase
- Add WebSocket reconnect logic and structured error handling
- Configure all external services
- Deploy: Frontend → Vercel, API → Railway

---

## 1. Bug Fixes

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `apps/api/src/routes/ws.ts` | `checkFreeTier` result never enforced | Close socket with code 4029 `BILLING_LIMIT` if `remaining <= 0` |
| 2 | `apps/web/src/features/translation/hooks/useTranslation.ts` | MediaStream tracks never stopped — mic indicator stays active | Store stream in `streamRef`, call `.getTracks().forEach(t => t.stop())` in `stop()` |
| 3 | `packages/core/src/ws-gateway/server.ts` | `remove(userId)` deletes all user sessions | Add `remove(userId, sessionId)` overload; key map by `sessionId` instead of `userId` |
| 4 | `apps/web/src/features/translation/hooks/useTranslation.ts` | `ws.onMessage()` stacks handlers on every `start()` call | Register handler once in `useEffect`; remove on cleanup |
| 5 | `apps/web/src/features/translation/hooks/useTranslation.ts` | `url.replace('http', 'ws')` breaks on hostnames containing "http" | Use `new URL(apiUrl); url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'` |
| 6 | `apps/api/src/routes/ws.ts` | Backend ignores frontend `sessionId`, generates its own | Use `event.sessionId` from the `start` JSON message |
| 7 | `apps/api/src/routes/ws.ts` | No try/catch around `handleAudio.start()` | Wrap in try/catch, send `WSErrorEvent` back to client on failure |
| 8 | `apps/api/src/services/deepgram.ts` | `connections` Map leaks on unexpected disconnect | Listen to Deepgram `close` event, delete from map |
| 9 | `apps/api/src/routes/ws.ts` | `(req as any).auth?.userId` bypasses types | Use Clerk's `getAuth(req)` with proper FastifyRequest typing |

---

## 2. Robustness

### WebSocket Auto-Reconnect (`packages/core/src/ws-gateway/client.ts`)
- On unexpected close (`code !== 1000`), retry up to 5 times
- Exponential backoff: 1s → 2s → 4s → 8s → 16s
- New status value: `'reconnecting'`
- If recording was active when disconnect happened, resume after reconnect: re-send `start` event and re-connect audio worklet
- Surface status to `useTranslation` hook → show `"Verbinde neu..."` indicator in UI

### Structured Error Handling
Three error categories returned as `WSErrorEvent`:

| Code | Meaning | UI Behaviour |
|------|---------|--------------|
| `DEEPGRAM_ERROR` | Transcription failure | Show inline warning, keep session alive |
| `BILLING_LIMIT` | Free tier exhausted | Full-screen message, close connection cleanly |
| `AUTH_ERROR` | Session expired | Redirect to `/auth/sign-in` |

Frontend `TranslationApp.tsx` switches on `error.code` to render the right message.

---

## 3. Infrastructure

### Supabase
- Run `supabase/schema.sql` once against the project to create all tables
- RLS policies already defined in schema — no changes needed
- Clerk Webhook inserts new users into `users` table on `user.created` event (handler already exists at `apps/web/src/app/api/webhooks/clerk/route.ts`)

### Clerk
- Webhook endpoint: `https://<vercel-domain>/api/webhooks/clerk`
- Events: `user.created`
- `CLERK_WEBHOOK_SECRET` env var required

### Stripe
- Create product: "Live Translation" with metered price per minute
- Webhook endpoint: `https://<railway-domain>/stripe/webhook`
- Events: `customer.subscription.created`, `customer.subscription.deleted`, `invoice.payment_failed`
- `STRIPE_WEBHOOK_SECRET` env var required

### Environment Variables

**Frontend (Vercel):**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_URL   ← Railway URL
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
```

**API (Railway):**
```
DEEPGRAM_API_KEY
DEEPL_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CLERK_SECRET_KEY
FRONTEND_URL          ← Vercel URL (for CORS)
```

---

## 4. Deployment

### Frontend → Vercel
- Root directory: `apps/web`
- Build command: `npm run build`
- Node 20+

### API → Railway
- Root directory: `apps/api`
- Start command: `npm start`
- Port: `3001`
- Node 20+

### Deployment order
1. Deploy API to Railway → get Railway URL
2. Set `NEXT_PUBLIC_API_URL` in Vercel to Railway URL
3. Deploy Frontend to Vercel → get Vercel URL
4. Set `FRONTEND_URL` in Railway to Vercel URL
5. Register Clerk Webhook with Vercel URL
6. Register Stripe Webhook with Railway URL

---

## Out of Scope
- Multiple concurrent sessions per user (single session per user is sufficient for v1)
- Session history / transcript export
- Additional languages beyond the current 8
- Mobile app
