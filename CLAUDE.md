# Sanitation Impact Modeler — notes for Claude

React 19 + Vite 6 + TypeScript single-page app. Tailwind v3 is compiled at build time (`tailwind.config.js`, `postcss.config.js`, `index.css`) — do NOT re-add the Tailwind CDN script, it was the main cause of slow loads. Avoid dynamic class names (`bg-${x}`) since the compiler can't see them.
Repo: github.com/washways/sanitation-model. Work directly on `main`; keep local aligned with `origin/main`.

## Build / check
- `npm ci`, `npm run build`, type check with `npx tsc --noEmit -p .` (the build does NOT type-check — always run tsc too).
- Node is at `C:\Users\jrobertson\Repositories\node-v25.8.1-win-x64` and on PATH for the Bash tool.
- If `npm ci` fails on esbuild's postinstall ("'node' is not recognized"), use `npm ci --ignore-scripts`.
- Large-chunk warning from Vite (PDFExport ~1.5 MB, @react-pdf/renderer) is known and harmless.

## Deploy
- Site is served from the `gh-pages` branch (`npm run deploy` → `gh-pages -d dist`). Other commits to `main` are also pushed by an external "Manager" tool (SEO, analytics, social preview, licence) — always `git fetch` / rebase before pushing.
- There is no GitHub Actions deploy workflow (one was proposed locally and discarded).

## Git push gotcha
- GitHub rejects pushes containing a private email (GH007). Commit with the noreply address:
  `git -c user.email=18412410+washways@users.noreply.github.com -c user.name=washways commit ...`

## Versioning and changelog (required for every shipped change)
- Version lives in `package.json` `version` and is shown in the top bar (injected as `__APP_VERSION__` by `vite.config.ts`).
- `CHANGELOG.md` is the single source for the in-app "What changed" dialog (`components/ChangelogDialog.tsx` parses `## vX.Y.Z — date` headings and `- ` bullets). Bump the version (patch = fix, minor = feature) and add a plain-language entry at the top with each change.

## Style
- Matches the WASHways app family (apps.washways.org/waterpointplanner): navy `#263238` top bar with underline tabs, teal `#0B6E80` primary, page `#EEF1F2`, flat white cards with `border-line` (`#DDE2E4`), no shadows, Hanken Grotesk font. Tokens are in `tailwind.config.js`.
- User dislikes "AI-looking" styling: no coloured left-border stripes, pastel tinted cards, gradients or decorative blobs.

## Performance notes
- Recharts views (`CostChart`, `MonteCarloPanel`, `ComparisonView`) are `React.lazy` in `App.tsx` and preloaded while the splash shows. PDF export is a dynamic import.
- Monte Carlo (`utils/monteCarlo.ts`) copies inputs per section (no JSON clone) and `MonteCarloPanel` debounces input changes by 250 ms. Keep both.

## Data year (decided by the user 2026-11-25)
- `services/worldBank.ts` `CORE_KEYS`: the analysis year is the latest year where all six core annual indicators have data. Sparse survey/modelled series must NOT set the year (they dragged Malawi back to 2019). `explainYear()` builds the `YearExplanation` shown by `components/YearNotice.tsx`, the PDF and the CSV.
- The World Bank API sometimes returns an HTML error page under load; those series come back empty and the notice says so.

## Model assumptions (reviewed 2026-11-26, v1.6.0; decisions by the user)
- `ASSUMPTIONS.md` lists every default with its source and a strength rating. Keep it in step with `utils/estimators.ts` and the source-badge notes when changing a default.
- Counterfactual: everyone has at least basic sanitation. Headline total = health care, days lost, deaths, access time, cholera+funerals. Stunting, tourism and carbon are "shown separately" (`nutrition.includeInTotal`, `other.includeTourismInTotal`, `carbon.includeInTotal`, all false). `costsUSD` holds 0 for excluded ones; `allCostsUSD` always has values. Use `costEntries()` / `excludedEntries()` from `utils/calculations.ts`.
- Health uses WHO country estimates from `data/countryEvidence.json` (WSH_10_SAN deaths, WSH_20_SAN attributable fraction, WSH_30_SAN DALYs, cholera cases, WHO-CHOICE unit costs). WHO's API has no CORS, so the browser can't fetch it: refresh with `node scripts/build-evidence.mjs`. WHO-CHOICE values were extracted from WHO's 2021 PDF into `scripts/data/who-choice-2010-intl-dollars.json` (I$ 2010, converted with PA.NUS.PPP ÷ PA.NUS.FCRF for 2010; PA.NUS.PPPC.RF is archived).
- Deaths inputs are ALL diarrhoea deaths (= WHO sanitation deaths ÷ sanitation share); `attributionToSanitation` is applied to cases, deaths and cholera. Never set it to 1.0.
- Deaths: human capital by age at death (headline; under-5 at age 1, over-5 age ≈ 92 − WHO DALYs per death) and VSL (Robinson 2019: max(20×, 160 × US × ratio^1.5)) are both always computed; `mortalityMethod` picks the one in the total.
- Time value: adults 50%, children 5–14 25%, under-5 0 (Radin 2020). OD time 10 min/day urban and rural; fields show minutes, store hours.
- Uncertainty: `inputs.ranges` (low/high multiples) drive Monte Carlo (triangular draws), the tornado (`utils/uncertainty.ts`, `components/SensitivityPanel.tsx`) and scenarios. WHO / WHO-CHOICE intervals override `DEFAULT_RANGES`.
- Exchange rate: World Bank official rate (PA.NUS.FCRF) for the analysis year; today's rate only if missing or >10× off (redenominated currencies: Zimbabwe, Somalia).
- Changed inputs are written to the URL query (`utils/scenarioUrl.ts`) and applied on first load only.
- Benefit-cost (v1.7.0, `utils/benefitCost.ts`, `components/BenefitCostPanel.tsx`, `inputs.investment`): since v1.7.1 unit costs come from Hutton & Varughese 2016 (World Bank WSP), table E.1, per country, in `data/sanitationUnitCosts.json` (US$ 2015, hardware + software; urban septic tank / urban pit / rural pour-flush / rural dry pit). The World Bank OKR page is empty and blocks automated downloads; the PDF copy used is at fsmtoolbox.com (link in `SANITATION_COSTING`, `constants.ts`). `estimateInvestment()` in `utils/estimators.ts` applies the study's 50/50 technology mix (table D.1) and life / capital maintenance / operating assumptions (table D.2), inflated with the US GDP deflator since 2015 (`usDeflatorSince2015`). Programme delivery defaults to 0 because software is already in the unit costs.
- Since v1.8.0 people with an unimproved latrine are costed for a slab upgrade (`LATRINE_UPGRADE`, Peletz et al. 2017) instead of a new latrine. Shares come from the JMP service ladder in `data/sanitationLadder.json` (limited / unimproved / open defecation, urban and rural, 2015–2024), extracted from JMP_2025_WLD.xlsx (sheet `san`, columns san_basal/lim/unimp/ns_u/r) downloaded from washdata.org/data/household. The World Bank and WHO APIs don't carry the limited/unimproved split. Refresh by downloading the new world file and re-extracting.
- Global Comparison has a benefit-cost ratio chart (`components/BenefitCostComparison.tsx`), core vs with VSL + stunting, with a table view.
- Country list lives in `data/countries.json` (code, iso3, name, currency) = all 44 UN LDCs + Zimbabwe. Anything per country must scale with population (the old flat cholera rule broke for Tuvalu).
- World Bank codes go stale: SH.STA.ODEF.ZS was retired (use SH.STA.ODFC.ZS); diarrhoea prevalence (SH.STA.DIAR/DIRH) is archived. When adding an indicator, curl `api.worldbank.org/v2/country/MW/indicator/<code>?format=json` first. Treat 0 as a valid value, not as missing.
- `scratch/`-style check: load `services/worldBank.ts`, `utils/estimators.ts` and `utils/calculations.ts` through Vite `ssrLoadModule` to print per-country cost breakdowns. For the PDF, import `react` and `@react-pdf/renderer` normally (not via ssrLoadModule, which fails on CommonJS react).
- Python with pypdf is at `C:/Users/jrobertson/AppData/Local/Python/bin/python.exe` (no project venv); use it to extract PDF text.

## PDF export (`components/PDFExport.tsx`, @react-pdf/renderer)
- Set `lineHeight` on every text style; inherited lineHeight makes large text overlap.
- Use `Helvetica-Bold` as the bold font (fontWeight alone doesn't switch the face).
- Fixed footer must be absolutely positioned `<Text fixed>`; a fixed `<View>` footer and `render` page-number props did not draw.
- Check output by rendering with Vite SSR from a script (load the modules with `server.ssrLoadModule`, then `renderToFile`) and reading the PDF back.

## Country links (v1.5.0)
- `/sanitation-model/<slug>` opens a country and skips the splash; slugs come from the country name (`utils/countryRoute.ts`, e.g. `dem-rep-congo`). The two-letter code also works via `404.html`.
- GitHub Pages has no routing, so the `country-pages` plugin in `vite.config.ts` writes `dist/<slug>/index.html` per country (own title, canonical, og:url) plus `404.html`. Renaming a country changes its link.
- Selecting a country calls `history.replaceState` to the country path; the root URL is left alone on first load.

## Code notes
- `components/SplashScreen.tsx`: card capped at `100dvh`, body scrolls, Launch button lives in a pinned footer so it is always visible. Enter/Escape also dismiss. Don't move the button back into the scrolling content.
- The shared WASHways analytics script injects a fixed consent banner (no id/class) at the bottom of the page. `utils/useBottomOverlayInset.ts` measures it and sets `--bottom-inset` on `<html>`; the splash, the mobile cost bar and the inputs panel pad by it. Use `var(--bottom-inset,0px)` for anything new pinned to the bottom.
- To check layouts at phone/tablet sizes when Chrome can't be resized, load the app in same-origin iframes of fixed width (media queries follow the iframe width).
- Data source badges (`SourceBadge` in `components/InputPanel.tsx`) take a `DataSourceInfo` object (`types.ts`), never a plain string.
