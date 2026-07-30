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

## Legal pages are intentionally English-only

`privacy.html` and `terms.html` carry no `data-i18n` keys on their body text.
The runtime falls back to whatever is in the HTML when a key is missing, so
those pages stay English in every locale.

This is deliberate: machine-translated legal text creates liability rather than
value. Only the two footer link labels are translated.

If a French version is needed — and for consumer-facing content in Quebec it
may be a legal requirement, not a nicety — have it prepared by a translator
working from the approved English text, then add `fr-CA` copies of the pages
rather than keys.
