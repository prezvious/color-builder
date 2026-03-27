import { describe, expect, it } from "vitest";

import { COMPLIANCE_ERROR_MESSAGE } from "@/lib/color-builder/errors";
import { parseMarkdownSubmission, parseRawPaletteText } from "@/lib/color-builder/parser";

describe("parseRawPaletteText", () => {
  it("parses named palettes with mixed color formats", () => {
    const result = parseRawPaletteText(
      [
        "Sunset Ledger",
        "#FF6B6B",
        "rgb(249, 115, 22)",
        "hsl(43 96% 56%)",
        "",
        "Ocean Ledger",
        "#0EA5E9 #1D4ED8",
      ].join("\n"),
    );

    expect(result.palettes).toHaveLength(2);
    expect(result.palettes[0]?.name).toBe("Sunset Ledger");
    expect(result.palettes[0]?.colors).toHaveLength(3);
    expect(result.palettes[1]?.colors[1]?.hex).toBe("#1D4ED8");
    expect(result.generatedMarkdown).toContain("## Color Palette 2");
  });

  it("creates an untitled palette when no heading exists", () => {
    const result = parseRawPaletteText(["#0F172A", "#F8FAFC"].join("\n"));

    expect(result.palettes[0]?.name).toBe("Untitled Palette 1");
  });

  it("records warnings for ignored prose lines", () => {
    const result = parseRawPaletteText(
      ["Palette story", "#0F172A", "Color 3: missing value", "#F8FAFC"].join("\n"),
    );

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.text).toBe("Color 3: missing value");
  });
});

describe("parseMarkdownSubmission", () => {
  it("accepts the canonical fenced block", () => {
    const markdown = [
      "```md",
      "## Color Palette 1",
      "- Palette Name: Ember",
      "- Color 1: #FF6B6B",
      "- Color 2: rgb(249, 115, 22)",
      "",
      "## Color Palette 2",
      "- Palette Name: Tide",
      "- Color 1: hsl(221 83% 53%)",
      "```",
    ].join("\n");

    const result = parseMarkdownSubmission(markdown);

    expect(result.palettes).toHaveLength(2);
    expect(result.palettes[0]?.colors[1]?.hex).toBe("#F97316");
    expect(result.normalizedMarkdown).toContain("- Color 1: #FF6B6B");
  });

  it("rejects malformed markdown with the compliance message", () => {
    expect(() =>
      parseMarkdownSubmission(
        [
          "## Color Palette 1",
          "- Palette Name: Broken",
          "- Color 1: #FF6B6B",
        ].join("\n"),
      ),
    ).toThrow(COMPLIANCE_ERROR_MESSAGE);
  });
});
