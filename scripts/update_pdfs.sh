#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ES_PDF="public/pdf/Tabla-de-Conversiones-Kilopico.pdf"
EN_PDF="public/pdf/Unit-Conversion-Reference-Kilopico.pdf"

mkdir -p public/pdf

if command -v typst >/dev/null 2>&1; then
  typst compile --root . --input lang=es pdf-src/table.typ "$ES_PDF"
  typst compile --root . --input lang=en pdf-src/table.typ "$EN_PDF"
elif [[ -x ".venv/bin/python" ]]; then
  .venv/bin/python scripts/generate_pdf.py
else
  echo "Error: neither 'typst' CLI nor '.venv/bin/python' was found." >&2
  exit 1
fi

echo "Generated $ES_PDF and $EN_PDF."

if [[ "${1:-}" == "--release" ]]; then
  TAG="${2:-}"
  if [[ -z "$TAG" ]]; then
    echo "Usage: ./scripts/update_pdfs.sh --release <tag>" >&2
    exit 1
  fi
  if gh release view "$TAG" >/dev/null 2>&1; then
    gh release upload "$TAG" "$ES_PDF" "$EN_PDF" --clobber
  else
    gh release create "$TAG" "$ES_PDF" "$EN_PDF" --title "Reference Sheets $TAG" --notes "Bilingual Typst-generated conversion reference sheets."
  fi
fi
