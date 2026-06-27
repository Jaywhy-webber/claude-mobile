import { describe, it, expect, beforeEach } from "vitest";
import { ScrollbackBuffer } from "../scrollback-buffer.js";

const MAX_SIZE = 50 * 1024; // 50KB

describe("ScrollbackBuffer", () => {
  let buffer: ScrollbackBuffer;

  beforeEach(() => {
    buffer = new ScrollbackBuffer();
  });

  describe("single append and replay", () => {
    it("returns appended bytes on replay", () => {
      const data = Buffer.from("hello");
      buffer.append(data);

      const result = buffer.replay();
      expect(Buffer.compare(result, data)).toBe(0);
    });
  });

  describe("multi-append accumulation", () => {
    it("accumulates multiple appends in order", () => {
      buffer.append(Buffer.from("one"));
      buffer.append(Buffer.from("two"));
      buffer.append(Buffer.from("three"));

      const result = buffer.replay();
      expect(result.toString()).toBe("onetwothree");
    });
  });

  describe("eviction at the 50KB boundary", () => {
    it("never exceeds 50KB", () => {
      const chunk = Buffer.alloc(10 * 1024, 0x41); // 10KB of 'A'
      for (let i = 0; i < 6; i++) {
        buffer.append(chunk);
      }

      const result = buffer.replay();
      expect(result.length).toBeLessThanOrEqual(MAX_SIZE);
    });

    it("evicts oldest bytes when capacity is exceeded", () => {
      const first = Buffer.alloc(MAX_SIZE, 0x41); // 50KB of 'A'
      buffer.append(first);

      const second = Buffer.alloc(1024, 0x42); // 1KB of 'B'
      buffer.append(second);

      const result = buffer.replay();
      expect(result.length).toBe(MAX_SIZE);
      // The tail should be the 'B' bytes
      expect(result[result.length - 1]).toBe(0x42);
      // The head should no longer start with the original 'A' bytes at index 0
      // because 1KB of 'A' was evicted
      expect(result.subarray(result.length - 1024).every((b) => b === 0x42)).toBe(true);
    });

    it("replays exactly the most recent 50KB when overfilled", () => {
      // Write 60KB: 50KB of 'A' then 10KB of 'B'
      buffer.append(Buffer.alloc(MAX_SIZE, 0x41));
      buffer.append(Buffer.alloc(10 * 1024, 0x42));

      const result = buffer.replay();
      expect(result.length).toBe(MAX_SIZE);
      // Last 10KB should be 'B'
      expect(result.subarray(MAX_SIZE - 10 * 1024).every((b) => b === 0x42)).toBe(true);
      // First 40KB should be 'A' (the remaining after eviction)
      expect(result.subarray(0, 40 * 1024).every((b) => b === 0x41)).toBe(true);
    });
  });

  describe("empty-buffer replay", () => {
    it("returns an empty buffer without error", () => {
      const result = buffer.replay();
      expect(result.length).toBe(0);
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });
});
