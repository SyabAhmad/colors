# colors

Generate beautiful, professional color palettes as CSS variables — instantly.

✨ One command → clean palette → copy as CSS  
🤖 Also works with AI tools via MCP (Model Context Protocol)

Perfect for developers, designers, and Copilot.

`colors` is a VS Code extension that provides both a human-facing UI and an MCP-style JSON-RPC tool for AI clients to generate professional color palettes.

# colors — usage guide

Quick start: generate a polished color palette and copy it as CSS variables.

This extension helps designers and developers create consistent, accessible color palettes and export them as CSS variables you can paste into your styles.

Install the extension, open the Command Palette (Ctrl+Shift+P), and run one of the commands:

- `Colors: Generate Colors` — quick prompt-based palette generator.
- `Colors: Generate Palette` — generate a palette with defaults (or use the UI).

What you get

- A semantic palette grouped into tokens: primary, secondary, accent, neutral, success, warning, danger.
- Each group contains a tonal scale (light → dark) as CSS variables (e.g. `--primary-100`, `--primary-400`, `--primary-700`).
- Optional accessibility metadata (contrast ratios) when requested.

Example output (ready-to-paste CSS)

```css
:root {
  --primary-50: #ffffff;
  --primary-100: #ccd9fc;
  --primary-200: #9ab3f9;
  --primary-300: #678cf5;
  --primary-400: #3466f2;
  --primary-500: #274db5;
  --primary-600: #1a3379;
  --primary-700: #0d193d;
  --primary-800: #000000;
  /* secondary, accent, neutral, success, warning, danger follow */
}
```

How to use the palette in your UI

- Button example

```css
.btn-primary {
  background: var(--primary-400);
  color: var(--neutral-50);
  border-radius: 6px;
  padding: 8px 12px;
}
.btn-primary:hover {
  background: var(--primary-300);
}
```

- Surface and text

```css
.card {
  background: var(--neutral-50);
  color: var(--neutral-700);
}
.card--dark {
  background: var(--neutral-800);
  color: var(--neutral-50);
}
```

Accessibility tips

- Aim for at least 4.5:1 contrast for normal text and 3:1 for large text. The extension can include contrast metadata if you enable it when generating the palette.
- If a text/background pair fails contrast checks, swap to a darker/lighter step from the same group (e.g. `--primary-600` instead of `--primary-400`) or use a neutral token for text.

Advanced: programmatic use (AI / scripts)

The extension includes an MCP-style JSON-RPC server (stdio framed) so AI agents and scripts can request palettes programmatically. This is optional — you can ignore this section if you only use the UI.

Request shape (JSON-RPC over Content-Length framing)

Example JSON body:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "generatePalette",
  "params": { "seed": "#3466f2", "shades": 9, "includeAccessibility": true }
}
```

Framed example to write to the server stdin (header + body):

```
Content-Length: <N>\r\n\r\n{"jsonrpc":"2.0","id":1,...}
```

Response (abridged):

```json
{
  "jsonrpc":"2.0",
  "id":1,
  "result":{
    "palette": { "primary": ["#FFFFFF","#CCD9FC",...], /* ... */ },
    "content": [ { "type":"text", "text": ":root { --primary-100: #CCD9FC; ... }" } ]
  }
}
```

You can write the concatenated `content` text block straight into a CSS/SCSS file. The `palette` object is convenient for programmatic manipulations (e.g. converting tokens to Tailwind config or design-tokens JSON).

Troubleshooting & tips

- If the palette looks too flat (many whites/blacks), try giving a stronger `seed` color or more `shades`.
- For dark themes, use the `dark` option when generating to get palettes optimized for dark backgrounds.
- If you're integrating with design systems, use the structured `palette` output — it contains arrays for each semantic group and optional contrast values.

Want a quick preview?

1. Run `Colors: Generate Palette` in the Command Palette.
2. The CSS opens in an editor tab — paste it into your styles and refresh your app to preview.

Feedback and help

If something isn't working or you'd like a feature (color presets, WCAG auto-fixes, dark-mode variants), open an issue in the repository.

Enjoy building beautiful palettes!
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
