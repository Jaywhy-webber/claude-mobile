import { createServer } from "node:http";
import { createRelayServer } from "./server.js";

const PORT = parseInt(process.env.PORT || "8080", 10);

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("claude-mobile-relay");
});

const relay = createRelayServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Relay server listening on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  await relay.close();
  httpServer.close();
});
