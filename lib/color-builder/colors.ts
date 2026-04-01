import { converter, formatHex, formatHex8, parse } from "culori";

const COLOR_TOKEN_REGEX =
  /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b|(?:rgba?|hsla?)\(\s*[^)]*\)/gi;

const toRgb = converter("rgb");

export function extractColorTokens(value: string): string[] {
  return value.match(COLOR_TOKEN_REGEX) ?? [];
}

export function normalizeColor(value: string): { source: string; hex: string } | null {
  const source = value.trim();
  const parsed = parse(source);

  if (!parsed) {
    return null;
  }

  const alpha = typeof parsed.alpha === "number" ? parsed.alpha : 1;
  const hex = alpha < 1 ? formatHex8(parsed) : formatHex(parsed);

  return {
    source,
    hex: hex.toUpperCase(),
  };
}

export function getReadableTextColor(hex: string): string {
  const parsed = parse(hex);

  if (!parsed) {
    return "#1F1812";
  }

  const rgb = toRgb(parsed);

  if (!rgb) {
    return "#1F1812";
  }

  const alpha = typeof parsed.alpha === "number" ? parsed.alpha : 1;
  const r = alpha * rgb.r + (1 - alpha);
  const g = alpha * rgb.g + (1 - alpha);
  const b = alpha * rgb.b + (1 - alpha);

  const luminance = [r, g, b]
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    )
    .reduce((total, channel, index) => {
      const weights = [0.2126, 0.7152, 0.0722];
      return total + channel * weights[index];
    }, 0);

  return luminance > 0.4 ? "#1F1812" : "#FFF8EE";
}
