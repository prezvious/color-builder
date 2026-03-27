import { nanoid } from "nanoid";

import type {
  InputMode,
  ParsedPalette,
  ParserWarning,
  PublishResult,
  StoredPalette,
} from "@/lib/color-builder/types";
import {
  getSupabaseAdminClient,
  getSupabaseReadClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { slugifyFragment } from "@/lib/color-builder/utils";

type PaletteRow = {
  id: string;
  slug: string;
  submission_id: string;
  name: string;
  sort_order: number;
  colors: StoredPalette["colors"];
  created_at: string;
};

function mapPaletteRow(row: PaletteRow): StoredPalette {
  return {
    id: row.id,
    slug: row.slug,
    submissionId: row.submission_id,
    order: row.sort_order,
    name: row.name,
    colors: row.colors as StoredPalette["colors"],
    createdAt: row.created_at,
  };
}

function createPaletteSlug(name: string): string {
  return `${slugifyFragment(name)}-${nanoid(6).toLowerCase()}`;
}

export async function listPublicPalettes(limit: number = 24): Promise<StoredPalette[]> {
  const client = getSupabaseReadClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("palettes")
    .select("id, slug, submission_id, name, sort_order, colors, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as PaletteRow[]).map(mapPaletteRow);
}

export async function getPaletteBySlug(slug: string): Promise<StoredPalette | null> {
  const client = getSupabaseReadClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("palettes")
    .select("id, slug, submission_id, name, sort_order, colors, created_at")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  return mapPaletteRow(data as PaletteRow);
}

export async function listRelatedPalettes(
  submissionId: string,
  currentSlug: string,
  limit: number = 3,
): Promise<StoredPalette[]> {
  const client = getSupabaseReadClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("palettes")
    .select("id, slug, submission_id, name, sort_order, colors, created_at")
    .eq("submission_id", submissionId)
    .neq("slug", currentSlug)
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as PaletteRow[]).map(mapPaletteRow);
}

export async function saveSubmission(input: {
  sourceMode: InputMode;
  rawInput: string | null;
  canonicalMarkdown: string;
  warnings: ParserWarning[];
  ipHash: string | null;
  palettes: ParsedPalette[];
}): Promise<PublishResult> {
  const client = getSupabaseAdminClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { data: submission, error: submissionError } = await client
    .from("submissions")
    .insert({
      source_mode: input.sourceMode,
      raw_input: input.rawInput,
      canonical_markdown: input.canonicalMarkdown,
      warnings: input.warnings,
      ip_hash: input.ipHash,
    })
    .select("id")
    .single();

  if (submissionError || !submission) {
    throw submissionError || new Error("Unable to save this submission.");
  }

  const paletteRows = input.palettes.map((palette, index) => ({
    submission_id: submission.id,
    slug: createPaletteSlug(palette.name),
    name: palette.name,
    sort_order: index + 1,
    colors: palette.colors,
  }));

  const { data: savedPalettes, error: paletteError } = await client
    .from("palettes")
    .insert(paletteRows)
    .select("slug, name");

  if (paletteError || !savedPalettes) {
    throw paletteError || new Error("Unable to save these palettes.");
  }

  return {
    submissionId: submission.id,
    palettes: savedPalettes.map((palette) => ({
      slug: palette.slug,
      name: palette.name,
    })),
  };
}

export { isSupabaseConfigured };
