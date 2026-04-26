import { reportUsage } from '../billing/usage';

// ─────────────────────────────────────────────────────
// UsageTracker — zählt Nutzung während einer Session
// Generalisiert: tick() einmal pro Einheit aufrufen
// ─────────────────────────────────────────────────────
export class UsageTracker {
  private userId:   string;
  private sessionId: string;
  private count:    number = 0;
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(userId: string, sessionId: string) {
    this.userId    = userId;
    this.sessionId = sessionId;
  }

  // Für time-based billing (z.B. jede Minute)
  startTimer(intervalMs = 60_000) {
    this.interval = setInterval(() => this.tick(), intervalMs);
  }

  // Für event-based billing (z.B. pro API Call)
  tick(units = 1) {
    this.count += units;
  }

  async flush(metadata?: Record<string, string>) {
    if (this.count === 0) return;
    await reportUsage(this.userId, this.count, {
      session_id: this.sessionId,
      ...metadata,
    });
    this.count = 0;
  }

  async stop() {
    if (this.interval) clearInterval(this.interval);
    await this.flush();
  }
}
