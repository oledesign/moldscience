# Translation review

Machine-assisted translations produced in-house. **A native reviewer should
confirm both files before this goes to production.** Nothing here is a
regulated safety document: the SDS/GHS PDFs are the client's own supplied
files and were not touched.

## Conventions applied
- Brand and product names left untranslated: MoldScience, Mold Science
  Technologies, OmniPro On & Gone, OmniPro Gone 4 Good, Spore Lock.
- Document titles keep their `(EN)` / `(FR)` marker so a reader knows which
  language the PDF itself is in.
- The three French SDS descriptions already present in the English source are
  left in French in every locale — they describe French-language documents.
- FR is Canadian French (`courriel`, `soumission`, `pi²`, `main-d'œuvre`).
- ES is neutral North American Spanish (`moho`, `contratista`, `mano de obra`,
  `pies²`), avoiding Iberian-only vocabulary.

## Files
- `i18n/en.json` — source of truth, do not edit by hand
- `i18n/fr.json` — Canadian French
- `i18n/es.json` — North American Spanish

## How to revise
Edit the value only, never the key. Keys are shared across pages, so fixing a
string once fixes it everywhere. Three values contain inline `<span>` markup —
keep the tags intact and translate only the words around them.

## Status
- `fr.json`: 243 strings, complete — NEEDS NATIVE REVIEW
- `es.json`: 243 strings, complete — NEEDS NATIVE REVIEW
