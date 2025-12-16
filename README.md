# Sanitation Impact Modeler
**An interactive economic modeling engine that quantifies the financial burden of poor sanitation—built for fast, transparent, scenario-based advocacy and planning.**

This repository contains a browser-based model that translates sanitation conditions into **monetized impacts** (e.g., health system costs, productivity losses, mortality valuation, child development losses, time costs, and climate externalities). The goal is to make sanitation legible in the language that budget holders use: **economic loss and avoided cost**.

---

## Table of contents
1. [Project overview](#project-overview)
2. [What the model produces](#what-the-model-produces)
3. [Economic methodology](#economic-methodology)
4. [How it works](#how-it-works)
5. [Technical architecture](#technical-architecture)
6. [Repository structure](#repository-structure)
7. [How to use](#how-to-use)
8. [Assumptions, uncertainty, and guardrails](#assumptions-uncertainty-and-guardrails)
9. [Installation & development](#installation--development)
10. [Deployment](#deployment)
11. [Roadmap: future improvements](#roadmap-future-improvements)
12. [Contributing](#contributing)
13. [License](#license)

---

## Project overview

### The problem
Poor sanitation is often treated as a health or dignity issue. That’s true, but it misses the lever that moves large-scale investment: **economic loss**.

Finance ministries, planning commissions, and development banks tend to ask:
- How much GDP is lost each year due to inadequate sanitation?
- What fraction of national income does the burden represent?
- What is the return on investing in sanitation, and how robust are the results?

### The solution
Sanitation Impact Modeler is a web-based tool that:
1. Builds a baseline for a country (or custom scenario), using macro indicators where possible.
2. Calculates economic costs across multiple domains (healthcare, productivity, mortality, stunting/human capital, access time, climate).
3. Visualizes the burden as **absolute value** and **% of GDP**.
4. Supports scenario testing (baseline vs improved sanitation) and can optionally quantify uncertainty (e.g., P5–P95 via Monte Carlo) where parameters are uncertain.

The tool is intended for:
- advocacy briefs and policy notes
- investment cases
- program design trade-offs
- sensitivity and “what matters most?” conversations

---

## What the model produces

Typical outputs:
- **Total annual economic burden** of poor sanitation (currency units and/or USD)
- **Burden as % of GDP**
- **Net present value (NPV)** over a time horizon (optional)
- Domain breakdowns (annual and/or NPV):
  - 🏥 Health care costs
  - 📉 Productivity losses
  - ⚰️ Premature mortality valuation (HCA or VSL)
  - 📏 Stunting / lifetime earnings loss (child development)
  - ⏱️ Access time opportunity cost
  - 🌍 Climate impact (GHG → CO₂e → carbon cost)
- Scenario comparison:
  - **Avoided costs / benefits** from improved sanitation
  - Differences by domain (what drives the result)
- Uncertainty (optional):
  - P5 / P50 / P95 estimates for totals and key domains
  - probability distribution plots
  - sensitivity/tornado charts

---

## Economic methodology

This tool uses a pragmatic “bottom-up” impact-costing approach consistent with widely used **economics of sanitation** logic (cost-of-illness + human capital). The core principle is:

> **Total economic cost = sum of monetized impacts across key domains**, with explicit assumptions.

The model is modular. Each domain is calculated independently, then aggregated. This makes it easier to:
- toggle modules on/off (conservative vs comprehensive framing)
- test sensitivity by domain
- add new modules without breaking existing ones

### 1) 🏥 Health care costs
**Logic:** The cost to the health system and households for treating sanitation-related diseases (often diarrhoeal disease as the core proxy).

**Typical formula (illustrative):**
- `(Total cases × sanitation-attributable fraction) × treatment seeking rate × weighted unit cost`

**Key parameters:**
- incidence or case counts
- attributable fraction (share linked to poor sanitation)
- treatment seeking rate (or service utilization)
- inpatient/outpatient mix and unit costs

### 2) 📉 Productivity loss
**Logic:** Economic value of time lost due to illness (work days lost by adults and/or caregivers).

**Typical formula (illustrative):**
- `Attributable cases × days lost per case × daily wage proxy × labor substitution factor`

A substitution factor (often ~0.5 in ESI-style approaches) is used to avoid overstating productivity losses where labor substitution is plausible.

### 3) ⚰️ Premature mortality
Two valuation options are supported conceptually (and should be implemented as a toggle):

**A) Human Capital Approach (HCA)**
- Values a death as discounted future economic output.
- Conservative; aligns with output-based public finance framing.

**B) Value of Statistical Life (VSL)**
- Values mortality risk reduction using willingness-to-pay logic.
- Often dramatically higher than HCA; better captures intrinsic value but can be politically and methodologically contentious.

### 4) 📏 Stunting / child development (human capital)
**Logic:** Poor sanitation contributes to enteric infections and environmental enteropathy, increasing stunting risk. Stunting reduces lifetime earnings.

**Typical approach:**
- Estimate the affected cohort (children at key age thresholds)
- Apply attributable fraction and earnings penalty
- Discount future income losses to present value

This module is high-impact and needs strong transparency: small changes in assumptions can drive large changes in results.

### 5) ⏱️ Access time opportunity cost
**Logic:** Time spent walking to find a private place for open defecation (or reaching sanitation facilities) has an economic value.

**Typical formula (illustrative):**
- `Affected population × trips per day × minutes per trip × value of time proxy`

Conservative practice is to value time at a fraction of wage (e.g., 30%) unless stronger evidence exists.

### 6) 🌍 Climate impact (GHG)
**Logic:** Unmanaged excreta and certain sanitation pathways emit methane (CH₄) and other GHGs.

**Typical approach:**
- Emissions factors by sanitation pathway (pit latrines, unmanaged waste, FSM lifecycle if included)
- Convert CH₄ to CO₂e (GWP)
- Value CO₂e using a carbon price or social cost of carbon

The climate module should clearly state:
- which emission factors are used
- what system boundary is included (direct only vs lifecycle)
- what carbon price/SCC and year is applied

---

## How it works

The application is structured around three layers:

### 1) Inputs layer (UI + defaults)
Users define:
- country (or custom inputs)
- analysis year / time horizon
- discount rate
- sanitation baseline and improvement scenario (coverage/ladder shift/adoption curve)
- mortality valuation method (HCA vs VSL)
- optional: climate factors, wage/value-of-time assumptions
- optional: module toggles (health only vs full economic burden)

Defaults and parameter presets should live in `constants.ts`.

### 2) Data layer (`services/`)
Where external indicators are fetched (if enabled), such as:
- population, GDP, GDP per capita
- other macro proxies used for valuation

This layer should:
- normalize units and handle missing data
- cache where useful
- fail gracefully and fall back to defaults

### 3) Calculation layer (`utils/`)
This is the modeling engine. It should be:
- pure functions (deterministic)
- unit-consistent
- testable

Common utilities:
- discounting and NPV helpers
- adoption curve helpers (linear / logistic)
- conversion helpers (per-capita ↔ totals)
- domain module calculators
- aggregation and formatting helpers
- uncertainty engine (if implemented)

### 4) Outputs layer (`components/`)
UI components render:
- totals and breakdowns
- scenario deltas
- uncertainty intervals/distributions (if enabled)
- exports (CSV/JSON/PDF if enabled)

---

## Technical architecture

This is designed as a **serverless single-page application (SPA)** that runs entirely in the browser:
- low operational overhead
- simple static deployment
- privacy-friendly: inputs stay client-side unless you add persistence

Core stack (typical for this repo layout):
- **React + TypeScript**
- **Vite** build tooling

Optional/recommended additions:
- charting library for breakdowns and distributions
- PDF export for a 1–2 page policy brief (client-side)
- scenario saving via `localStorage` (or lightweight backend if needed)
- PWA support for offline use

---

## How to use

### Mode 1: Single-country analysis
1. **Select a country** (or choose custom inputs).
2. **Adjust parameters:**
   - **Macro:** analysis year, discount rate, wage/value-of-time assumptions
   - **Mortality method:** HCA vs VSL
   - **Sanitation scenario:** baseline and target improvements
   - **Climate settings (if enabled):** emissions factors + carbon price
3. **Review results:**
   - total burden and % GDP
   - domain breakdown chart/table
4. **Export (optional):**
   - CSV/JSON for analysis
   - PDF brief for policy sharing

### Mode 2: Global comparison (optional feature)
If a comparison tab exists:
1. Run a batch analysis across supported countries.
2. View ranked results (e.g., highest burden as % GDP).
3. Export the comparison table for dashboards or briefs.

---

## Assumptions, uncertainty, and guardrails

### Assumptions must be explicit
This tool is only credible if assumptions are transparent. Recommended:
- show each parameter’s source, year, unit, and rationale
- provide conservative/central/aggressive presets
- document what is and isn’t included to prevent “model creep”

### Avoid double counting
Domain overlaps are real (e.g., productivity vs mortality vs stunting human capital). Recommended guardrails:
- clear module definitions and boundaries
- module toggles
- “conservative mode” preset that excludes high-uncertainty modules by default

### Uncertainty (recommended)
If you model uncertainty:
- treat key inputs as distributions (triangular/log-normal/etc.)
- compute P5/P50/P95
- show the distribution and sensitivity drivers

### Validation checks (recommended)
- clamp inputs to plausible ranges (e.g., coverage 0–100)
- warn on extreme outputs (e.g., burden > X% GDP)
- unit tests for discounting and aggregation logic

---

## Installation & development


# Clone
git clone https://github.com/washways/sanitation-model.git
cd sanitation-model

# Install dependencies
npm install

# Run locally
npm run dev

# Build production
npm run build

# Preview production build
npm run preview


## Deployment

This is a static Vite build:

- `npm run build` produces `dist/`
- Host `dist/` on:
  - GitHub Pages
  - Cloudflare Pages
  - Netlify
  - Vercel
  - S3 + CDN

Recommended production hygiene:
- Add CI to run `npm ci`, `npm run build`, and tests (if present) on every PR
- Add a `metadata.json` (or similar) to expose app version/build date in the UI

---

## Roadmap: future improvements

### 1) Credibility upgrades (highest priority)
- Parameter citations in-app (source + year + link per variable)
- Assumptions panel with conservative/central/aggressive presets
- Sensitivity analysis (tornado chart) for top drivers
- Scenario saving and comparison (baseline vs intervention vs alternatives)

### 2) Methodology enhancements
- Groundwater contamination: add a module for water treatment/cleanup costs due to latrine leaching (high relevance, tricky evidence)
- School attendance & MHM: quantify attendance losses and long-term earnings impacts (requires careful assumptions)
- Property/land value impacts: optional module (high uncertainty, context-dependent)

### 3) Better epidemiology (only if defensible)
- Sanitation ladder → risk reduction functions for diarrhoea (with citations)
- Age stratification (under-5 vs all ages)
- Expand beyond diarrhoea cautiously (attribution evidence varies)

### 4) Better economics
- Wage proxy options (GDPpc, GNIpc, min wage, user-defined)
- Real vs nominal analysis, inflation handling
- Formal/informal labor shares affecting substitution factors

### 5) Climate module upgrades
- Explicit sanitation pathway selection (pit/septic/sewer/FSM)
- Lifecycle emissions (emptying, transport, treatment)
- Carbon price series selection (or SCC scenarios)

### 6) Data granularity and planning
- Sub-national modeling via CSV upload (district results + mapping)
- Choropleth map outputs for hotspots
- Intervention ROI module:
  - user enters capex/opex
  - model outputs BCR, NPV, payback, cost per outcome

### 7) Engineering improvements
- Extract a standalone `engine/` (pure typed functions) to reuse in other apps
- Add unit tests + CI
- Add offline support (PWA)
- Add robust exports (CSV/JSON and a policy-brief PDF)

---

## Contributing

Keep the codebase easy to extend:
- Put all math in `utils/` as pure, typed functions
- Keep data fetching in `services/`
- Keep UI components simple and typed (`components/`)
- Centralize assumptions in `constants.ts`
- Add tests for any new domain module

Recommended docs to add:
- `DATA_SOURCES.md` (indicators, sources, transformations, licensing notes)
- `CHANGELOG.md` (track changes to assumptions and outputs)

---

## License

This project is dual-licensed under **MIT** or **Apache-2.0** (your choice).

### MIT License (SPDX: MIT)

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### Apache License 2.0 (SPDX: Apache-2.0)

Copyright (c) 2025

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at:

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
