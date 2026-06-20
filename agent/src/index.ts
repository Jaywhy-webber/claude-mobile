import { randomBytes } from "node:crypto";
import * as pty from "node-pty";
import WebSocket from "ws";
import qrcode from "qrcode-terminal";
import { ScrollbackBuffer } from "./scrollback-buffer.js";
import { createAgent } from "./create-agent.js";

function parseCommand(argv: string[]): { command: string; args: string[] } {
  const ddIndex = argv.indexOf("--");
  if (ddIndex === -1) return { command: "claude", args: [] };
  const rest = argv.slice(ddIndex + 1);
  return { command: rest[0] ?? "claude", args: rest.slice(1) };
}

const relayUrl = process.env.CLAUDE_MOBILE_RELAY;
if (!relayUrl) {
  console.error("Error: CLAUDE_MOBILE_RELAY environment variable is required");
  process.exit(1);
}

const { command, args } = parseCommand(process.argv);
const token = randomBytes(16).toString("hex");
const qrPayload = JSON.stringify({ relay: relayUrl, token });

console.log(`Starting ${command} via PTY (220×50)`);
console.log("Scan this QR code with Claude Mobile:\n");
qrcode.generate(qrPayload, { small: true });
console.log();

const ptyProcess = pty.spawn(command, args, {
  name: "xterm-256color",
  cols: 220,
  rows: 50,
  cwd: process.cwd(),
  env: process.env as Record<string, string>,
});

const scrollback = new ScrollbackBuffer();

ptyProcess.onData((data) => {
  process.stdout.write(data);
});

createAgent({
  relayUrl,
  token,
  pty: ptyProcess,
  scrollback,
  createWs: (url) => new WebSocket(url),
  onExit: () => process.exit(0),
});
