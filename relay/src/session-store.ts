import { createHash } from "node:crypto";
import type { WebSocket } from "ws";

export interface Session {
  tokenHash: string;
  desktop: WebSocket | null;
  mobile: WebSocket | null;
}

type Role = "desktop" | "mobile";

type HandshakeResult =
  | { ok: true }
  | { ok: false; code: number; reason: string };

export class SessionStore {
  private sessions = new Map<string, Session>();

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  handleHandshake(
    ws: WebSocket,
    token: string,
    role: Role,
  ): HandshakeResult {
    const tokenHash = this.hashToken(token);
    let session = this.sessions.get(tokenHash);

    if (!session) {
      session = { tokenHash, desktop: null, mobile: null };
      this.sessions.set(tokenHash, session);
    }

    if (session[role] !== null) {
      return { ok: false, code: 4001, reason: `Role "${role}" already occupied` };
    }

    session[role] = ws;
    return { ok: true };
  }

  routeMessage(token: string, fromRole: Role, data: Buffer | ArrayBuffer | Buffer[]): void {
    const tokenHash = this.hashToken(token);
    const session = this.sessions.get(tokenHash);
    if (!session) return;

    const peerRole: Role = fromRole === "desktop" ? "mobile" : "desktop";
    const peer = session[peerRole];

    if (peer && peer.readyState === 1) {
      peer.send(data);
    }
  }

  handleDisconnect(token: string, role: Role): void {
    const tokenHash = this.hashToken(token);
    const session = this.sessions.get(tokenHash);
    if (!session) return;

    session[role] = null;

    if (session.desktop === null && session.mobile === null) {
      this.sessions.delete(tokenHash);
    }
  }

  getSession(token: string): Session | undefined {
    const tokenHash = this.hashToken(token);
    return this.sessions.get(tokenHash);
  }
}
