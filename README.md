# Kilopico — Bilingual SI & Imperial Unit Converter

[![Deploy to GitHub Pages](https://github.com/maanfitow/kilopico/actions/workflows/deploy.yml/badge.svg)](https://github.com/maanfitow/kilopico/actions/workflows/deploy.yml)
[![Live Site](https://img.shields.io/badge/Live_Demo-GitHub_Pages-2ea44f?logo=githubpages&logoColor=white)](https://maanfitow.github.io/kilopico/)
[![Latest Release](https://img.shields.io/github/v/release/maanfitow/kilopico?color=1f6feb&label=PDF%20Release)](https://github.com/maanfitow/kilopico/releases/latest)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![React Router](https://img.shields.io/badge/React_Router-v6-CA4245?logo=reactrouter&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-Design_Tokens-1572B6?logo=css3&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?logo=vitest&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm&logoColor=white)
![Typst](https://img.shields.io/badge/Typst-Reference_PDFs-239DAD?logo=typst&logoColor=white)

A static, mobile-first, bilingual (**English / Spanish**) physics and everyday unit converter built with **React**, **Vite**, and a **zero-dependency JavaScript conversion engine**. It covers **22 quantities**, **110 base units**, and **24 SI prefixes** through a unified, searchable interface—engineered for instant client-side execution, offline resilience once loaded, and reproducible scientific documentation.

---

## Features

- **Unified Converter (22 Quantities, 110 Units, 24 SI Prefixes)**: Searchable quantity combobox with keyboard navigation, unit alias matching (English and Spanish abbreviations), bidirectional unit swap, and configurable significant-digit precision (`1`–`15`, default `6`).
- **Transparent Derivation & Source Attribution**: Every conversion displays whether the factor is **Exact** or **Approximate**, the step-by-step unit breakdown, and the underlying metrological reference.
- **Dark-Default Theme with Manual Toggle**: High-contrast dark instrument palette by default paired with a persistent dark/light theme switcher (`localStorage`), system font stack, `tabular-nums` alignment, and `prefers-reduced-motion` support.
- **Automatic Bilingual i18n (`ES` / `EN`)**: Resolves initial locale from saved preference, IANA time zone matching (`data/spanish-countries.json`), or browser languages, alongside an always-accessible header toggle.
- **Theory & Reference PDFs**: Built-in SI prefix and dimensional theory view plus downloadable bilingual **Typst** reference sheets (`Tabla-de-Conversiones-Kilopico.pdf` and `Unit-Conversion-Reference-Kilopico.pdf`) hosted via GitHub Releases.

---

## Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **UI Framework** | React 19 + React Router (`HashRouter`) | Client-side views (`Calculator`, lazy-loaded `Theory` and `Downloads`) |
| **Build Tool** | Vite 6 + `@vitejs/plugin-react` | Fast HMR dev server and optimized `< 100 KB` gzipped JS bundle |
| **Domain Engine** | Plain JavaScript (ES Modules) | Zero-dependency conversion, formatting, and locale logic (`src/lib/`) |
| **Styling** | Vanilla CSS3 (Custom Properties) | 3-layer token architecture, responsive CSS Grid/Flexbox, no CSS frameworks |
| **Testing** | Vitest 3 (`node` environment) | 52 unit and data-integrity tests across 5 test suites |
| **Typesetting** | Typst (`typst` CLI / Python wrapper) | Generates printable ES/EN reference PDFs directly from `data/*.json` |
| **Package Manager & CI** | pnpm 11 + GitHub Actions | Frozen-lockfile CI test/build pipeline and GitHub Pages deployment |

---

## Covered Quantities (22)

- **Mechanics & Motion**: Length, Mass, Time, Speed, Acceleration, Force, Momentum, Pressure, Energy, Power
- **Geometry & Matter**: Area, Volume, Density, Area Density, Flow Rate, Plane Angle
- **Thermodynamics & Waves**: Temperature, Frequency
- **SI Base Extensions & Computing**: Electric Current, Amount of Substance, Luminous Intensity, Data Storage

---

## Project Structure

```text
kilopico/
├── .github/workflows/deploy.yml   # GitHub Actions CI (test, build, Pages deploy)
├── data/                          # Single source of truth (shared by app & Typst)
│   ├── prefixes.json              # 24 SI prefixes (names, symbols, exponents)
│   ├── sources.json               # Bibliographic & standards registry
│   ├── spanish-countries.json     # IANA time zones for ES locale detection
│   ├── translations.json          # Bilingual ES/EN UI dictionary
│   └── units.json                 # 22 quantities & 110 linear/non-powered units
├── pdf-src/
│   └── table.typ                  # Typst source for bilingual PDF reference sheets
├── scripts/
│   ├── generate_pdf.py            # Python helper invoking Typst for ES & EN PDFs
│   └── update_pdfs.sh             # Compiles PDFs & publishes assets to GitHub Releases
├── src/
│   ├── components/                # React UI (Header, Calculator, Theory, Downloads, etc.)
│   ├── i18n/I18nContext.jsx       # Client-side translation & locale state
│   ├── lib/                       # Pure domain logic + Vitest test suites (*.test.js)
│   ├── styles/styles.css          # Theme tokens, instrument UI & responsive breakpoints
│   ├── config.js                  # Project constants, storage keys & release base URL
│   ├── App.jsx                    # HashRouter layout & lazy route splitting
│   └── main.jsx                   # Application entry point
├── package.json
├── pnpm-lock.yaml
└── vite.config.js
```

---

## Architecture & Data Integrity

- **Pure Domain Engine (`src/lib/`)**: Plain ES modules with zero React or DOM dependencies (`converter.js`, `expression.js`, `format.js`, `language.js`). Portable to Node, Deno, or other frontends without modification.
- **Single Source of Truth (`data/*.json`)**: No conversion factor is hard-coded in application logic. `data/units.json` stores linear base units (`m`, `ft`, etc.) and true non-powered units (`acre`, `L`, `gal`); derived area and volume units (`cm²`, `dm³`) are computed via `(prefix_factor * unit_factor)^exponent` to prevent prefix-scaling errors.
- **Data Provenance & Verification**: Every unit in `data/units.json` references a record in `data/sources.json` (BIPM SI Brochure 9th ed., NIST SP 811, NIST Handbook 44 Appendix C, NIST CODATA, the 1959 International Yard and Pound Agreement, or explicit classroom calendar conventions). Sources whose exact table or page locations have not yet been manually confirmed remain marked `"verified": false` with `"location": null`.
- **Experimental Compound Expression Parser (Omitted from v1 UI)**: The repository includes an experimental compound unit expression parser (`src/lib/expression.js`, `convertCompound` in `src/lib/converter.js`, and tests in `src/lib/expression.test.js`). Because it does not yet support parentheses or space-separated multiplication, it is intentionally omitted from the v1 web UI while all 22 quantities are handled through the unified selector.

---

## Local Development

```bash
pnpm install
pnpm test
pnpm run dev
```

To build and preview the production bundle (`dist/`):

```bash
pnpm run build
pnpm run preview
```

---

## Generating Reference PDFs (Typst)

`pdf-src/table.typ` can be compiled directly with the Typst CLI or via the Python build script:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/generate_pdf.py
```

This outputs gitignored PDFs locally into `public/pdf/`:
- `public/pdf/Tabla-de-Conversiones-Kilopico.pdf`
- `public/pdf/Unit-Conversion-Reference-Kilopico.pdf`

Alternatively, compile directly with the Typst CLI or generate and upload both assets to a GitHub Release in one step with `./scripts/update_pdfs.sh --release <tag>`:

```bash
typst compile --root . --input lang=es pdf-src/table.typ public/pdf/Tabla-de-Conversiones-Kilopico.pdf
typst compile --root . --input lang=en pdf-src/table.typ public/pdf/Unit-Conversion-Reference-Kilopico.pdf
```

The Downloads page serves both PDFs from the latest GitHub Release (`/releases/latest/download/...`) so binary assets stay out of Git history and new release tags can reuse the same filenames cleanly.

---

## Deployment (GitHub Pages)

1. Push changes to the `main` branch.
2. In the GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` runs `pnpm install --frozen-lockfile`, `pnpm test`, and `pnpm run build`, then publishes `dist/` via `actions/deploy-pages`.
