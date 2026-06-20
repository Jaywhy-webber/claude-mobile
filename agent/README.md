# Claude Mobile — Desktop Agent

Desktop agent that wraps a command (default: `claude`) in a PTY and bridges it
to the Claude Mobile relay via WebSocket.

## Prerequisites

`node-pty` has native bindings. After cloning, install and rebuild:

```bash
cd agent
npm install
```

If the native build fails, make sure you have a C++ toolchain installed:

- **macOS**: `xcode-select --install`
- **Ubuntu/Debian**: `sudo apt install build-essential python3`
- **Windows**: install the "Desktop development with C++" workload from Visual Studio

## Configuration

Set the relay URL via the `CLAUDE_MOBILE_RELAY` environment variable:

```bash
export CLAUDE_MOBILE_RELAY=wss://your-relay.railway.app
```

## Usage

Start with the default `claude` command:

```bash
node agent/dist/index.js
```

Or specify a custom command after `--`:

```bash
node agent/dist/index.js -- bash
node agent/dist/index.js -- zsh
```

For development (using `tsx`):

```bash
CLAUDE_MOBILE_RELAY=wss://your-relay.railway.app npm run dev
```

On startup the agent:

1. Generates a fresh cryptographic token
2. Prints a QR code encoding `{ "relay": "<URL>", "token": "<token>" }`
3. Spawns the command in a PTY (220×50 default dimensions)
4. Connects to the relay as a desktop client

Scan the QR code with the Claude Mobile app to connect.
