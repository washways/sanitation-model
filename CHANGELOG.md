# Changelog

The version shown in the app's top bar comes from `version` in `package.json`.
When you ship a change: bump that version (patch for fixes, minor for features) and add an entry at the top.
The app reads this file directly, so what is written here is what users see under "What changed".

## v1.7.0 — 2026-11-26
- **New benefit-cost comparison.** Under Inputs → 5. Benefit-Cost, set the cost per person of reaching basic sanitation (urban and rural), its life, programme delivery and upkeep. The results show the upfront investment, the yearly cost, the benefit-cost ratio and the payback period against the yearly losses.
- **The default costs are placeholders, not from a source.** The intended source (Hutton & Varughese 2016, World Bank) couldn't be read automatically. The app warns until you change them, and the PDF only includes the benefit-cost section once real costs are entered.
- With the placeholder costs the ratio is below 1 for most countries, because the loss estimate is deliberately conservative. Treat it as a template to fill with national costs.
- The CSV export includes the benefit-cost inputs and results; changed costs are kept in shared links.

## v1.6.0 — 2026-11-26
A review of the methods from a sanitation economist's point of view. Full details and sources are in ASSUMPTIONS.md.
- **One clear baseline:** the costs are what the country loses because people don't have at least basic sanitation.
- **Country-specific health figures from WHO.** The share of diarrhoea caused by inadequate sanitation, and the deaths it causes, are now WHO's estimates for each country (for example 44% in Malawi) instead of one global figure. Uncertainty ranges use WHO's own intervals.
- **Treatment costs from WHO-CHOICE.** Each country's cost of a health-centre visit and a hospital bed-day (Stenberg et al. 2018) replaces "10% of health spending per person", plus drug costs. For most countries this is lower: about US$1.60 per outpatient case in Malawi instead of about US$4.
- **Deaths valued by age.** Each death is valued at the output lost over the rest of the person's working life, using the age at death (from WHO data). The value of a statistical life (Robinson et al. 2019) is shown alongside, and can be chosen for the total.
- **Stunting and tourism are now shown separately**, like carbon, and can be added back. Large trials found household sanitation did not improve child growth, and there is no published estimate for tourism.
- **Cholera from real case data:** average yearly cases reported to WHO, costed as hospital admissions. Replaces the 0.01% of GDP placeholder.
- **Urban and rural open defecation** are now separate, and time is valued by age (adults at 50% of the wage, children 5–14 at 25%).
- **Exchange rate for the data year.** Local-currency results use the World Bank official rate for the analysis year, not today's rate (Malawi: 1,161 kwacha per US$ instead of about 1,745).
- **New "What drives the estimate" chart** shows which assumptions move the total most, with conservative, central and upper scenarios. It is also in the PDF and CSV.
- **Links carry your changes.** If you change inputs, the address bar updates, so a shared link opens the same scenario.
- The PDF and methodology now explain why results are lower than earlier World Bank studies (which counted water and hygiene too).
- Results change: Malawi goes from US$83m (0.62% of GDP) to US$54m (0.40%), likely range US$42–77m.

## v1.5.0 — 2026-11-25
- **Each country has its own link**, for example washways.org/sanitation-model/kiribati. Opening it goes straight to that country, without the welcome screen. The address bar updates when you pick a country, so you can copy and send it. Link previews (email, WhatsApp, social media) show the country name.
- Names with spaces use hyphens, e.g. /solomon-islands, /dem-rep-congo, /burkina-faso.

## v1.4.0 — 2026-11-25
- **All 44 UN Least Developed Countries are now included.** Added Comoros, Kiribati, Solomon Islands and Tuvalu. Zimbabwe, which is not an LDC, stays in the list. Bangladesh, Lao PDR and Nepal were due to leave the LDC list on 24 November 2026 and are kept.
- **Time lost to open defecation lowered from 30 to 10 minutes per person per day.** The 30 minutes had no source. World Bank sanitation experts put it at 2.5 days a year (about 10 minutes a day), and field studies in India and Ethiopia found 4 to 8 minutes per trip (Radin et al. 2020). Children under 5 are no longer counted, since their time has no wage value. The input is now in minutes.
- Fixed: the cholera response placeholder didn't scale with country size, so it came to 21% of GDP for Tuvalu. It is now 0.01% of GDP, about the same as before for Malawi. It is still a placeholder with no source.
- Results change most where open defecation is common: Niger goes from US$389m (2.3% of GDP) to US$215m (1.3%). Malawi goes from US$88m to US$83m (0.62%).

## v1.3.1 — 2026-11-25
- **Carbon is no longer counted in the total cost.** It had become the largest item for Malawi, which was misleading. Three reasons it doesn't belong in the total: basic pit latrines emit as much methane as unimproved ones (and open defecation emits little), so moving to basic sanitation doesn't remove these emissions; the social cost of carbon is damage to the whole world, not a cost to the country's economy; and it is priced at a global US$100 per tonne while health losses are valued at local incomes.
- The carbon figure is still shown below the cost table and in the PDF, labelled "not in total". It can be added back with "Include carbon in the total" under Inputs → Carbon.
- The country comparison no longer includes carbon.
- Malawi's total goes from US$125m (0.9% of GDP) to US$88m (0.65%); its carbon figure, US$38m, is shown separately.

## v1.3.0 — 2026-11-25
- **Review of every model assumption against current evidence.** The full list, with sources and how solid each one is, is in ASSUMPTIONS.md in the repository.
- **Fixed: diarrhoea was counted as 100% caused by poor sanitation.** When WHO's WASH death data were available, every diarrhoea case and death was treated as caused by sanitation. Now 38% of diarrhoea is attributed to unsafe sanitation alone (WHO 2023: 564,000 of about 1.5 million diarrhoea deaths in 2019). The old 88% fallback was a 2004 figure for water, sanitation and hygiene combined.
- **Fixed: open defecation always showed 5%.** The World Bank indicator code had been retired, so every country fell back to 5%. The app now loads the real figure (for example 2.5% in Malawi, 0% in Bangladesh, 67% in Niger).
- Share of stunting caused by unsafe sanitation lowered from 50% to 16% (Danaei et al. 2016). This is likely an upper bound, since large trials found household WASH did not improve child growth.
- Discount rate lowered from 10% to 5%, the rate recommended for low- and lower-middle-income countries (Haacker et al. 2020).
- The under-5 share of the population is now worked out from each country's birth rate instead of a fixed 15%.
- Source notes now cite their evidence. The cholera response cost is marked as a placeholder with no source.
- Results change: Malawi goes from US$211m (1.6% of GDP) to US$125m (0.9%); Niger rises because its real open-defecation rate is used.

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
