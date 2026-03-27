import { ComplianceError } from "@/lib/color-builder/errors";
import type {
  ParseMarkdownResult,
  ParseRawResult,
  ParsedPalette,
  PaletteColor,
  ParserWarning,
} from "@/lib/color-builder/types";
import { extractColorTokens, normalizeColor } from "@/lib/color-builder/colors";
import { createCanonicalMarkdown } from "@/lib/color-builder/template";
import { normalizeLineEndings, sanitizePaletteName } from "@/lib/color-builder/utils";

const HEADING_REGEX = /^## Color Palette (\d+)$/;
const NAME_REGEX = /^- Palette Name: (.+)$/;
const COLOR_LINE_REGEX = /^- Color (\d+): (.+)$/;

function createUntitledName(index: number): string {
  return `Untitled Palette ${index}`;
}

function shouldIgnoreNameCandidate(value: string): boolean {
  return /^color\s+\d+\b/i.test(value) || /^color\s+palette\b/i.test(value) || /^warna\b/i.test(value);
}

function toPaletteColor(index: number, source: string): PaletteColor {
  const normalized = normalizeColor(source);

  if (!normalized) {
    throw new ComplianceError();
  }

  return {
    index,
    source: normalized.source,
    hex: normalized.hex,
  };
}

export function parseRawPaletteText(rawText: string): ParseRawResult {
  const lines = normalizeLineEndings(rawText).split("\n");
  const palettes: ParsedPalette[] = [];
  const warnings: ParserWarning[] = [];
  let currentColors: PaletteColor[] = [];
  let pendingName: string | null = null;
  let untitledIndex = 1;

  const finalizePalette = () => {
    if (!currentColors.length) {
      return;
    }

    const nextName = pendingName || createUntitledName(untitledIndex);

    if (!pendingName) {
      untitledIndex += 1;
    }

    palettes.push({
      order: palettes.length + 1,
      name: nextName,
      colors: currentColors,
    });

    currentColors = [];
    pendingName = null;
  };

  for (const [index, originalLine] of lines.entries()) {
    const line = originalLine.trim();

    if (!line) {
      finalizePalette();
      continue;
    }

    const tokens = extractColorTokens(line);

    if (tokens.length > 0) {
      currentColors.push(
        ...tokens.map((token, tokenIndex) =>
          toPaletteColor(currentColors.length + tokenIndex + 1, token),
        ),
      );
      continue;
    }

    const candidateName = sanitizePaletteName(line);

    if (candidateName && !shouldIgnoreNameCandidate(candidateName)) {
      if (currentColors.length > 0) {
        finalizePalette();
      }

      pendingName = candidateName;
      continue;
    }

    warnings.push({
      line: index + 1,
      text: line,
      reason: "Ignored because no supported color values were found.",
    });
  }

  finalizePalette();

  if (!palettes.length) {
    throw new Error("No supported color values were found in the provided text.");
  }

  return {
    palettes,
    generatedMarkdown: createCanonicalMarkdown(palettes),
    warnings,
  };
}

export function parseMarkdownSubmission(markdownBlock: string): ParseMarkdownResult {
  const normalizedInput = normalizeLineEndings(markdownBlock).trim();
  const fenceMatch = normalizedInput.match(/^```(?:md|markdown)?\n([\s\S]*?)\n```$/);

  if (!fenceMatch) {
    throw new ComplianceError();
  }

  const body = fenceMatch[1].trim();

  if (!body) {
    throw new ComplianceError();
  }

  const lines = body.split("\n");
  const palettes: ParsedPalette[] = [];
  let pointer = 0;
  let expectedPaletteNumber = 1;

  while (pointer < lines.length) {
    while (pointer < lines.length && lines[pointer].trim() === "") {
      pointer += 1;
    }

    if (pointer >= lines.length) {
      break;
    }

    const headingMatch = lines[pointer].trim().match(HEADING_REGEX);

    if (!headingMatch || Number(headingMatch[1]) !== expectedPaletteNumber) {
      throw new ComplianceError();
    }

    pointer += 1;

    const nameLine = lines[pointer]?.trim();
    const nameMatch = nameLine?.match(NAME_REGEX);

    if (!nameMatch) {
      throw new ComplianceError();
    }

    const paletteName = nameMatch[1].trim();

    if (!paletteName) {
      throw new ComplianceError();
    }

    pointer += 1;

    const colors: PaletteColor[] = [];
    let expectedColorNumber = 1;

    while (pointer < lines.length) {
      const currentLine = lines[pointer].trim();

      if (!currentLine) {
        pointer += 1;
        break;
      }

      if (currentLine.startsWith("## ")) {
        break;
      }

      const colorMatch = currentLine.match(COLOR_LINE_REGEX);

      if (!colorMatch || Number(colorMatch[1]) !== expectedColorNumber) {
        throw new ComplianceError();
      }

      colors.push(toPaletteColor(expectedColorNumber, colorMatch[2].trim()));
      expectedColorNumber += 1;
      pointer += 1;
    }

    if (!colors.length) {
      throw new ComplianceError();
    }

    palettes.push({
      order: expectedPaletteNumber,
      name: paletteName,
      colors,
    });

    expectedPaletteNumber += 1;
  }

  if (!palettes.length) {
    throw new ComplianceError();
  }

  return {
    palettes,
    normalizedMarkdown: createCanonicalMarkdown(palettes),
  };
}
