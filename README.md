# Kilopico — Bilingual SI & Imperial Unit Converter

A static, mobile-first, bilingual (English / Spanish) physics and everyday unit converter built with React, Vite, and a zero-dependency JavaScript conversion engine. It provides a single unified converter covering 19 physics and everyday quantities (from length, mass, time, and temperature to speed, power, pressure, density, data storage, flow rate, and momentum) with a searchable quantity selector. Designed for instant client-side execution, offline resilience once loaded, and deterministic GitHub Pages deployment.

## Architecture

- **Pure Domain Engine (`src/lib/`)**: Plain ES modules with zero React or DOM dependencies (`converter.js`, `expression.js`, `format.js`, `language.js`). Portable to Node, Deno, or other frontends without modification.
- **Single Source of Truth (`data/*.json`)**: All conversion factors, SI prefixes, bibliographic citations, IANA time zones, and UI strings are stored in `data/` and shared between the web application and the Typst PDF generator.
- **Client-Side Internationalization (`src/i18n/`)**: Automatically detects Spanish-speaking regions from stored preferences, IANA time zone matching (`data/spanish-countries.json`), or browser languages, while keeping an explicit ES/EN switcher visible at all times.
- **Typst Reference Sheets (`pdf-src/table.typ`)**: Expresses conversion formulas in Typst math syntax and reads `data/*.json` directly to produce printable Spanish and English PDF reference sheets.

## Experimental Compound Expression Parser (Omitted from v1 UI)

The repository includes an experimental compound unit expression parser (`src/lib/expression.js`, `convertCompound` in `src/lib/converter.js`, and its unit tests in `src/lib/expression.test.js`). This parser is incomplete—for example, it does not support parentheses or space-separated multiplication—so it is intentionally omitted from the v1 web UI while all 19 quantities are handled through the unified selector.

## Data Provenance & Verification

No conversion factor is hard-coded in application logic. Every unit in `data/units.json` references a record in `data/sources.json` (BIPM SI Brochure 9th ed., NIST SP 811, NIST Handbook 44 Appendix C, NIST CODATA, the 1959 International Yard and Pound Agreement, or explicit classroom calendar conventions). Sources whose exact table/page locations have not yet been manually opened and confirmed remain marked `"verified": false` with `"location": null`.

## Local Development

```bash
pnpm install
pnpm test
pnpm run dev
```

To build the production bundle into `dist/`:

```bash
pnpm run build
pnpm run preview
```

## Generating Reference PDFs (Typst)

The Typst source in `pdf-src/table.typ` can be rendered using your own Typst installation or via the Python build script:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/generate_pdf.py
```

This outputs gitignored PDFs locally into `public/pdf/`:
- `public/pdf/Tabla-de-Conversiones-Kilopico.pdf`
- `public/pdf/Unit-Conversion-Reference-Kilopico.pdf`

If you prefer compiling directly with the Typst CLI from the repository root, or compiling and publishing to a GitHub Release in one step via `./scripts/update_pdfs.sh --release <tag>`:

```bash
typst compile --root . --input lang=es pdf-src/table.typ public/pdf/Tabla-de-Conversiones-Kilopico.pdf
typst compile --root . --input lang=en pdf-src/table.typ public/pdf/Unit-Conversion-Reference-Kilopico.pdf
```

The Downloads view serves both PDFs from the latest GitHub Release (`/releases/latest/download/...`) so binary assets stay out of Git history. New release tags can reuse the exact same asset filenames without conflicts.

## Deployment (GitHub Pages)

1. Push to the `main` branch.
2. In the GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` runs `pnpm install --frozen-lockfile`, `pnpm test`, and `pnpm run build`, then publishes `dist/` via `actions/deploy-pages`.
