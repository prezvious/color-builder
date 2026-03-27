import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { PaletteCard } from "@/components/color-builder/palette-card";
import { isSupabaseConfigured, listPublicPalettes } from "@/lib/color-builder/repository";

export const metadata = {
  title: "Gallery",
};

export default async function GalleryPage() {
  const palettes = await listPublicPalettes(24);
  const configured = isSupabaseConfigured();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[94rem] flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
      <section className="paper-panel rounded-[2.2rem] px-5 py-8 sm:px-8 sm:py-10">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-4">
            <Link href="/" className="studio-button studio-button-secondary">
              <ArrowLeft className="size-4" />
              Back to builder
            </Link>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--text-soft)]">
                Public gallery
              </p>
              <h1 className="display-face mt-2 text-5xl leading-none text-[var(--text-primary)] sm:text-6xl">
                Freshly published palettes, ready to inspect or share.
              </h1>
            </div>
          </div>
          <Link href="/" className="studio-button studio-button-primary">
            Publish another palette
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      {!configured ? (
        <section className="paper-panel rounded-[2rem] p-5 text-sm leading-7 text-[var(--text-secondary)] sm:p-7">
          Supabase is not configured yet. Add your environment variables, run the SQL in
          `supabase/schema.sql`, and published palettes will start appearing here.
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        {palettes.length ? (
          palettes.map((palette) => (
            <PaletteCard
              key={palette.slug}
              palette={palette}
              eyebrow="Published palette"
              href={`/palette/${palette.slug}`}
              footnote={`Saved ${formatDistanceToNow(new Date(palette.createdAt), {
                addSuffix: true,
              })}`}
            />
          ))
        ) : (
          <div className="paper-panel rounded-[2rem] px-5 py-8 text-sm leading-7 text-[var(--text-secondary)] sm:px-7">
            No palettes are public yet. Publish your first validated palette from the builder.
          </div>
        )}
      </section>
    </main>
  );
}
