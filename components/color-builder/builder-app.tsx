"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  GalleryVerticalEnd,
  Sparkles,
} from "lucide-react";

import { CopyButton } from "@/components/color-builder/copy-button";
import { ExportPaletteButtons } from "@/components/color-builder/export-palette-buttons";
import { PaletteCard } from "@/components/color-builder/palette-card";
import { COMPLIANCE_ERROR_MESSAGE } from "@/lib/color-builder/errors";
import { MANUAL_TEMPLATE_BLOCK } from "@/lib/color-builder/template";
import type {
  InputMode,
  ParsedPalette,
  ParserWarning,
  PublishResult,
  StoredPalette,
} from "@/lib/color-builder/types";

type BuilderAppProps = {
  featuredPalettes: StoredPalette[];
};

type ParseRawResponse = {
  palettes: ParsedPalette[];
  generatedMarkdown: string;
  warnings: ParserWarning[];
};

type ParseMarkdownResponse = {
  palettes: ParsedPalette[];
  normalizedMarkdown: string;
};

export function BuilderApp({ featuredPalettes }: BuilderAppProps) {
  const [mode, setMode] = useState<InputMode>("raw");
  const [rawText, setRawText] = useState("");
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [warnings, setWarnings] = useState<ParserWarning[]>([]);
  const [draftPalettes, setDraftPalettes] = useState<ParsedPalette[]>([]);
  const [finalMarkdown, setFinalMarkdown] = useState("");
  const [validatedPalettes, setValidatedPalettes] = useState<ParsedPalette[]>([]);
  const [validatedSourceMarkdown, setValidatedSourceMarkdown] = useState("");
  const [rawError, setRawError] = useState<string | null>(null);
  const [complianceError, setComplianceError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);

  const [isGeneratingRaw, startRawTransition] = useTransition();
  const [isValidating, startValidationTransition] = useTransition();
  const [isPublishing, startPublishTransition] = useTransition();

  const shareBaseUrl = typeof window === "undefined" ? "" : window.location.origin;
  const shareablePalettes = useMemo(
    () =>
      publishResult?.palettes.map((palette) => ({
        ...palette,
        url: `${shareBaseUrl}/palette/${palette.slug}`,
      })) ?? [],
    [publishResult, shareBaseUrl],
  );

  const resetFinalState = () => {
    setValidatedPalettes([]);
    setValidatedSourceMarkdown("");
    setComplianceError(null);
    setPublishError(null);
    setPublishResult(null);
  };

  const handleGenerateFromRaw = () => {
    startRawTransition(() => {
      void (async () => {
        setRawError(null);
        setComplianceError(null);
        setPublishError(null);
        setPublishResult(null);

        try {
          const response = await fetch("/api/parse-raw", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ rawText }),
          });

          const payload = (await response.json()) as ParseRawResponse | { message: string };

          if (!response.ok || !("generatedMarkdown" in payload)) {
            setDraftPalettes([]);
            setWarnings([]);
            setGeneratedMarkdown("");
            setRawError("message" in payload ? payload.message : "Unable to parse the raw text.");
            return;
          }

          setDraftPalettes(payload.palettes);
          setWarnings(payload.warnings);
          setGeneratedMarkdown(payload.generatedMarkdown);
          setFinalMarkdown("");
          resetFinalState();
        } catch {
          setDraftPalettes([]);
          setWarnings([]);
          setGeneratedMarkdown("");
          setRawError("Unable to parse the raw text.");
        }
      })();
    });
  };

  const handleValidateMarkdown = () => {
    startValidationTransition(() => {
      void (async () => {
        setComplianceError(null);
        setPublishError(null);
        setPublishResult(null);

        try {
          const response = await fetch("/api/parse-markdown", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ markdownBlock: finalMarkdown }),
          });

          const payload = (await response.json()) as ParseMarkdownResponse | { message: string };

          if (!response.ok || !("normalizedMarkdown" in payload)) {
            setValidatedPalettes([]);
            setComplianceError(COMPLIANCE_ERROR_MESSAGE);
            return;
          }

          setValidatedPalettes(payload.palettes);
          setValidatedSourceMarkdown(finalMarkdown);
        } catch {
          setValidatedPalettes([]);
          setComplianceError(COMPLIANCE_ERROR_MESSAGE);
        }
      })();
    });
  };

  const handlePublish = () => {
    startPublishTransition(() => {
      void (async () => {
        setPublishError(null);
        setPublishResult(null);

        try {
          const response = await fetch("/api/publish", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              markdownBlock: finalMarkdown,
              sourceMode: mode,
              rawInput: mode === "raw" ? rawText : null,
              warnings,
              honeypot: "",
            }),
          });

          const payload = (await response.json()) as PublishResult | { message: string };

          if (!response.ok || !("submissionId" in payload)) {
            setPublishError("message" in payload ? payload.message : "Unable to publish these palettes.");
            return;
          }

          setPublishResult(payload);
        } catch {
          setPublishError("Unable to publish these palettes.");
        }
      })();
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[96rem] flex-col gap-10 px-4 py-5 sm:px-6 lg:px-8">
      <section className="swatch-studio-shell paper-panel overflow-hidden rounded-[2.4rem] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="pill">
                <Sparkles className="size-3.5" />
                Color Builder
              </span>
              <span className="pill">
                <GalleryVerticalEnd className="size-3.5" />
                Anonymous public publishing
              </span>
            </div>
            <nav className="flex flex-wrap gap-3 text-sm font-semibold text-[var(--text-secondary)]">
              <Link href="/gallery" className="studio-button studio-button-secondary">
                Gallery
              </Link>
            </nav>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--text-soft)]">
                Transform raw palette lists into a strict Markdown system
              </p>
              <h1 className="display-face max-w-5xl text-5xl leading-[0.92] text-[var(--text-primary)] sm:text-6xl lg:text-7xl">
                Color Builder
              </h1>
              <p className="max-w-3xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
                Paste your raw color text, generate the approved Markdown block, then paste that
                block back into the validator. If the format is wrong, publishing is blocked and
                the app shows the required compliance message. No bypass.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "1. Paste raw colors or use the manual template.",
                "2. Copy the generated Markdown block.",
                "3. Paste the fenced block back, validate, and publish.",
              ].map((step) => (
                <div
                  key={step}
                  className="rounded-[1.6rem] border border-[color:var(--border-default)] bg-white/75 px-4 py-4 text-sm font-medium leading-6 text-[var(--text-secondary)]"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <div className="paper-panel rounded-[2rem] p-5 sm:p-7">
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
                  Input mode
                </p>
                <h2 className="display-face mt-2 text-3xl text-[var(--text-primary)]">
                  Start with raw text or the manual template
                </h2>
              </div>
              <div className="flex gap-2 rounded-full bg-white/80 p-1">
                {(["raw", "manual"] as const).map((nextMode) => (
                  <button
                    key={nextMode}
                    type="button"
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      mode === nextMode
                        ? "bg-[var(--interactive-primary)] text-[#FFF8EE]"
                        : "text-[var(--text-secondary)]"
                    }`}
                    onClick={() => {
                      setMode(nextMode);
                      resetFinalState();
                    }}
                  >
                    {nextMode === "raw" ? "Raw input" : "Template mode"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mt-6 space-y-5">
              {mode === "raw" ? (
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-[var(--text-secondary)]" htmlFor="raw-text">
                    Paste any mix of palette names plus HEX, RGB, or HSL colors.
                  </label>
                  <textarea
                    id="raw-text"
                    className="min-h-[16rem] w-full rounded-[1.6rem] border border-[color:var(--border-default)] bg-[color:var(--surface-primary)] px-5 py-4 text-sm leading-7 text-[var(--text-primary)] shadow-inner outline-none transition focus:border-[color:var(--border-strong)]"
                    placeholder={"Sunset Study\n#FF6B6B\nrgb(249, 115, 22)\nhsl(43 96% 56%)\n\nOcean Ledger\n#0EA5E9\n#1D4ED8\n#0F172A"}
                    value={rawText}
                    onChange={(event) => {
                      setRawText(event.target.value);
                      setRawError(null);
                    }}
                  />
                  <button
                    className="studio-button studio-button-primary"
                    type="button"
                    onClick={handleGenerateFromRaw}
                    disabled={isGeneratingRaw || !rawText.trim()}
                  >
                    <Sparkles className="size-4" />
                    {isGeneratingRaw ? "Generating template" : "Generate canonical Markdown"}
                  </button>
                  {rawError ? (
                    <div className="rounded-[1.5rem] border border-[color:var(--danger)]/30 bg-[color:var(--surface-primary)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
                      {rawError}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-secondary)]">
                        Copy the template, fill it out, then paste the final fenced Markdown below.
                      </p>
                    </div>
                    <CopyButton value={MANUAL_TEMPLATE_BLOCK} label="Copy manual template" />
                  </div>
                  <pre className="overflow-x-auto rounded-[1.6rem] border border-[color:var(--border-default)] bg-[color:var(--surface-primary)] px-5 py-4 text-sm leading-7 text-[var(--text-secondary)]">
                    <code>{MANUAL_TEMPLATE_BLOCK}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="paper-panel rounded-[2rem] p-5 sm:p-7">
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
                  Generated block
                </p>
                <h2 className="display-face mt-2 text-3xl text-[var(--text-primary)]">
                  Copy this exact Markdown structure
                </h2>
              </div>
              <CopyButton
                value={generatedMarkdown || MANUAL_TEMPLATE_BLOCK}
                label={generatedMarkdown ? "Copy generated block" : "Copy template"}
              />
            </div>
            <textarea
              readOnly
              className="mt-6 min-h-[15rem] w-full rounded-[1.6rem] border border-[color:var(--border-default)] bg-[color:var(--surface-primary)] px-5 py-4 font-mono text-sm leading-7 text-[var(--text-primary)] shadow-inner outline-none"
              value={generatedMarkdown || MANUAL_TEMPLATE_BLOCK}
            />
          </div>

          <div className="paper-panel rounded-[2rem] p-5 sm:p-7">
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
                  Final validation
                </p>
                <h2 className="display-face mt-2 text-3xl text-[var(--text-primary)]">
                  Paste the fenced Markdown block back into the validator
                </h2>
              </div>
              <button
                className="studio-button studio-button-primary"
                type="button"
                onClick={handleValidateMarkdown}
                disabled={isValidating || !finalMarkdown.trim()}
              >
                <CheckCircle2 className="size-4" />
                {isValidating ? "Validating" : "Validate and preview"}
              </button>
            </div>

            <textarea
              className="mt-6 min-h-[17rem] w-full rounded-[1.6rem] border border-[color:var(--border-default)] bg-[color:var(--surface-primary)] px-5 py-4 font-mono text-sm leading-7 text-[var(--text-primary)] shadow-inner outline-none transition focus:border-[color:var(--border-strong)]"
              placeholder="Paste the full fenced Markdown block here."
              value={finalMarkdown}
              onChange={(event) => {
                setFinalMarkdown(event.target.value);
                resetFinalState();
              }}
            />

            {complianceError ? (
              <div className="mt-5 flex items-start gap-3 rounded-[1.5rem] border border-[color:var(--danger)]/35 bg-[color:var(--surface-primary)] px-4 py-4 text-sm font-semibold text-[var(--danger)]">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{COMPLIANCE_ERROR_MESSAGE}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-8">
          <div className="paper-panel rounded-[2rem] p-5 sm:p-7">
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
                  Draft preview
                </p>
                <h2 className="display-face mt-2 text-3xl text-[var(--text-primary)]">
                  Review the parser output by palette
                </h2>
              </div>
              {warnings.length ? (
                <span className="pill">
                  <AlertTriangle className="size-3.5" />
                  {warnings.length} ignored lines
                </span>
              ) : null}
            </div>

            <div className="mt-6 space-y-4">
              {draftPalettes.length ? (
                draftPalettes.map((palette) => (
                  <PaletteCard
                    key={`draft-${palette.order}-${palette.name}`}
                    palette={palette}
                    eyebrow={`Draft palette ${palette.order}`}
                    footnote={`${palette.colors.length} colors detected`}
                  />
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-[color:var(--border-default)] px-5 py-8 text-sm leading-7 text-[var(--text-secondary)]">
                  Generated palettes appear here after the raw parser finds supported colors.
                </div>
              )}
            </div>

            {warnings.length ? (
              <div className="mt-5 rounded-[1.6rem] border border-[color:var(--border-default)] bg-white/65 p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Ignored lines</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                  {warnings.map((warning) => (
                    <li key={`${warning.line}-${warning.text}`}>
                      Line {warning.line}: {warning.text}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="paper-panel rounded-[2rem] p-5 sm:p-7">
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
                  Final preview
                </p>
                <h2 className="display-face mt-2 text-3xl text-[var(--text-primary)]">
                  Publish only after the validator passes
                </h2>
              </div>
              {validatedPalettes.length ? (
                <button
                  className="studio-button studio-button-primary"
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing || !validatedSourceMarkdown}
                >
                  <ArrowUpRight className="size-4" />
                  {isPublishing ? "Publishing" : "Publish palettes"}
                </button>
              ) : null}
            </div>

            <div className="mt-6 space-y-5">
              {validatedPalettes.length ? (
                validatedPalettes.map((palette) => {
                  const exportId = `builder-export-${palette.order}`;

                  return (
                    <PaletteCard
                      key={`validated-${palette.order}-${palette.name}`}
                      palette={palette}
                      exportId={exportId}
                      eyebrow={`Validated palette ${palette.order}`}
                      footnote="Strict template check passed"
                      actions={
                        <div className="flex flex-wrap gap-3">
                          <CopyButton
                            value={palette.colors.map((color) => color.source).join("\n")}
                            label="Copy values"
                          />
                          <ExportPaletteButtons targetId={exportId} paletteName={palette.name} />
                        </div>
                      }
                    />
                  );
                })
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-[color:var(--border-default)] px-5 py-8 text-sm leading-7 text-[var(--text-secondary)]">
                  The final preview stays empty until the fenced Markdown block passes the strict
                  validator.
                </div>
              )}
            </div>

            {publishError ? (
              <div className="mt-5 rounded-[1.5rem] border border-[color:var(--danger)]/30 bg-[color:var(--surface-primary)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
                {publishError}
              </div>
            ) : null}

            {publishResult ? (
              <div className="mt-5 rounded-[1.8rem] border border-[color:var(--success)]/35 bg-white/75 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 size-5 text-[var(--success)]" />
                  <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
                      Published
                    </p>
                    <p className="text-base text-[var(--text-secondary)]">
                      The gallery now contains {publishResult.palettes.length} public palette
                      {publishResult.palettes.length === 1 ? "" : "s"}.
                    </p>
                    <div className="space-y-3">
                      {shareablePalettes.map((palette) => (
                        <div
                          key={palette.slug}
                          className="flex flex-col gap-3 rounded-[1.4rem] border border-[color:var(--border-default)] bg-white/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <Link
                            href={`/palette/${palette.slug}`}
                            className="inline-flex items-center gap-2 font-semibold text-[var(--text-primary)]"
                          >
                            {palette.name}
                            <ArrowUpRight className="size-4" />
                          </Link>
                          <div className="flex flex-wrap gap-3">
                            <CopyButton value={palette.url} label="Copy share link" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="paper-panel rounded-[2rem] p-5 sm:p-7">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
              Recent public work
            </p>
            <h2 className="display-face mt-2 text-3xl text-[var(--text-primary)]">
              The latest palette cards from the gallery
            </h2>
          </div>
          <Link href="/gallery" className="studio-button studio-button-secondary">
            Open full gallery
          </Link>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {featuredPalettes.length ? (
            featuredPalettes.map((palette) => (
              <PaletteCard
                key={palette.slug}
                palette={palette}
                eyebrow="Public palette"
                href={`/palette/${palette.slug}`}
                footnote="Published and ready to share"
              />
            ))
          ) : (
            <div className="rounded-[1.6rem] border border-dashed border-[color:var(--border-default)] px-5 py-8 text-sm leading-7 text-[var(--text-secondary)]">
              Published palettes appear here after Supabase is configured and the first submission
              is saved.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
