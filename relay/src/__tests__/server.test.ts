import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServer } from "node:http";
import { WebSocket } from "ws";
import { createRelayServer, type RelayServer } from "../server.js";

let httpServer: ReturnType<typeof createServer>;
let relay: RelayServer;
let port: number;

function connect(): WebSocket {
  return new WebSocket(`ws://127.0.0.1:${port}`);
}

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });
}

function waitForClose(ws: WebSocket): Promise<{ code: number; reason: string }> {
  return new Promise((resolve) => {
    ws.on("close", (code, reason) => {
      resolve({ code, reason: reason.toString() });
    });
  });
}

function waitForMessage(ws: WebSocket): Promise<Buffer> {
  return new Promise((resolve) => {
    ws.once("message", (data) => {
      resolve(Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer));
    });
  });
}

function handshake(ws: WebSocket, token: string, role: string): void {
  ws.send(JSON.stringify({ token, role }));
}

beforeEach(async () => {
  httpServer = createServer();
  relay = createRelayServer(httpServer);
  await new Promise<void>((resolve) => {
    httpServer.listen(0, "127.0.0.1", () => {
      const addr = httpServer.address();
      port = typeof addr === "object" && addr !== null ? addr.port : 0;
      resolve();
    });
  });
});

afterEach(async () => {
  await relay.close();
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
});

describe("Relay server", () => {
  it("accepts a valid desktop handshake", async () => {
    const ws = connect();
    await waitForOpen(ws);
    handshake(ws, "test-token", "desktop");

    // If we weren't rejected, we're accepted. Send another message to confirm
    // the connection is alive.
    await new Promise((r) => setTimeout(r, 50));
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it("rejects an invalid handshake message", async () => {
    const ws = connect();
    await waitForOpen(ws);
    const closePromise = waitForClose(ws);
    ws.send("not json");
    const { code } = await closePromise;
    expect(code).toBe(4001);
  });

  it("rejects a handshake with missing fields", async () => {
    const ws = connect();
    await waitForOpen(ws);
    const closePromise = waitForClose(ws);
    ws.send(JSON.stringify({ token: "abc" }));
    const { code } = await closePromise;
    expect(code).toBe(4001);
  });

  it("rejects a duplicate role with close code 4001", async () => {
    const ws1 = connect();
    await waitForOpen(ws1);
    handshake(ws1, "test-token", "desktop");

    const ws2 = connect();
    await waitForOpen(ws2);
    const closePromise = waitForClose(ws2);
    handshake(ws2, "test-token", "desktop");
    const { code } = await closePromise;
    expect(code).toBe(4001);

    ws1.close();
  });

  it("routes binary frames from desktop to mobile", async () => {
    const desktop = connect();
    const mobile = connect();
    await Promise.all([waitForOpen(desktop), waitForOpen(mobile)]);

    handshake(desktop, "test-token", "desktop");
    handshake(mobile, "test-token", "mobile");

    await new Promise((r) => setTimeout(r, 50));

    const msgPromise = waitForMessage(mobile);
    const payload = Buffer.from("hello mobile");
    desktop.send(payload);
    const received = await msgPromise;
    expect(received.toString()).toBe("hello mobile");

    desktop.close();
    mobile.close();
  });

  it("routes binary frames from mobile to desktop", async () => {
    const desktop = connect();
    const mobile = connect();
    await Promise.all([waitForOpen(desktop), waitForOpen(mobile)]);

    handshake(desktop, "test-token", "desktop");
    handshake(mobile, "test-token", "mobile");

    await new Promise((r) => setTimeout(r, 50));

    const msgPromise = waitForMessage(desktop);
    const payload = Buffer.from("hello desktop");
    mobile.send(payload);
    const received = await msgPromise;
    expect(received.toString()).toBe("hello desktop");

    desktop.close();
    mobile.close();
  });

  it("holds mobile in pending state and pairs when desktop connects", async () => {
    const mobile = connect();
    await waitForOpen(mobile);
    handshake(mobile, "test-token", "mobile");

    await new Promise((r) => setTimeout(r, 50));
    expect(mobile.readyState).toBe(WebSocket.OPEN);

    const desktop = connect();
    await waitForOpen(desktop);
    handshake(desktop, "test-token", "desktop");

    await new Promise((r) => setTimeout(r, 50));

    const msgPromise = waitForMessage(mobile);
    desktop.send(Buffer.from("paired"));
    const received = await msgPromise;
    expect(received.toString()).toBe("paired");

    desktop.close();
    mobile.close();
  });

  it("closes connection after handshake timeout", async () => {
    const ws = connect();
    await waitForOpen(ws);
    const closePromise = waitForClose(ws);
    const { code } = await closePromise;
    expect(code).toBe(4001);
  }, 10000);
});
