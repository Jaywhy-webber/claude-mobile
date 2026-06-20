import type { ScrollbackBuffer } from "./scrollback-buffer.js";

export interface PtyLike {
  onData(cb: (data: string) => void): void;
  onExit(cb: (e: { exitCode: number }) => void): void;
  write(data: string): void;
  resize(cols: number, rows: number): void;
}

export interface WsLike {
  on(event: string, cb: (...args: any[]) => void): void;
  send(data: Buffer | string): void;
  close(): void;
  readonly readyState: number;
}

export interface AgentConfig {
  relayUrl: string;
  token: string;
  pty: PtyLike;
  scrollback: ScrollbackBuffer;
  createWs: (url: string) => WsLike;
  onExit?: () => void;
}

const WS_OPEN = 1;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30_000;

export function createAgent(config: AgentConfig): void {
  const { relayUrl, token, pty, scrollback, createWs, onExit } = config;

  let ws: WsLike;
  let reconnectDelay = INITIAL_RECONNECT_DELAY;
  let needsFlush = true;

  function connect(): void {
    ws = createWs(relayUrl);

    ws.on("open", () => {
      reconnectDelay = INITIAL_RECONNECT_DELAY;
      needsFlush = true;
      ws.send(JSON.stringify({ token, role: "desktop" }));
    });

    ws.on("message", (data: Buffer, isBinary: boolean) => {
      if (needsFlush) {
        needsFlush = false;
        const replay = scrollback.replay();
        if (replay.length > 0) {
          ws.send(replay);
        }
      }

      if (isBinary) {
        pty.write(data.toString());
      } else {
        try {
          const msg = JSON.parse(data.toString()) as Record<string, unknown>;
          if (
            msg.type === "resize" &&
            typeof msg.cols === "number" &&
            typeof msg.rows === "number"
          ) {
            pty.resize(msg.cols as number, msg.rows as number);
          }
        } catch {
          // ignore invalid JSON
        }
      }
    });

    ws.on("close", () => {
      const delay = reconnectDelay;
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
      setTimeout(connect, delay);
    });

    ws.on("error", () => {
      // error is always followed by close
    });
  }

  pty.onData((data: string) => {
    const buf = Buffer.from(data);
    scrollback.append(buf);
    if (ws && ws.readyState === WS_OPEN) {
      ws.send(buf);
    }
  });

  pty.onExit(() => {
    ws?.close();
    onExit?.();
  });

  connect();
}
