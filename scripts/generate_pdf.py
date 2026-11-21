"""Compile Spanish and English conversion reference PDFs from pdf-src/table.typ."""

from pathlib import Path
import typst

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "pdf-src" / "table.typ"
OUTPUT_DIR = ROOT / "public" / "pdf"

OUTPUT_FILES = {
    "es": "Tabla-de-Conversiones-Kilopico.pdf",
    "en": "Unit-Conversion-Reference-Kilopico.pdf",
}


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for lang, filename in OUTPUT_FILES.items():
        output_path = OUTPUT_DIR / filename
        typst.compile(
            str(TEMPLATE),
            output=str(output_path),
            root=str(ROOT),
            sys_inputs={"lang": lang},
        )
        print(f"Generated {output_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
