# colors

Generate beautiful, professional color palettes as CSS variables — instantly.

✨ One command → clean palette → copy as CSS  
🤖 Also works with AI tools via MCP (Model Context Protocol)

Perfect for developers, designers, and Copilot.

`colors` is a VS Code extension that provides both a human-facing UI and an MCP-style JSON-RPC tool for AI clients to generate professional color palettes.

# colors

Generate beautiful, professional color palettes as CSS variables — instantly.

✨ One command → clean palette → copy as CSS  
🤖 Also works with AI tools via MCP (Model Context Protocol)

Perfect for developers, designers, and Copilot.

`colors` is a VS Code extension that provides both a human-facing UI and an MCP-style JSON-RPC tool for AI clients to generate professional color palettes.

## MCP tool: `generatePalette`

- Method: `generatePalette`
- Params (optional):
  - `seed` (string) — hex color used to bias the palette (e.g. `#3B82F6`).
  - `theme` (string) — named theme such as `default`, `ecommerce`, `calm`. Defaults to `default`.
  - `dark` (boolean) — if true, the palette is tailored for dark backgrounds. Defaults to `false`.
  - `shades` (number) — number of tonal steps per token (default 9).
  - `includeAccessibility` (boolean) — include contrast/WCAG metadata for each shade.

Response (success): JSON-RPC 2.0 response with `result` containing a `palette` object and a `content` array (text blocks). Example:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "palette": {
      /* structured tokens */
    },
    "content": [
      { "type": "text", "text": ":root { --primary-400: #3466F2; ... }" }
    ]
  }
}
```

Framing: the server accepts Content-Length framed JSON-RPC messages on stdin and replies on stdout (same framing as LSP), e.g.:

```
Content-Length: 72\r\n\r\n{"jsonrpc":"2.0","id":1,"method":"generatePalette","params":{"theme":"ecommerce"}}
```

## Build & Run

Build the MCP server:

```powershell
npm run build:mcp
```

Run the server manually:

```powershell
node dist/mcp/server.js
```

Helper npm scripts:

```powershell
# build the MCP server
npm run build:mcp

# start the compiled server
npm run start:mcp

# run the automated test helper (spawns server and sends requests)
npm run test:mcp
```

## Example params

```json
{
  "seed": "#3B82F6",
  "theme": "ecommerce",
  "shades": 10,
  "includeAccessibility": true
}
```

- `seed`: hex string or array of hex seeds for primary/secondary/accent.
- `shades`: tonal steps per token.
- `includeAccessibility`: attach contrast/WCAG numbers.

Using these params the server returns `result.palette` (array tokens per group) and `result.content` (CSS text block) that you can insert into your project's styles.

## Packaging note

When publishing, ensure `dist/mcp/server.js` is included in the VSIX. The repository includes a `build:mcp` script that compiles the server into `dist/mcp`.

## Contributing

Contributions, bug reports and feature requests are welcome. Please open issues or pull requests.

## License

MIT

Build the MCP server:

```powershell
npm run build:mcp
```

Run the server manually:

```powershell
node dist/mcp/server.js
```

The server will print a ready message and wait for JSON-RPC requests.

Helper npm scripts:

```powershell
# build the MCP server
npm run build:mcp

# start the compiled server
npm run start:mcp

# run the automated test helper (spawns server and sends requests)
npm run test:mcp
```

## Example params

```
{ "seed": "#3B82F6", "theme": "ecommerce", "shades": 10, "includeAccessibility": true }
```

- `seed`: hex string or array of hex seeds for primary/secondary/accent.
- `shades`: tonal steps per token.
- `includeAccessibility`: attach contrast/WCAG numbers.

Using these params the server returns `result.palette` (array tokens per group) and `result.content` (CSS text block) that you can insert into your project's styles.

## Packaging note

When publishing, ensure `dist/mcp/server.js` is included in the VSIX. The repository includes a `build:mcp` script that compiles the server into `dist/mcp`.

## Contributing

Contributions, bug reports and feature requests are welcome. Please open issues or pull requests.

## License

MIT
