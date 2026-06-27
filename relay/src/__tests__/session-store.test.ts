import { describe, it, expect, beforeEach, vi } from "vitest";
import { SessionStore } from "../session-store.js";

function mockSocket() {
  return {
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1, // WebSocket.OPEN
  };
}

describe("SessionStore", () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore();
  });

  describe("handleHandshake", () => {
    it("accepts a desktop client with a valid token", () => {
      const ws = mockSocket();
      const result = store.handleHandshake(ws as any, "token-abc", "desktop");
      expect(result.ok).toBe(true);
    });

    it("accepts a mobile client with a valid token", () => {
      const ws = mockSocket();
      const result = store.handleHandshake(ws as any, "token-abc", "mobile");
      expect(result.ok).toBe(true);
    });

    it("pairs desktop and mobile in the same session", () => {
      const desktop = mockSocket();
      const mobile = mockSocket();
      store.handleHandshake(desktop as any, "token-abc", "desktop");
      store.handleHandshake(mobile as any, "token-abc", "mobile");

      const session = store.getSession("token-abc");
      expect(session).toBeDefined();
      expect(session!.desktop).toBe(desktop);
      expect(session!.mobile).toBe(mobile);
    });

    it("rejects a second desktop with close code 4001", () => {
      const desktop1 = mockSocket();
      const desktop2 = mockSocket();
      store.handleHandshake(desktop1 as any, "token-abc", "desktop");
      const result = store.handleHandshake(
        desktop2 as any,
        "token-abc",
        "desktop",
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe(4001);
    });

    it("rejects a second mobile with close code 4001", () => {
      const mobile1 = mockSocket();
      const mobile2 = mockSocket();
      store.handleHandshake(mobile1 as any, "token-abc", "mobile");
      const result = store.handleHandshake(
        mobile2 as any,
        "token-abc",
        "mobile",
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe(4001);
    });
  });

  describe("pending mobile", () => {
    it("holds mobile in pending state when no desktop is connected", () => {
      const mobile = mockSocket();
      store.handleHandshake(mobile as any, "token-abc", "mobile");

      const session = store.getSession("token-abc");
      expect(session).toBeDefined();
      expect(session!.mobile).toBe(mobile);
      expect(session!.desktop).toBeNull();
    });

    it("pairs mobile automatically when desktop connects later", () => {
      const mobile = mockSocket();
      const desktop = mockSocket();
      store.handleHandshake(mobile as any, "token-abc", "mobile");
      store.handleHandshake(desktop as any, "token-abc", "desktop");

      const session = store.getSession("token-abc");
      expect(session!.desktop).toBe(desktop);
      expect(session!.mobile).toBe(mobile);
    });
  });

  describe("byte routing", () => {
    it("routes messages from desktop to mobile", () => {
      const desktop = mockSocket();
      const mobile = mockSocket();
      store.handleHandshake(desktop as any, "token-abc", "desktop");
      store.handleHandshake(mobile as any, "token-abc", "mobile");

      const data = Buffer.from("hello from desktop");
      store.routeMessage("token-abc", "desktop", data);
      expect(mobile.send).toHaveBeenCalledWith(data);
    });

    it("routes messages from mobile to desktop", () => {
      const desktop = mockSocket();
      const mobile = mockSocket();
      store.handleHandshake(desktop as any, "token-abc", "desktop");
      store.handleHandshake(mobile as any, "token-abc", "mobile");

      const data = Buffer.from("hello from mobile");
      store.routeMessage("token-abc", "mobile", data);
      expect(desktop.send).toHaveBeenCalledWith(data);
    });

    it("drops messages when the peer is not connected", () => {
      const desktop = mockSocket();
      store.handleHandshake(desktop as any, "token-abc", "desktop");

      const data = Buffer.from("no peer");
      store.routeMessage("token-abc", "desktop", data);
      // No error, message is silently dropped
    });

    it("drops messages when peer socket is not open", () => {
      const desktop = mockSocket();
      const mobile = mockSocket();
      mobile.readyState = 3; // WebSocket.CLOSED
      store.handleHandshake(desktop as any, "token-abc", "desktop");
      store.handleHandshake(mobile as any, "token-abc", "mobile");

      const data = Buffer.from("peer closed");
      store.routeMessage("token-abc", "desktop", data);
      expect(mobile.send).not.toHaveBeenCalled();
    });
  });

  describe("disconnect", () => {
    it("clears the desktop slot on disconnect", () => {
      const desktop = mockSocket();
      const mobile = mockSocket();
      store.handleHandshake(desktop as any, "token-abc", "desktop");
      store.handleHandshake(mobile as any, "token-abc", "mobile");
      store.handleDisconnect("token-abc", "desktop");

      const session = store.getSession("token-abc");
      expect(session).toBeDefined();
      expect(session!.desktop).toBeNull();
      expect(session!.mobile).toBe(mobile);
    });

    it("clears the mobile slot on disconnect", () => {
      const desktop = mockSocket();
      const mobile = mockSocket();
      store.handleHandshake(desktop as any, "token-abc", "desktop");
      store.handleHandshake(mobile as any, "token-abc", "mobile");
      store.handleDisconnect("token-abc", "mobile");

      const session = store.getSession("token-abc");
      expect(session).toBeDefined();
      expect(session!.mobile).toBeNull();
      expect(session!.desktop).toBe(desktop);
    });

    it("removes the session when both sides disconnect", () => {
      const desktop = mockSocket();
      const mobile = mockSocket();
      store.handleHandshake(desktop as any, "token-abc", "desktop");
      store.handleHandshake(mobile as any, "token-abc", "mobile");
      store.handleDisconnect("token-abc", "desktop");
      store.handleDisconnect("token-abc", "mobile");

      const session = store.getSession("token-abc");
      expect(session).toBeUndefined();
    });

    it("allows a new client to reconnect after the previous one disconnects", () => {
      const desktop1 = mockSocket();
      const mobile = mockSocket();
      store.handleHandshake(desktop1 as any, "token-abc", "desktop");
      store.handleHandshake(mobile as any, "token-abc", "mobile");
      store.handleDisconnect("token-abc", "desktop");

      const desktop2 = mockSocket();
      const result = store.handleHandshake(
        desktop2 as any,
        "token-abc",
        "desktop",
      );
      expect(result.ok).toBe(true);

      const data = Buffer.from("from new desktop");
      store.routeMessage("token-abc", "desktop", data);
      expect(mobile.send).toHaveBeenCalledWith(data);
    });
  });
});
