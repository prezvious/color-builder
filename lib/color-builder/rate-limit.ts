import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_SUBMISSIONS_PER_HOUR = 10;
const WINDOW_IN_MS = 60 * 60 * 1000;

export function extractClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp?.trim() || null;

  return ip || null;
}

export function hashIpAddress(ip: string | null): string | null {
  if (!ip) {
    return null;
  }

  const salt = process.env.RATE_LIMIT_SALT || "color-builder-rate-limit";

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function assertSubmissionRateLimit(
  client: SupabaseClient,
  ipHash: string | null,
): Promise<void> {
  if (!ipHash) {
    return;
  }

  const windowStart = new Date(Date.now() - WINDOW_IN_MS).toISOString();
  const { count, error } = await client
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", windowStart);

  if (error) {
    throw error;
  }

  if ((count ?? 0) >= MAX_SUBMISSIONS_PER_HOUR) {
    throw new Error("Too many submissions from this address. Please try again later.");
  }
}
