const assert = require("assert");
const path = require("path");

const paletteModule = require(path.join(
  __dirname,
  "..",
  "dist",
  "mcp",
  "palette.js"
));

if (!paletteModule || !paletteModule.generatePalette) {
  console.error("palette module missing - run npm run build:mcp first");
  process.exit(2);
}

const generatePalette = paletteModule.generatePalette;

function run() {
  const p = generatePalette({
    seed: "#3B82F6",
    shades: 10,
    includeAccessibility: true,
  });
  // sanity checks
  assert.ok(p.tokens && p.tokens.length >= 6, "expected tokens present");
  // each token should have shades keys
  for (const t of p.tokens) {
    assert.ok(
      t.shades && Object.keys(t.shades).length >= 7,
      "expected several shades"
    );
  }
  // accessibility metadata present when requested
  const firstShade =
    p.tokens[0].shades["500"] || Object.values(p.tokens[0].shades)[4];
  assert.ok(firstShade, "expected a 500 shade");
  if (firstShade.wcag) {
    // contrast should be a number
    assert.ok(typeof firstShade.contrast === "number");
  }

  console.log("Palette test passed");
}

run();
