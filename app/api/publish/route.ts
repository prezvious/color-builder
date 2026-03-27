import { revalidatePath } from "next/cache";
import { z } from "zod";

import { COMPLIANCE_ERROR_MESSAGE } from "@/lib/color-builder/errors";
import { parseMarkdownSubmission } from "@/lib/color-builder/parser";
import { saveSubmission } from "@/lib/color-builder/repository";
import {
  assertSubmissionRateLimit,
  extractClientIp,
  hashIpAddress,
} from "@/lib/color-builder/rate-limit";
import type { ParserWarning } from "@/lib/color-builder/types";
import {
  getSupabaseAdminClient,
  isSupabaseWriteConfigured,
} from "@/lib/supabase/server";

const warningSchema: z.ZodType<ParserWarning> = z.object({
  line: z.number().int().nonnegative(),
  text: z.string(),
  reason: z.string(),
});

const requestSchema = z.object({
  markdownBlock: z.string().trim().min(1).max(50_000),
  sourceMode: z.enum(["raw", "manual"]),
  rawInput: z.string().max(50_000).nullable().optional(),
  warnings: z.array(warningSchema).optional(),
  honeypot: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());

    if (payload.honeypot?.trim()) {
      return Response.json({ message: "Submission rejected." }, { status: 400 });
    }

    const parsed = parseMarkdownSubmission(payload.markdownBlock);

    if (!isSupabaseWriteConfigured()) {
      return Response.json(
        {
          message:
            "Supabase write access is not configured. Add SUPABASE_SERVICE_ROLE_KEY before publishing.",
        },
        { status: 503 },
      );
    }

    const client = getSupabaseAdminClient();

    if (!client) {
      return Response.json(
        {
          message:
            "Supabase write access is not configured. Add SUPABASE_SERVICE_ROLE_KEY before publishing.",
        },
        { status: 503 },
      );
    }

    const ipHash = hashIpAddress(extractClientIp(request));
    await assertSubmissionRateLimit(client, ipHash);

    const result = await saveSubmission({
      sourceMode: payload.sourceMode,
      rawInput: payload.rawInput?.trim() || null,
      canonicalMarkdown: parsed.normalizedMarkdown,
      warnings: payload.warnings ?? [],
      ipHash,
      palettes: parsed.palettes,
    });

    revalidatePath("/");
    revalidatePath("/gallery");

    for (const palette of result.palettes) {
      revalidatePath(`/palette/${palette.slug}`);
    }

    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ message: COMPLIANCE_ERROR_MESSAGE }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Unable to publish these palettes right now.";
    const status =
      message === COMPLIANCE_ERROR_MESSAGE
        ? 400
        : message.startsWith("Too many submissions")
          ? 429
          : 500;

    return Response.json({ message }, { status });
  }
}
