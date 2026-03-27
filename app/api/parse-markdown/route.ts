import { z } from "zod";

import { COMPLIANCE_ERROR_MESSAGE } from "@/lib/color-builder/errors";
import { parseMarkdownSubmission } from "@/lib/color-builder/parser";

const requestSchema = z.object({
  markdownBlock: z.string().trim().min(1).max(50_000),
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    const result = parseMarkdownSubmission(payload.markdownBlock);

    return Response.json(result);
  } catch {
    return Response.json({ message: COMPLIANCE_ERROR_MESSAGE }, { status: 400 });
  }
}
