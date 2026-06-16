import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "node:http";
import type { Server } from "node:http";
import { SessionStore } from "./session-store.js";

export interface RelayServer {
  wss: WebSocketServer;
  store: SessionStore;
  close(): Promise<void>;
}

interface HandshakeMessage {
  token: string;
  role: "desktop" | "mobile";
}

function isValidHandshake(data: unknown): data is HandshakeMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    typeof msg.token === "string" &&
    msg.token.length > 0 &&
    (msg.role === "desktop" || msg.role === "mobile")
  );
}

export function createRelayServer(server?: Server): RelayServer {
  const store = new SessionStore();
  const wss = new WebSocketServer(server ? { server } : { noServer: true });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    let authenticated = false;
    let token: string;
    let role: "desktop" | "mobile";

    const handshakeTimeout = setTimeout(() => {
      if (!authenticated) {
        ws.close(4001, "Handshake timeout");
      }
    }, 5000);

    ws.on("message", (data, isBinary) => {
      if (!authenticated) {
        clearTimeout(handshakeTimeout);

        let msg: unknown;
        try {
          msg = JSON.parse(data.toString());
        } catch {
          ws.close(4001, "Invalid handshake");
          return;
        }

        if (!isValidHandshake(msg)) {
          ws.close(4001, "Invalid handshake");
          return;
        }

        const result = store.handleHandshake(ws, msg.token, msg.role);
        if (!result.ok) {
          ws.close(result.code, result.reason);
          return;
        }

        token = msg.token;
        role = msg.role;
        authenticated = true;
        return;
      }

      store.routeMessage(token, role, data as Buffer);
    });

    ws.on("close", () => {
      clearTimeout(handshakeTimeout);
      if (authenticated) {
        store.handleDisconnect(token, role);
      }
    });
  });

  return {
    wss,
    store,
    close() {
      return new Promise<void>((resolve) => {
        wss.close(() => resolve());
      });
    },
  };
}
