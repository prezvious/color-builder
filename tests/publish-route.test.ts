import { afterEach, describe, expect, it, vi } from "vitest";

import { COMPLIANCE_ERROR_MESSAGE } from "@/lib/color-builder/errors";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

afterEach(() => {
  vi.resetModules();
});

describe("publish route", () => {
  it("blocks malformed markdown before any persistence path runs", async () => {
    const { POST } = await import("@/app/api/publish/route");

    const request = new Request("http://localhost/api/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        markdownBlock: "## Color Palette 1\n- Palette Name: Broken\n- Color 1: #FF6B6B",
        sourceMode: "manual",
      }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as { message: string };

    expect(response.status).toBe(400);
    expect(payload.message).toBe(COMPLIANCE_ERROR_MESSAGE);
  });
});
