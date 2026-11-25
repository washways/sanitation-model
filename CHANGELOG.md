# Changelog

The version shown in the app's top bar comes from `version` in `package.json`.
When you ship a change: bump that version (patch for fixes, minor for features) and add an entry at the top.
The app reads this file directly, so what is written here is what users see under "What changed".

## v1.2.0 — 2026-11-25
- **New rule for the data year.** It is now the latest year with World Bank data for six core annual indicators: population, GDP per capita, health spending per person, under-5 mortality, birth rate and basic sanitation coverage. Before, any single indicator could hold the whole analysis back. Malawi was stuck at 2019 because deaths from unsafe WASH only have a 2019 figure; it now uses 2023. Results change for most countries.
- Survey-based and irregular inputs (stunting, diarrhoea, open defecation, deaths from unsafe WASH, tourism) use their most recent value up to the data year and are listed as "older or missing".
- The app explains the data year in plain language, says which indicator limits it, and shows each core indicator's latest year. It also warns if World Bank data failed to load.
- Redesigned advocacy PDF in the WASHways style. Nothing runs off the page any more, amounts read as "US$211 million", it shows all eight cost categories with bars, a likely range, the data-year explanation and the key inputs with sources.
- The CSV export now includes the data-year explanation.

## v1.1.1 — 2026-11-24
- The splash screen and the mobile cost bar now move up out of the way of the cookie notice, so the Launch button is never hidden behind it.
- More compact splash screen that fits on a laptop screen without scrolling, on a light background so the card stands out.
- Tidier top bar on phones and tablets: buttons show icons only on smaller screens, so the bar takes less space.

## v1.1.0 — 2026-11-24
- New look in line with the other WASHways tools: dark top bar, teal buttons, flat cards and the Hanken Grotesk font.
- Removed the coloured highlight stripes and tints from cards.
- Faster: styles are now built ahead of time instead of being generated in the browser on every page load.
- Faster: the splash screen appears straight away; charts load in the background.
- Faster: the uncertainty (Monte Carlo) simulation runs about ten times quicker and waits until you stop typing before re-running, so inputs no longer lag.
- Added a version number and this changelog ("What changed" in the top bar).

## v1.0.2 — 2026-11-13
- Uses the shared WASHways analytics script with a consent banner, and completes the SEO tags.

## v1.0.1 — 2026-11-12
- The splash screen's Launch button is always visible, however small the screen. Enter or Escape also close it.
- Fixed the source notes under the carbon inputs, which showed up blank.

## v1.0.0 — 2026-03-13
- Indicator years are aligned to one analysis year, with fallbacks shown on each input's source badge.
- Added CSV and advocacy PDF exports.
- Added Zimbabwe.

## v0.1.0 — 2025-12-04
- First release: single-country analysis, global comparison and PDF export.
