// Bilingual Unit Conversion Reference Tables (4 Pages)
// Compile from repository root:
//   typst compile --root . --input lang=es pdf-src/table.typ public/pdf/conversions-es.pdf
//   typst compile --root . --input lang=en pdf-src/table.typ public/pdf/conversions-en.pdf

#let lang = sys.inputs.at("lang", default: "en")
#let active-lang = if lang == "es" { "es" } else { "en" }

#let units-data = json("../data/units.json")
#let prefixes-data = json("../data/prefixes.json")
#let translations-data = json("../data/translations.json")

#let t-ui = translations-data.at(active-lang)
#let t-pdf = t-ui.pdf

#let ink-black = rgb("#111214")
#let ink-muted = rgb("#52555c")
#let rule-line = rgb("#d4d4d8")
#let header-fill = rgb("#111214")
#let header-text = rgb("#ffffff")
#let stripe-fill = rgb("#f4f4f5")

#let font-serif = ("Georgia", "Liberation Serif", "DejaVu Serif", "Noto Serif")
#let font-sans = ("Liberation Sans", "DejaVu Sans", "Noto Sans")

#set document(title: t-pdf.docTitle)

#set page(
  paper: "a4",
  margin: (x: 11mm, y: 10mm),
  footer: context [
    #set text(font: font-sans, size: 7.5pt, fill: ink-muted)
    #grid(
      columns: (1fr, auto),
      t-pdf.footerNote,
      counter(page).display("1 / 1", both: true),
    )
  ],
)

#set text(font: font-sans, size: 7.7pt, fill: ink-black)

#let prefix-exp(sym) = {
  if sym == none or sym == "" { 0 } else {
    prefixes-data.find(p => p.symbol == sym).exponent
  }
}

#let linear-factor(unit-id, prefix: none, exp: 1) = {
  let u = units-data.units.at(unit-id)
  let p = calc.pow(10.0, prefix-exp(prefix))
  calc.pow(float(p * u.factor), exp)
}

#let cap-first(s) = {
  let chars = s.clusters()
  if chars.len() == 0 { s } else { upper(chars.at(0)) + chars.slice(1).join() }
}

#let format-matrix-val(val) = {
  if calc.abs(val - 1) < 1e-12 {
    return [1]
  }
  let a = calc.abs(val)
  let raw-exp = calc.floor(calc.log(base: 10, a) + 1e-12)
  let scaled = a / calc.pow(10.0, raw-exp)
  let mantissa = calc.round(scaled, digits: 5)
  let exp = raw-exp
  if mantissa >= 10 {
    mantissa = calc.round(mantissa / 10.0, digits: 5)
    exp += 1
  }

  if (exp >= 5 or exp <= -4) and calc.abs(mantissa - 1) < 1e-5 {
    return $10^(#exp)$
  }

  if exp >= 5 or exp <= -4 {
    return $#str(mantissa) times 10^(#exp)$
  }

  let dec-digits = calc.max(0, 5 - exp)
  let rounded = calc.round(val, digits: dec-digits)
  [#str(rounded)]
}

#let format-prefix-decimal(exp) = {
  if exp == 0 { return "1" }
  if exp > 0 {
    let zeros = range(exp).map(_ => "0").join()
    let raw-str = "1" + zeros
    let chars = raw-str.clusters().rev()
    let grouped = ()
    for (i, ch) in chars.enumerate() {
      if i > 0 and calc.rem(i, 3) == 0 { grouped.push(" ") }
      grouped.push(ch)
    }
    return grouped.rev().join()
  }
  let zeros = range(calc.abs(exp) - 1).map(_ => "0").join()
  let frac = zeros + "1"
  let grouped = ()
  for (i, ch) in frac.clusters().enumerate() {
    if i > 0 and calc.rem(i, 3) == 0 { grouped.push(" ") }
    grouped.push(ch)
  }
  "0." + grouped.join()
}

#let conversion-matrix(title, entries, first-col: 1.55fr, inset-y: 2.9pt) = block(breakable: false, width: 100%)[
  #text(font: font-serif, size: 10pt, weight: "bold", fill: ink-black, title)
  #v(0.16em)
  #table(
    columns: (first-col, ..range(entries.len()).map(_ => 1fr)),
    inset: (x: 3.2pt, y: inset-y),
    stroke: 0.45pt + rule-line,
    align: (col, _) => if col == 0 { left + horizon } else { center + horizon },
    fill: (_, row) => if row == 0 { header-fill } else if calc.even(row) { stripe-fill } else { none },
    table.header(
      text(fill: header-text, weight: "bold", size: 7.1pt)[#t-pdf.sourceUnitCol],
      ..entries.map(e => text(fill: header-text, weight: "bold", size: 7.1pt)[#e.sym]),
    ),
    ..entries.map(src => (
      text(weight: "bold", size: 7.1pt)[#src.label],
      ..entries.map(dst => {
        let ratio = src.factor / dst.factor
        text(size: 6.9pt)[#format-matrix-val(ratio)]
      }),
    )).flatten()
  )
]

#let make-entry(unit-id, prefix: none, exp: 1, sym-override: none, label-override: none) = {
  let u = units-data.units.at(unit-id)
  let p-sym = if prefix == none { "" } else { prefix }
  let exp-sym = if exp == 2 { "²" } else if exp == 3 { "³" } else { "" }
  let sym = if sym-override != none { sym-override } else { p-sym + u.symbol + exp-sym }
  let p-name = if prefix == none { "" } else { prefixes-data.find(p => p.symbol == prefix).name.at(active-lang) }
  let u-name = u.name.at(active-lang)
  let base-label = if label-override != none {
    label-override
  } else if prefix == none {
    u-name
  } else {
    p-name + u-name
  }
  (
    sym: sym,
    label: cap-first(base-label),
    factor: linear-factor(unit-id, prefix: prefix, exp: exp),
  )
}

// ============================================================================
// PAGE 1: Length, Area, Volume, Mass, Temperature
// ============================================================================

#align(center)[
  #text(font: font-serif, size: 14.5pt, weight: "bold", fill: ink-black)[#t-pdf.mainTitle]
  #v(0.1em)
  #text(size: 8.2pt, fill: ink-muted)[#t-pdf.subtitle]
]

#v(0.35em)

#let length-entries = (
  make-entry("m", prefix: "m", label-override: if active-lang == "es" { "milímetro" } else { "millimetre" }),
  make-entry("m", prefix: "c", label-override: if active-lang == "es" { "centímetro" } else { "centimetre" }),
  make-entry("m"),
  make-entry("m", prefix: "k", label-override: if active-lang == "es" { "kilómetro" } else { "kilometre" }),
  make-entry("in"),
  make-entry("ft"),
  make-entry("yd"),
  make-entry("mi"),
)

#let area-entries = (
  make-entry("m", prefix: "m", exp: 2, label-override: if active-lang == "es" { "milímetro²" } else { "square mm" }),
  make-entry("m", prefix: "c", exp: 2, label-override: if active-lang == "es" { "centímetro²" } else { "square cm" }),
  make-entry("m", exp: 2, label-override: if active-lang == "es" { "metro²" } else { "square m" }),
  make-entry("m", prefix: "h", exp: 2, sym-override: "hm² (ha)", label-override: if active-lang == "es" { "hectómetro² (ha)" } else { "hectare (hm²)" }),
  make-entry("m", prefix: "k", exp: 2, label-override: if active-lang == "es" { "kilómetro²" } else { "square km" }),
  make-entry("in", exp: 2, label-override: if active-lang == "es" { "pulgada²" } else { "square in" }),
  make-entry("ft", exp: 2, label-override: if active-lang == "es" { "pie²" } else { "square ft" }),
  make-entry("acre"),
)

#let volume-entries = (
  make-entry("m", prefix: "c", exp: 3, sym-override: "cm³ (mL)", label-override: if active-lang == "es" { "centímetro³ (mL)" } else { "cubic cm (mL)" }),
  make-entry("L", sym-override: "L (dm³)", label-override: if active-lang == "es" { "litro (dm³)" } else { "litre (dm³)" }),
  make-entry("m", exp: 3, label-override: if active-lang == "es" { "metro³" } else { "cubic m" }),
  make-entry("in", exp: 3, label-override: if active-lang == "es" { "pulgada³" } else { "cubic in" }),
  make-entry("ft", exp: 3, label-override: if active-lang == "es" { "pie³" } else { "cubic ft" }),
  make-entry("gal", sym-override: "US gal"),
)

#let mass-entries = (
  make-entry("g", prefix: "m"),
  make-entry("g"),
  make-entry("g", prefix: "k"),
  make-entry("t"),
  make-entry("oz"),
  make-entry("lb"),
  make-entry("slug"),
)

#conversion-matrix(t-pdf.secLength, length-entries, inset-y: 2.7pt)
#v(0.38em)
#conversion-matrix(t-pdf.secArea, area-entries, inset-y: 2.7pt)
#v(0.38em)
#conversion-matrix(t-pdf.secVolume, volume-entries, inset-y: 2.7pt)
#v(0.38em)
#conversion-matrix(t-pdf.secMass, mass-entries, inset-y: 2.7pt)
#v(0.38em)

#block(breakable: false, width: 100%)[
  #text(font: font-serif, size: 10pt, weight: "bold", fill: ink-black)[#t-pdf.secTemperature]
  #v(0.16em)
  #table(
    columns: (1fr, 1fr, 1fr),
    inset: 3.6pt,
    stroke: 0.45pt + rule-line,
    fill: (_, row) => if row == 0 { header-fill } else { none },
    table.header(
      text(fill: header-text, weight: "bold", size: 7.1pt)[Celsius → Kelvin],
      text(fill: header-text, weight: "bold", size: 7.1pt)[Fahrenheit → Kelvin],
      text(fill: header-text, weight: "bold", size: 7.1pt)[Celsius ↔ Fahrenheit],
    ),
    [$T("K") = t(degree "C") + 273.15$],
    [$T("K") = frac(5, 9)(t(degree "F") + 459.67)$],
    [$t(degree "F") = frac(9, 5) t(degree "C") + 32$],
  )
]

#v(0.3em)
#text(size: 7.1pt, fill: ink-muted)[#t-pdf.readNote]

// ============================================================================
// PAGE 2: Speed, Acceleration, Density, Force, Pressure, Power
// ============================================================================
#pagebreak()

#let speed-entries = (
  make-entry("m/s"),
  make-entry("km/h"),
  make-entry("cm/s"),
  make-entry("ft/s"),
  make-entry("mi/h"),
  make-entry("kn"),
)

#let accel-entries = (
  make-entry("m/s2"),
  make-entry("cm/s2"),
  make-entry("mm/min2"),
  make-entry("km/h2"),
  make-entry("ft/s2"),
  make-entry("g0"),
)

#let density-entries = (
  make-entry("kg/m3"),
  make-entry("g/cm3", sym-override: "g/cm³ (kg/L)", label-override: "Gram/cm³ (kg/L)"),
  make-entry("g/L"),
  make-entry("mg/L"),
  make-entry("lb/ft3"),
  make-entry("lb/in3"),
)

#let density-entries-es = (
  make-entry("kg/m3"),
  make-entry("g/cm3", sym-override: "g/cm³ (kg/L)", label-override: "Gramo/cm³ (kg/L)"),
  make-entry("g/L"),
  make-entry("mg/L"),
  make-entry("lb/ft3"),
  make-entry("lb/in3"),
)

#let force-entries = (
  make-entry("N"),
  make-entry("N", prefix: "k"),
  make-entry("dyn"),
  make-entry("kgf"),
  make-entry("lbf"),
)

#let pressure-entries = (
  make-entry("Pa"),
  make-entry("Pa", prefix: "k"),
  make-entry("bar"),
  make-entry("atm"),
  make-entry("Torr"),
  make-entry("psi"),
  make-entry("kgf/cm2"),
)

#let power-entries = (
  make-entry("W"),
  make-entry("W", prefix: "k"),
  make-entry("hp"),
  make-entry("CV"),
)

#conversion-matrix(t-pdf.secSpeed, speed-entries, inset-y: 2.7pt)
#v(0.35em)
#conversion-matrix(t-pdf.secAcceleration, accel-entries, inset-y: 2.7pt)
#v(0.35em)
#conversion-matrix(t-pdf.secDensity, if active-lang == "es" { density-entries-es } else { density-entries }, inset-y: 2.7pt)
#v(0.35em)
#conversion-matrix(t-pdf.secForce, force-entries, inset-y: 2.7pt)
#v(0.35em)
#conversion-matrix(t-pdf.secPressure, pressure-entries, inset-y: 2.7pt)
#v(0.35em)
#conversion-matrix(t-pdf.secPower, power-entries, inset-y: 2.7pt)

// ============================================================================
// PAGE 3: Energy, Time & Calendar, Digital Storage, Additional Equivalences
// ============================================================================
#pagebreak()

#let energy-entries = (
  make-entry("J"),
  make-entry("J", prefix: "k"),
  make-entry("cal"),
  make-entry("cal", prefix: "k", label-override: if active-lang == "es" { "kilocaloría (termoq.)" } else { "kilocalorie (thermochem.)" }),
  make-entry("Wh", prefix: "k"),
  make-entry("eV"),
)

#let time-entries = (
  make-entry("s"),
  make-entry("min"),
  make-entry("h"),
  make-entry("d"),
  make-entry("month", label-override: if active-lang == "es" { "mes (30 d)" } else { "month (30 d)" }),
  make-entry("year", label-override: if active-lang == "es" { "año (365 d)" } else { "year (365 d)" }),
  make-entry("a_j", sym-override: "a_j", label-override: if active-lang == "es" { "año juliano (365.25 d)" } else { "Julian year (365.25 d)" }),
)

#let data-entries = (
  make-entry("bit"),
  make-entry("B"),
  make-entry("kB", sym-override: "kB (10³)", label-override: "Kilobyte (10³)"),
  make-entry("KiB", sym-override: "KiB (2¹⁰)", label-override: "Kibibyte (2¹⁰)"),
  make-entry("MB", sym-override: "MB (10⁶)", label-override: "Megabyte (10⁶)"),
  make-entry("MiB", sym-override: "MiB (2²⁰)", label-override: "Mebibyte (2²⁰)"),
  make-entry("GB", sym-override: "GB (10⁹)", label-override: "Gigabyte (10⁹)"),
  make-entry("GiB", sym-override: "GiB (2³⁰)", label-override: "Gibibyte (2³⁰)"),
)

#conversion-matrix(t-pdf.secEnergy, energy-entries, inset-y: 2.9pt)
#v(0.45em)
#conversion-matrix(t-pdf.secTime, time-entries, first-col: 1.7fr, inset-y: 2.9pt)
#v(0.18em)
#text(size: 7.1pt, fill: ink-muted)[#t-pdf.timeNote]
#v(0.45em)
#conversion-matrix(t-pdf.secData, data-entries, first-col: 1.45fr, inset-y: 2.9pt)
#v(0.45em)

#block(breakable: false, width: 100%)[
  #text(font: font-serif, size: 10pt, weight: "bold", fill: ink-black)[#t-pdf.secOther]
  #v(0.16em)
  #let other-rows = (
    (t-ui.quantities.angle, $1 "rev" = 360 degree = 2 pi "rad"$, $1 degree = frac(pi, 180) "rad" approx 0.0174533 "rad"$),
    (t-ui.quantities.frequency, $1 "Hz" = 1 "s"^(-1) = 60 "rpm"$, $1 "rpm" = frac(1, 60) "Hz" approx 0.0166667 "Hz"$),
    (t-ui.quantities.flow_rate, $1 "m"^3"/s" = 1000 "L/s" = 3600 "m"^3"/h"$, $1 "US gal/min" approx 6.30902 times 10^(-5) "m"^3"/s"$),
    (t-ui.quantities.area_density, $1 "g/cm"^2 = 10 "kg/m"^2 = 1 "mg/mm"^2$, $1 "cg/cm"^2 = 0.1 "kg/m"^2 = 100 "g/m"^2$),
    (t-ui.quantities.momentum, $1 "kg" dot "m/s" = 10^5 "g" dot "cm/s"$, $1 "kg" dot "m/min" = frac(1, 60) "kg" dot "m/s"$),
  )
  #table(
    columns: (1.5fr, 1.5fr, 1.7fr),
    inset: (x: 4.5pt, y: 3.3pt),
    stroke: 0.45pt + rule-line,
    fill: (_, row) => if row == 0 { header-fill } else if calc.even(row) { stripe-fill } else { none },
    table.header(
      text(fill: header-text, weight: "bold", size: 7.1pt)[#t-pdf.colQuantity],
      text(fill: header-text, weight: "bold", size: 7.1pt)[#t-pdf.colConversion],
      text(fill: header-text, weight: "bold", size: 7.1pt)[#t-pdf.colConversion],
    ),
    ..other-rows.flatten()
  )
]

// ============================================================================
// PAGE 4: International System (SI) Prefixes (Standalone Closing Sheet)
// ============================================================================
#pagebreak()

#block(breakable: false, width: 100%)[
  #align(center)[
    #text(font: font-serif, size: 14pt, weight: "bold", fill: ink-black)[#t-pdf.secPrefixes]
    #v(0.15em)
    #text(size: 8.4pt, fill: ink-muted)[#t-pdf.prefixesSubtitle]
  ]
  #v(0.45em)

  #let upper-prefixes = prefixes-data.filter(p => p.exponent > 0).sorted(key: p => -p.exponent)
  #let lower-prefixes = prefixes-data.filter(p => p.exponent < 0).sorted(key: p => -p.exponent)

  #table(
    columns: (1fr, 0.65fr, 0.85fr, 2.2fr),
    inset: (x: 5pt, y: 4.1pt),
    stroke: 0.45pt + rule-line,
    align: (col, _) => if col == 0 { left } else if col == 3 { right } else { center },
    fill: (_, row) => if row == 0 { header-fill } else if calc.even(row) { stripe-fill } else { none },
    table.header(
      text(fill: header-text, weight: "bold", size: 7.4pt)[#t-ui.theory.colPrefix],
      text(fill: header-text, weight: "bold", size: 7.4pt)[#t-pdf.colSymbol],
      text(fill: header-text, weight: "bold", size: 7.4pt)[#t-pdf.colFactor],
      text(fill: header-text, weight: "bold", size: 7.4pt)[#t-pdf.colDecimal],
    ),
    ..upper-prefixes.map(p => (
      p.name.at(active-lang),
      p.symbol,
      $10^(#p.exponent)$,
      format-prefix-decimal(p.exponent),
    )).flatten(),
    t-pdf.noPrefixLabel, "—", $1$, "1",
    ..lower-prefixes.map(p => (
      p.name.at(active-lang),
      p.symbol,
      $10^(#p.exponent)$,
      format-prefix-decimal(p.exponent),
    )).flatten(),
  )

  #v(0.45em)
  #text(size: 7.6pt, fill: ink-muted)[#t-pdf.prefixesNote]
]
