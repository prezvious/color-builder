import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, ExternalLink } from "lucide-react";
import { format } from "date-fns";

import { CopyButton } from "@/components/color-builder/copy-button";
import { ExportPaletteButtons } from "@/components/color-builder/export-palette-buttons";
import { PaletteCard } from "@/components/color-builder/palette-card";
import { getCachedPaletteBySlug, listRelatedPalettes } from "@/lib/color-builder/repository";

type PalettePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PalettePageProps) {
  const { slug } = await params;
  const palette = await getCachedPaletteBySlug(slug);

  return {
    title: palette ? palette.name : "Palette not found",
  };
}

export default async function PalettePage({ params }: PalettePageProps) {
  const { slug } = await params;
  const palette = await getCachedPaletteBySlug(slug);

  if (!palette) {
    notFound();
  }

  const relatedPalettes = await listRelatedPalettes(palette.submissionId, palette.slug, 3);
  const shareUrl = `/palette/${palette.slug}`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[92rem] flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
      <section className="paper-panel rounded-[2.2rem] px-5 py-8 sm:px-8 sm:py-10">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-4">
            <Link href="/gallery" className="studio-button studio-button-secondary">
              <ArrowLeft className="size-4" />
              Back to gallery
            </Link>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--text-soft)]">
                Public share page
              </p>
              <h1 className="display-face mt-2 text-5xl leading-none text-[var(--text-primary)] sm:text-6xl">
                {palette.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-2">
                  <CalendarClock className="size-4" />
                  {format(new Date(palette.createdAt), "MMMM d, yyyy")}
                </span>
                <span>{palette.colors.length} colors</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <CopyButton value={shareUrl} label="Copy share link" />
            <Link href="/" className="studio-button studio-button-primary">
              Build another
              <ExternalLink className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
        <PaletteCard
          palette={palette}
          exportId={`public-export-${palette.slug}`}
          eyebrow="Published palette"
          footnote="Validated, stored, and publicly shareable"
          actions={
            <div className="flex flex-wrap gap-3">
              <CopyButton
                value={palette.colors.map((color) => `${color.source} -> ${color.hex}`).join("\n")}
                label="Copy normalized list"
              />
              <ExportPaletteButtons
                targetId={`public-export-${palette.slug}`}
                paletteName={palette.name}
              />
            </div>
          }
        />

        <div className="space-y-6">
          <section className="paper-panel rounded-[2rem] p-5 sm:p-7">
            <div className="relative space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
                Palette notes
              </p>
              <h2 className="display-face text-3xl text-[var(--text-primary)]">
                Original values plus normalized hex
              </h2>
              <p className="text-sm leading-7 text-[var(--text-secondary)]">
                Every published palette keeps the original color string and a normalized hex
                version. That keeps previews consistent while preserving what the uploader pasted.
              </p>
            </div>
          </section>

          <section className="paper-panel rounded-[2rem] p-5 sm:p-7">
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
                  Related palettes
                </p>
                <h2 className="display-face mt-2 text-3xl text-[var(--text-primary)]">
                  From the same submission
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {relatedPalettes.length ? (
                relatedPalettes.map((related) => (
                  <PaletteCard
                    key={related.slug}
                    palette={related}
                    eyebrow="Related palette"
                    href={`/palette/${related.slug}`}
                    footnote="Published in the same batch"
                  />
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-[color:var(--border-default)] px-5 py-8 text-sm leading-7 text-[var(--text-secondary)]">
                  No sibling palettes were stored alongside this one.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
