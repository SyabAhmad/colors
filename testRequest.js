// Simple test helper for the MCP-like server (Content-Length framed JSON-RPC)
const { spawn } = require("child_process");
const path = require("path");

const server = spawn(
  process.execPath,
  [path.join("dist", "mcp", "server.js")],
  { stdio: ["pipe", "pipe", "pipe"] }
);

server.stdout.on("data", (d) => process.stdout.write(d.toString()));
server.stderr.on("data", (d) => process.stderr.write(d.toString()));

function sendRequest(obj) {
  const body = JSON.stringify(obj);
  const header =
    "Content-Length: " + Buffer.byteLength(body, "utf8") + "\r\n\r\n";
  server.stdin.write(header + body);
}

// Wait briefly for server to start
setTimeout(() => {
  // Example request: generate default palette
  sendRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "generatePalette",
    params: { theme: "default", dark: false },
  });

  // Example request: e-commerce dark theme
  setTimeout(() => {
    sendRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "generatePalette",
      params: { theme: "ecommerce", dark: true },
    });
  }, 200);

  // Close stdin after a short delay
  setTimeout(() => {
    server.stdin.end();
  }, 500);
}, 200);
