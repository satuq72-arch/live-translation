// packages/core/ws-gateway/server.ts
// ✅ Wiederverwendbar — app-agnostisch

import type { WebSocket } from 'ws';

export interface Session {
  userId:    string;
  sessionId: string;
  socket:    WebSocket;
  meta:      Record<string, string>;
  startedAt: Date;
}

// ─────────────────────────────────────────────
// WSSessionManager — eine Session pro User
// ─────────────────────────────────────────────
export class WSSessionManager {
  private sessions = new Map<string, Session>();

  add(userId: string, sessionId: string, socket: WebSocket, meta: Record<string, string> = {}) {
    this.sessions.set(userId, { userId, sessionId, socket, meta, startedAt: new Date() });
  }

  get(userId: string): Session | undefined {
    return this.sessions.get(userId);
  }

  remove(userId: string) {
    this.sessions.delete(userId);
  }

  send(userId: string, data: object) {
    const session = this.sessions.get(userId);
    if (session?.socket.readyState === 1) {
      session.socket.send(JSON.stringify(data));
    }
  }

  count(): number {
    return this.sessions.size;
  }
}

export const sessionManager = new WSSessionManager();
