import * as culori from "culori";

type GeneratePaletteParams = {
  theme?: string;
  seed?: string | string[];
  shades?: number;
  dark?: boolean;
  includeAccessibility?: boolean;
};

type Shade = {
  hex: string;
  lab?: any;
  contrast?: number;
  wcag?: { AA: boolean; AAA: boolean };
};

type Token = {
  token: string;
  default: string;
  shades: Record<string, Shade>;
};

export function relativeLuminance(hex: string) {
  // convert hex to linear sRGB and compute luminance per WCAG
  const c = culori.parse(hex);
  if (!c) return 0;
  const rgb = culori.converter("rgb")(c);
  function lin(v: number) {
    if (v <= 0.03928) return v / 12.92;
    return Math.pow((v + 0.055) / 1.055, 2.4);
  }
  const r = lin(rgb.r);
  const g = lin(rgb.g);
  const b = lin(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA: string, hexB: string) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return +((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

function formatHex(col: any) {
  return culori.formatHex(col).toUpperCase();
}

function hexToRgb01(hex: string) {
  const m = hex.replace("#", "");
  const v =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const r = parseInt(v.substring(0, 2), 16) / 255;
  const g = parseInt(v.substring(2, 4), 16) / 255;
  const b = parseInt(v.substring(4, 6), 16) / 255;
  return { r, g, b };
}

function rgb01ToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const to255 = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255);
  const h = (n: number) => to255(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixRgb(hexA: string, hexB: string, t: number) {
  const A = hexToRgb01(hexA);
  const B = hexToRgb01(hexB);
  return rgb01ToHex({
    r: lerp(A.r, B.r, t),
    g: lerp(A.g, B.g, t),
    b: lerp(A.b, B.b, t),
  });
}

function generateTonalScale(seedHex: string, steps: number) {
  // Simple, robust tonal scale: interpolate between white -> seed -> black in sRGB space
  const scales: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    if (t <= 0.5) {
      // white -> seed
      const tt = t / 0.5;
      scales.push(mixRgb("#FFFFFF", seedHex, tt));
    } else {
      // seed -> black
      const tt = (t - 0.5) / 0.5;
      scales.push(mixRgb(seedHex, "#000000", tt));
    }
  }
  return scales;
}

export function paletteFromSeed(seed: string, shades = 10) {
  const tonal = generateTonalScale(seed, shades);
  // map to keys 50..900
  const keys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const shadesObj: Record<string, Shade> = {};
  for (let i = 0; i < keys.length && i < tonal.length; i++) {
    const hex = tonal[i];
    shadesObj[String(keys[i])] = { hex };
  }
  return shadesObj;
}

export function generatePalette(params?: GeneratePaletteParams) {
  const shades = params?.shades ?? 10;
  const seeds: string[] = [];
  if (params?.seed) {
    if (Array.isArray(params.seed)) seeds.push(...params.seed);
    else seeds.push(params.seed);
  }

  const theme = params?.theme ?? "default";

  // semantic tokens for now
  const tokens: Token[] = [];

  // pick seeds or defaults
  const primarySeed = seeds[0] ?? "#3B82F6";
  const secondarySeed = seeds[1] ?? "#6B7280";
  const accentSeed = seeds[2] ?? "#EF4444";

  tokens.push({
    token: "primary",
    default: "500",
    shades: paletteFromSeed(primarySeed, shades),
  });
  tokens.push({
    token: "secondary",
    default: "500",
    shades: paletteFromSeed(secondarySeed, shades),
  });
  tokens.push({
    token: "accent",
    default: "500",
    shades: paletteFromSeed(accentSeed, shades),
  });
  tokens.push({
    token: "success",
    default: "500",
    shades: paletteFromSeed("#10B981", shades),
  });
  tokens.push({
    token: "warning",
    default: "500",
    shades: paletteFromSeed("#F59E0B", shades),
  });
  tokens.push({
    token: "danger",
    default: "500",
    shades: paletteFromSeed("#DC2626", shades),
  });
  tokens.push({
    token: "neutral",
    default: "500",
    shades: paletteFromSeed("#F3F4F6", shades),
  });

  // compute accessibility metadata if requested
  if (params?.includeAccessibility) {
    for (const t of tokens) {
      for (const k of Object.keys(t.shades)) {
        const s = t.shades[k];
        // contrast against white and black
        const contrastOnWhite = contrastRatio(s.hex, "#FFFFFF");
        const contrastOnBlack = contrastRatio(s.hex, "#000000");
        s.contrast = Math.max(contrastOnWhite, contrastOnBlack);
        s.wcag = { AA: s.contrast >= 4.5, AAA: s.contrast >= 7 };
      }
    }
  }

  // produce CSS vars string
  const cssVarsParts: string[] = [];
  for (const t of tokens) {
    for (const [k, v] of Object.entries(t.shades)) {
      cssVarsParts.push(`--${t.token}-${k}: ${v.hex};`);
    }
  }
  const cssVars = `:root {\n  ${cssVarsParts.join("\n  ")}\n}`;

  const result = {
    theme,
    dark: params?.dark ?? false,
    tokens,
    formats: {
      cssVars,
      json: { tokens },
    },
  };

  return result;
}
