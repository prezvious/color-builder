import Link from "next/link";
import { ArrowUpRight, Clock3, Layers3 } from "lucide-react";

import { getReadableTextColor } from "@/lib/color-builder/colors";
import type { ParsedPalette, StoredPalette } from "@/lib/color-builder/types";

type PaletteLike = ParsedPalette | StoredPalette;

type PaletteCardProps = {
  palette: PaletteLike;
  exportId?: string;
  eyebrow?: string;
  href?: string;
  footnote?: string;
  actions?: React.ReactNode;
};

export function PaletteCard({
  palette,
  exportId,
  eyebrow,
  href,
  footnote,
  actions,
}: PaletteCardProps) {
  return (
    <article
      id={exportId}
      className="paper-panel rounded-[2rem] p-5 sm:p-7"
      style={{ containerType: "inline-size" }}
    >
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-[0.72rem] font-bold uppercase tracking-[0.28em] text-[var(--text-soft)]">
            {eyebrow ? <span>{eyebrow}</span> : null}
            <span className="inline-flex items-center gap-2">
              <Layers3 className="size-3.5" />
              {palette.colors.length} colors
            </span>
          </div>
          <h3 className="display-face text-3xl leading-none text-[var(--text-primary)] sm:text-[2.55rem]">
            {palette.name}
          </h3>
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-2 self-start rounded-full border border-[color:var(--border-default)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:border-[color:var(--border-strong)]"
          >
            Open palette
            <ArrowUpRight className="size-4" />
          </Link>
        ) : null}
      </div>

      <div className="relative mt-6 grid gap-3">
        {palette.colors.map((color) => {
          const readableTextColor = getReadableTextColor(color.hex);

          return (
            <div
              key={`${palette.name}-${color.index}-${color.hex}`}
              className="overflow-hidden rounded-[1.6rem] border border-white/70 shadow-[0_1rem_2rem_-1.4rem_var(--shadow-color)]"
            >
              <div
                className="flex items-center justify-between px-5 py-5"
                style={{
                  backgroundColor: color.hex,
                  color: readableTextColor,
                }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.22em]">
                  Color {color.index}
                </span>
                <span className="font-mono text-sm">{color.hex}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white/85 px-5 py-4 text-sm text-[var(--text-secondary)]">
                <span className="font-medium">{color.source}</span>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                  normalized
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {footnote || actions ? (
        <div className="relative mt-6 flex flex-col gap-4 border-t border-dashed border-[color:var(--border-default)] pt-5 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2">
            <Clock3 className="size-4" />
            <span>{footnote}</span>
          </div>
          {actions}
        </div>
      ) : null}
    </article>
  );
}
