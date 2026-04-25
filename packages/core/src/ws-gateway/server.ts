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
