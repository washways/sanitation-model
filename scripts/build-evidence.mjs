// Builds data/countryEvidence.json: country evidence that the browser cannot load directly
// (WHO's API sends no CORS headers) or that only exists in a PDF.
//
//   node scripts/build-evidence.mjs
//
// Sources
// - WHO GHO (ghoapi.azureedge.net), 2019 burden of disease from unsafe WASH (WHO 2023):
//   WSH_10_SAN deaths, WSH_30_SAN DALYs, WSH_20_SAN attributable fraction (diarrhoea, inadequate sanitation).
// - WHO GHO CHOLERA_0000000001 reported cholera cases by year.
// - WHO-CHOICE 2021 technical document (Stenberg et al. 2018 estimates), 2010 international dollars:
//   cost per outpatient visit at a health centre (no beds) and per bed-day at a primary hospital,
//   extracted from the PDF tables into scripts/data/who-choice-2010-intl-dollars.json.
// - World Bank PA.NUS.PPP and PA.NUS.FCRF (2010) to turn international dollars into US$,
//   and SP.POP.TOTL (2019) to turn WHO 2019 counts into rates.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const COUNTRIES = JSON.parse(readFileSync(new URL('../data/countries.json', import.meta.url), 'utf-8'));
const CHOICE = JSON.parse(readFileSync(new URL('./data/who-choice-2010-intl-dollars.json', import.meta.url), 'utf-8'));

const gho = async (indicator, iso3) => {
  const url = `https://ghoapi.azureedge.net/api/${indicator}?%24filter=SpatialDim%20eq%20%27${iso3}%27`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return (await res.json()).value || [];
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`WHO GHO failed: ${indicator} ${iso3}`);
};

const wb = async (iso2, indicator, year) => {
  const url = `https://api.worldbank.org/v2/country/${iso2}/indicator/${indicator}?format=json&date=${year}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data?.[1]?.[0]?.value ?? null;
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
};

const pick = (rows, age) => {
  const row = rows.find((r) => r.Dim1 === 'SEX_BTSX' && r.Dim2 === age && r.TimeDim === 2019);
  return row ? { value: row.NumericValue, low: row.Low, high: row.High } : null;
};

const round = (x, d = 3) => (x === null || x === undefined ? null : Number(x.toFixed(d)));
const perCapita = (v, pop) => (v ? { value: v.value / pop, low: v.low / pop, high: v.high / pop } : null);

const out = {
  generated: new Date().toISOString().slice(0, 10),
  notes: 'Built by scripts/build-evidence.mjs. Rates are per person per year (2019 WHO counts divided by 2019 World Bank population).',
  countries: {},
};

for (const c of COUNTRIES) {
  const [deaths, dalys, paf, cholera, pop2019, ppp2010, fx2010] = await Promise.all([
    gho('WSH_10_SAN', c.iso3),
    gho('WSH_30_SAN', c.iso3),
    gho('WSH_20_SAN', c.iso3),
    gho('CHOLERA_0000000001', c.iso3),
    wb(c.code, 'SP.POP.TOTL', 2019),
    wb(c.code, 'PA.NUS.PPP', 2010),
    wb(c.code, 'PA.NUS.FCRF', 2010),
  ]);
  // Price level ratio = PPP factor (LCU per I$) ÷ market exchange rate (LCU per US$). The World Bank's
  // ready-made ratio (PA.NUS.PPPC.RF) has been archived.
  const plr2010 = ppp2010 && fx2010 ? ppp2010 / fx2010 : null;

  const entry = {};
  const d = pick(deaths, 'AGEGROUP_YEARSALL');
  const dU5 = pick(deaths, 'AGEGROUP_YEARSUNDER5');
  const y = pick(dalys, 'AGEGROUP_YEARSALL');
  const yU5 = pick(dalys, 'AGEGROUP_YEARSUNDER5');
  const f = pick(paf, 'AGEGROUP_YEARSALL');
  if (d && pop2019) {
    const r = (v) => v && { value: round(v.value, 9), low: round(v.low, 9), high: round(v.high, 9) };
    entry.whoSanitation = {
      year: 2019,
      deathsPerPerson: r(perCapita(d, pop2019)),
      deathsUnder5PerPerson: r(perCapita(dU5, pop2019)),
      dalysPerPerson: r(perCapita(y, pop2019)),
      dalysUnder5PerPerson: r(perCapita(yU5, pop2019)),
      attributableFraction: f ? { value: round(f.value), low: round(f.low), high: round(f.high) } : null,
      deaths2019: Math.round(d.value),
      deathsUnder5_2019: dU5 ? Math.round(dU5.value) : null,
    };
  }

  const reported = cholera
    .map((r) => ({ year: r.TimeDim, cases: r.NumericValue ?? Number.parseFloat(String(r.Value).replace(/\s/g, '')) }))
    .filter((r) => Number.isFinite(r.cases))
    .sort((a, b) => b.year - a.year);
  if (reported.length) {
    const last10 = reported.slice(0, 10);
    entry.cholera = {
      averageCases: Math.round(last10.reduce((s, r) => s + r.cases, 0) / last10.length),
      yearsReported: last10.length,
      firstYear: last10[last10.length - 1].year,
      lastYear: last10[0].year,
    };
  } else {
    entry.cholera = { averageCases: 0, yearsReported: 0, firstYear: null, lastYear: null };
  }

  const choice = CHOICE[c.iso3];
  if (choice?.opd?.pred && choice?.bed?.pred) {
    entry.whoChoice = { _choice: choice, _plr: plr2010 };
  }

  out.countries[c.code] = entry;
  console.log(c.code, entry.whoSanitation ? 'WHO ok' : 'no WHO', entry.cholera.averageCases, entry.whoChoice ? 'CHOICE ok' : 'no CHOICE');
}

// Price levels outside 0.15–1.5 come from official exchange rates far from market rates (Myanmar's fixed 2010 rate)
// or mixed currencies (Liberia). Those countries get the median price level of the others.
const PLR_MIN = 0.15;
const PLR_MAX = 1.5;
const valid = Object.values(out.countries)
  .map((e) => e.whoChoice?._plr)
  .filter((p) => p && p >= PLR_MIN && p <= PLR_MAX)
  .sort((a, b) => a - b);
const medianPlr = valid[Math.floor(valid.length / 2)];
for (const [code, e] of Object.entries(out.countries)) {
  if (!e.whoChoice) continue;
  const { _choice: choice, _plr: raw } = e.whoChoice;
  const ok = raw && raw >= PLR_MIN && raw <= PLR_MAX;
  const plr = ok ? raw : medianPlr;
  const usd = (v) => ({ value: round(v.pred * plr, 2), low: round(v.low * plr, 2), high: round(v.high * plr, 2) });
  e.whoChoice = {
    priceLevelRatio2010: round(plr, 4),
    priceLevelEstimated: !ok,
    outpatientVisitUSD2010: usd(choice.opd),
    bedDayUSD2010: usd(choice.bed),
  };
  if (!ok) console.log(`${code}: 2010 price level ${raw === null ? 'missing' : raw.toFixed(3)} is implausible; using the median ${medianPlr.toFixed(3)}`);
}

mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../data/countryEvidence.json', import.meta.url), JSON.stringify(out, null, 1));
