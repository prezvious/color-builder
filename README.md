# Color Builder

Color Builder is a palette-cleanup website for people who already have a messy list of colors and want to turn it into something consistent, previewable, and easier to work with.

The main idea is simple: paste your raw palette text, let the site turn it into the expected Markdown structure, then paste that fenced Markdown block back into the validator. Once the block passes, you get clean palette previews, share pages, and downloadable image cards.

## What Changed

This version is built around a much stricter workflow than a generic color preview tool.

- Raw text can contain multiple palettes in one paste.
- The site extracts supported color values and groups them by palette.
- It generates a canonical Markdown block for you to copy.
- You must paste that fenced block back into the final validator before anything can be published.
- Every accepted palette gets a polished visual card and export buttons for `PNG` and `JPG`.
- There is a public gallery view plus individual share pages for each saved palette.

The most important rule in the app is the validation gate. If the final text does not match the required structure, the app stops the workflow and shows:

`Your text does not match the template; please correct it.`

That check is intentional and strict.

## How It Works

1. Paste your raw text in the builder.
2. Generate the canonical Markdown block.
3. Copy the generated block.
4. Paste that fenced block into the final validation field.
5. Preview the cleaned palettes.
6. Publish or export once the validator accepts the content.

Supported color formats in the raw parser:

- `HEX`
- `RGB / RGBA`
- `HSL / HSLA`

## Running It Offline

You can use the builder locally without putting it online first.

1. Install dependencies:

```bash
npm install
```

2. Start the local dev server:

```bash
npm run dev
```

3. Open `http://localhost:3000`

Offline/local use is best for:

- testing the raw parser
- generating the Markdown template
- checking the strict validator
- previewing palette cards
- exporting `PNG` and `JPG` files

If you only want to use the text-to-template workflow on your own machine, that local setup is enough.

## Handy Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Project Notes

- The interface is designed as a light editorial-style “swatch studio,” not a plain dashboard.
- The parser is forgiving at the raw-input stage, but the final Markdown validator is intentionally strict.
- The public gallery and palette pages are built from the same normalized palette data that powers the preview cards.
