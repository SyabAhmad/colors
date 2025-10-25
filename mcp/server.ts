// Lightweight MCP-like JSON-RPC over stdio (minimal, no external deps)
// This implements basic Content-Length framing and supports a single
// method: `generatePalette` which returns CSS variables in a structured result.

const PALETTE = [
  { name: "primary", hex: "#3B82F6" },
  { name: "secondary", hex: "#6B7280" },
  { name: "accent", hex: "#EF4444" },
  { name: "success", hex: "#10B981" },
  { name: "warning", hex: "#F59E0B" },
  { name: "background", hex: "#F9FAFB" },
  { name: "text", hex: "#111827" },
];

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: number | string | null;
  method?: string;
  params?: any;
};

type GeneratePaletteParams = {
  theme?: string; // e.g., 'default' | 'ecommerce' | 'calm'
  dark?: boolean;
};

function buildCssPalette(palette: { name: string; hex: string }[]) {
  const cssVars = palette.map((c) => `--${c.name}: ${c.hex};`).join("\n  ");
  return `:root {\n  ${cssVars}\n}`;
}

function paletteForParams(params?: GeneratePaletteParams) {
  const theme = params?.theme ?? "default";
  const dark = params?.dark ?? false;

  // Base palettes for a couple of themes (MVP). These are small, deterministic.
  if (theme === "ecommerce") {
    const p = [
      { name: "primary", hex: dark ? "#2563EB" : "#1E40AF" },
      { name: "secondary", hex: dark ? "#9CA3AF" : "#6B7280" },
      { name: "accent", hex: dark ? "#F97316" : "#FB923C" },
      { name: "success", hex: dark ? "#059669" : "#10B981" },
      { name: "warning", hex: dark ? "#D97706" : "#F59E0B" },
      { name: "background", hex: dark ? "#0B1220" : "#FFFFFF" },
      { name: "text", hex: dark ? "#E6EEF8" : "#0F172A" },
    ];
    return p;
  }

  if (theme === "calm") {
    const p = [
      { name: "primary", hex: dark ? "#60A5FA" : "#3B82F6" },
      { name: "secondary", hex: dark ? "#93C5FD" : "#60A5FA" },
      { name: "accent", hex: dark ? "#A7F3D0" : "#34D399" },
      { name: "success", hex: dark ? "#34D399" : "#10B981" },
      { name: "warning", hex: dark ? "#FDE68A" : "#FBBF24" },
      { name: "background", hex: dark ? "#071326" : "#F8FAFC" },
      { name: "text", hex: dark ? "#E6EEF8" : "#0F172A" },
    ];
    return p;
  }

  // default
  if (!dark) {
    return PALETTE;
  }

  // default dark transformation (simple swap)
  return [
    { name: "primary", hex: "#1E3A8A" },
    { name: "secondary", hex: "#374151" },
    { name: "accent", hex: "#DC2626" },
    { name: "success", hex: "#059669" },
    { name: "warning", hex: "#B45309" },
    { name: "background", hex: "#0B1220" },
    { name: "text", hex: "#E6EEF8" },
  ];
}

function sendResponse(id: any, result: any) {
  const body = JSON.stringify({ jsonrpc: "2.0", id, result });
  const header = `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n`;
  process.stdout.write(header + body);
}

function sendError(id: any, code: number, message: string) {
  const body = JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } });
  const header = `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n`;
  process.stdout.write(header + body);
}

// Simple Content-Length framed reader
let stdinBuffer = Buffer.alloc(0);
process.stdin.on("data", (chunk: Buffer) => {
  stdinBuffer = Buffer.concat([stdinBuffer, chunk]);

  while (true) {
    const headerEnd = stdinBuffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      break;
    }

    const header = stdinBuffer.slice(0, headerEnd).toString("utf8");
    const match = header.match(/Content-Length: (\d+)/i);
    if (!match) {
      // Malformed; drop buffer
      stdinBuffer = Buffer.alloc(0);
      break;
    }

    const length = parseInt(match[1], 10);
    const totalLen = headerEnd + 4 + length;
    if (stdinBuffer.length < totalLen) {
      break;
    } // wait for full body

    const bodyBuf = stdinBuffer.slice(headerEnd + 4, totalLen);
    const bodyStr = bodyBuf.toString("utf8");

    try {
      const req: JsonRpcRequest = JSON.parse(bodyStr);
      handleRequest(req);
    } catch (err) {
      console.error("Failed to parse JSON-RPC body", err);
    }

    stdinBuffer = stdinBuffer.slice(totalLen);
  }
});

process.stdin.on("end", () => {
  // clean exit
  process.exit(0);
});

function handleRequest(req: JsonRpcRequest) {
  if (!req.method) {
    // ignore notifications without method
    return;
  }

  if (req.method === "generatePalette") {
    try {
      const params = req.params as any;
      const generated = generatePalette(params);
      const result = {
        content: [{ type: "text", text: generated.formats.cssVars }],
        palette: generated,
      };
      sendResponse(req.id ?? null, result);
    } catch (err: any) {
      console.error("generatePalette failed", err);
      sendError(req.id ?? null, -32000, String(err?.message ?? err));
    }
    return;
  }

  // Method not found
  sendError(req.id ?? null, -32601, `Method not found: ${req.method}`);
}

import { generatePalette } from "./palette";

// Log that server is ready (parent process can capture stdout)
console.log("MCP-like server (colors) ready");
