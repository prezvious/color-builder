import { z } from "zod";

import { parseRawPaletteText } from "@/lib/color-builder/parser";

const requestSchema = z.object({
  rawText: z.string().trim().min(1).max(50_000),
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    const result = parseRawPaletteText(payload.rawText);

    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Paste some raw palette text before generating the canonical Markdown."
        : error instanceof Error
          ? error.message
          : "Unable to parse the raw palette text.";

    return Response.json({ message }, { status: 400 });
  }
}
