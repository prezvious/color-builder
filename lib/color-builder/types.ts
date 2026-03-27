export type InputMode = "raw" | "manual";

export type ParserWarning = {
  line: number;
  text: string;
  reason: string;
};

export type PaletteColor = {
  index: number;
  source: string;
  hex: string;
};

export type ParsedPalette = {
  order: number;
  name: string;
  colors: PaletteColor[];
};

export type ParseRawResult = {
  palettes: ParsedPalette[];
  generatedMarkdown: string;
  warnings: ParserWarning[];
};

export type ParseMarkdownResult = {
  palettes: ParsedPalette[];
  normalizedMarkdown: string;
};

export type PublishResult = {
  submissionId: string;
  palettes: Array<{
    slug: string;
    name: string;
  }>;
};

export type StoredPalette = ParsedPalette & {
  id: string;
  submissionId: string;
  slug: string;
  createdAt: string;
};
