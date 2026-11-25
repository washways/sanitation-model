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

## Model assumptions (reviewed 2026-11-25, v1.3.0)
- `ASSUMPTIONS.md` lists every default with its source and a strength rating. Keep it in step with `utils/estimators.ts` and the source-badge notes when changing a default.
- Diarrhoea deaths inputs are ALL diarrhoea deaths; `attributionToSanitation` (default 0.38, WHO 2023 sanitation-only) is applied to both cases and deaths. Never set it to 1.0 because WASH data exist: SDG 3.9.2 is water+sanitation+hygiene and four diseases.
- Stunting attribution 0.16 (Danaei 2016), discount rate 5% (Haacker 2020).
- World Bank codes go stale: SH.STA.ODEF.ZS was retired (use SH.STA.ODFC.ZS); diarrhoea prevalence (SH.STA.DIAR/DIRH) is archived. When adding an indicator, curl `api.worldbank.org/v2/country/MW/indicator/<code>?format=json` first. Treat 0 as a valid value, not as missing.
- `scratch/`-style check: load `services/worldBank.ts`, `utils/estimators.ts` and `utils/calculations.ts` through Vite `ssrLoadModule` to print per-country cost breakdowns.

## PDF export (`components/PDFExport.tsx`, @react-pdf/renderer)
- Set `lineHeight` on every text style; inherited lineHeight makes large text overlap.
- Use `Helvetica-Bold` as the bold font (fontWeight alone doesn't switch the face).
- Fixed footer must be absolutely positioned `<Text fixed>`; a fixed `<View>` footer and `render` page-number props did not draw.
- Check output by rendering with Vite SSR from a script (load the modules with `server.ssrLoadModule`, then `renderToFile`) and reading the PDF back.

## Code notes
- `components/SplashScreen.tsx`: card capped at `100dvh`, body scrolls, Launch button lives in a pinned footer so it is always visible. Enter/Escape also dismiss. Don't move the button back into the scrolling content.
- The shared WASHways analytics script injects a fixed consent banner (no id/class) at the bottom of the page. `utils/useBottomOverlayInset.ts` measures it and sets `--bottom-inset` on `<html>`; the splash, the mobile cost bar and the inputs panel pad by it. Use `var(--bottom-inset,0px)` for anything new pinned to the bottom.
- To check layouts at phone/tablet sizes when Chrome can't be resized, load the app in same-origin iframes of fixed width (media queries follow the iframe width).
- Data source badges (`SourceBadge` in `components/InputPanel.tsx`) take a `DataSourceInfo` object (`types.ts`), never a plain string.
