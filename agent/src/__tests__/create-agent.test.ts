import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "node:events";
import { ScrollbackBuffer } from "../scrollback-buffer.js";
import { createAgent, type PtyLike, type WsLike } from "../create-agent.js";

class MockPty extends EventEmitter implements PtyLike {
  write = vi.fn();
  resize = vi.fn();

  onData(cb: (data: string) => void): void {
    this.on("data", cb);
  }

  onExit(cb: (e: { exitCode: number }) => void): void {
    this.on("exit", cb);
  }

  emitData(data: string): void {
    this.emit("data", data);
  }

  emitExit(exitCode = 0): void {
    this.emit("exit", { exitCode });
  }
}

class MockWs extends EventEmitter implements WsLike {
  send = vi.fn();
  close = vi.fn();
  readyState = 1;

  emitOpen(): void {
    this.emit("open");
  }

  emitMessage(data: Buffer, isBinary: boolean): void {
    this.emit("message", data, isBinary);
  }

  emitClose(): void {
    this.readyState = 3;
    this.emit("close");
  }

  emitError(err: Error): void {
    this.emit("error", err);
  }
}

describe("createAgent", () => {
  let pty: MockPty;
  let ws: MockWs;
  let scrollback: ScrollbackBuffer;
  let createWs: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    pty = new MockPty();
    ws = new MockWs();
    scrollback = new ScrollbackBuffer();
    createWs = vi.fn(() => ws);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function startAgent() {
    return createAgent({
      relayUrl: "wss://relay.example.com",
      token: "abc123",
      pty,
      scrollback,
      createWs,
    });
  }

  it("connects to the relay URL", () => {
    startAgent();
    expect(createWs).toHaveBeenCalledWith("wss://relay.example.com");
  });

  it("sends desktop handshake on WS open", () => {
    startAgent();
    ws.emitOpen();

    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({ token: "abc123", role: "desktop" }),
    );
  });

  it("forwards PTY output to WS as binary frames", () => {
    startAgent();
    ws.emitOpen();
    ws.send.mockClear();

    pty.emitData("hello world");

    expect(ws.send).toHaveBeenCalledTimes(1);
    const sentData = ws.send.mock.calls[0][0] as Buffer;
    expect(Buffer.isBuffer(sentData)).toBe(true);
    expect(sentData.toString()).toBe("hello world");
  });

  it("does not send PTY output when WS is not open", () => {
    startAgent();
    ws.readyState = 0; // CONNECTING

    pty.emitData("hello");

    expect(ws.send).not.toHaveBeenCalled();
  });

  it("appends PTY output to scrollback buffer", () => {
    startAgent();
    pty.emitData("buffered data");

    const replay = scrollback.replay();
    expect(replay.toString()).toBe("buffered data");
  });

  it("forwards WS binary frames to PTY as input", () => {
    startAgent();
    ws.emitOpen();

    const input = Buffer.from("user input");
    ws.emitMessage(input, true);

    expect(pty.write).toHaveBeenCalledWith(input.toString());
  });

  it("handles resize messages by calling pty.resize()", () => {
    startAgent();
    ws.emitOpen();

    const resizeMsg = JSON.stringify({ type: "resize", cols: 80, rows: 24 });
    ws.emitMessage(Buffer.from(resizeMsg), false);

    expect(pty.resize).toHaveBeenCalledWith(80, 24);
  });

  it("ignores invalid text frames", () => {
    startAgent();
    ws.emitOpen();

    ws.emitMessage(Buffer.from("not json"), false);

    expect(pty.resize).not.toHaveBeenCalled();
    expect(pty.write).not.toHaveBeenCalled();
  });

  it("flushes scrollback on first message from relay", () => {
    startAgent();
    ws.emitOpen();

    scrollback.append(Buffer.from("previous output"));
    ws.send.mockClear();

    const resizeMsg = JSON.stringify({ type: "resize", cols: 80, rows: 24 });
    ws.emitMessage(Buffer.from(resizeMsg), false);

    expect(ws.send).toHaveBeenCalledTimes(1);
    const flushed = ws.send.mock.calls[0][0] as Buffer;
    expect(Buffer.isBuffer(flushed)).toBe(true);
    expect(flushed.toString()).toBe("previous output");
  });

  it("does not flush scrollback on subsequent messages", () => {
    startAgent();
    ws.emitOpen();
    ws.send.mockClear();

    ws.emitMessage(Buffer.from("first"), true);
    ws.send.mockClear();

    ws.emitMessage(Buffer.from("second"), true);

    const sendCalls = ws.send.mock.calls;
    const binaryFlushes = sendCalls.filter(
      (call) => Buffer.isBuffer(call[0]) && call[0].length > 0,
    );
    expect(binaryFlushes).toHaveLength(0);
  });

  it("reconnects with exponential backoff on WS close", () => {
    startAgent();
    ws.emitOpen();

    const ws2 = new MockWs();
    createWs.mockReturnValueOnce(ws2);

    ws.emitClose();
    expect(createWs).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(createWs).toHaveBeenCalledTimes(2);

    const ws3 = new MockWs();
    createWs.mockReturnValueOnce(ws3);

    ws2.emitClose();
    vi.advanceTimersByTime(1999);
    expect(createWs).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(createWs).toHaveBeenCalledTimes(3);
  });

  it("caps reconnect delay at 30 seconds", () => {
    startAgent();
    ws.emitOpen();

    for (let i = 0; i < 10; i++) {
      const nextWs = new MockWs();
      createWs.mockReturnValueOnce(nextWs);
      ws.emitClose();
      vi.advanceTimersByTime(30000);
      ws = nextWs;
    }

    const nextWs = new MockWs();
    createWs.mockReturnValueOnce(nextWs);
    ws.emitClose();

    vi.advanceTimersByTime(29999);
    const callsBefore = createWs.mock.calls.length;
    vi.advanceTimersByTime(1);
    expect(createWs.mock.calls.length).toBe(callsBefore + 1);
  });

  it("resets backoff on successful connection", () => {
    startAgent();
    ws.emitOpen();

    const ws2 = new MockWs();
    createWs.mockReturnValueOnce(ws2);
    ws.emitClose();
    vi.advanceTimersByTime(1000);

    ws2.emitOpen();

    const ws3 = new MockWs();
    createWs.mockReturnValueOnce(ws3);
    ws2.emitClose();

    vi.advanceTimersByTime(1000);
    expect(createWs).toHaveBeenCalledTimes(3);
  });

  it("does not kill PTY on WS close", () => {
    startAgent();
    ws.emitOpen();
    ws.emitClose();

    expect(pty.write).not.toHaveBeenCalledWith(expect.stringContaining("exit"));
  });

  it("re-flushes scrollback after reconnection", () => {
    startAgent();
    ws.emitOpen();

    scrollback.append(Buffer.from("old data"));

    const resizeMsg = Buffer.from(
      JSON.stringify({ type: "resize", cols: 80, rows: 24 }),
    );
    ws.emitMessage(resizeMsg, false);
    ws.send.mockClear();

    const ws2 = new MockWs();
    createWs.mockReturnValueOnce(ws2);
    ws.emitClose();
    vi.advanceTimersByTime(1000);

    ws2.emitOpen();

    scrollback.append(Buffer.from(" new data"));
    ws2.send.mockClear();

    ws2.emitMessage(resizeMsg, false);

    expect(ws2.send).toHaveBeenCalledTimes(1);
    const flushed = ws2.send.mock.calls[0][0] as Buffer;
    expect(flushed.toString()).toBe("old data new data");
  });
});
