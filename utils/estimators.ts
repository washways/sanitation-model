import { DEFAULT_RANGES, EMISSION_PRESETS } from '../constants';
import { CountryApiData, DataSourceInfo, DataSourceMap, ModelInputs, UncertaintyRanges } from '../types';
import EVIDENCE from '../data/countryEvidence.json';

type RawFieldKey = keyof CountryApiData['fields'];

const DEFAULT_ANALYSIS_YEAR = 2023;

/**
 * Evidence behind the default assumptions. ASSUMPTIONS.md gives the full reasoning and sources.
 *
 * Country health figures come from data/countryEvidence.json (scripts/build-evidence.mjs): WHO's 2019 estimates of
 * diarrhoea deaths, DALYs and the attributable fraction for inadequate sanitation (WHO 2023; Wolf et al. 2023),
 * WHO cholera case reports, and WHO-CHOICE unit costs (Stenberg et al. 2018).
 *
 * Global figures, used when a country has no WHO estimate (WHO 2023):
 * - 1.4 million deaths attributable to unsafe WASH in 2019, of which 1,035,000 are diarrhoea deaths.
 * - 69% of all diarrhoea deaths are attributable to unsafe WASH combined (water + sanitation + hygiene).
 * - 564,000 diarrhoea deaths are attributable to unsafe sanitation on its own.
 * - 273,000 WASH-attributable diarrhoea deaths are in children under 5.
 */
const WASH_DEATHS_DIARRHOEA_SHARE = 1035 / 1400;
const WASH_DIARRHOEA_PAF = 0.69;
const TOTAL_DIARRHOEA_DEATHS_2019 = 1035 / WASH_DIARRHOEA_PAF; // thousand, about 1.5 million
export const SANITATION_DIARRHOEA_PAF = Math.round((564 / TOTAL_DIARRHOEA_DEATHS_2019) * 100) / 100; // 0.38
const UNDER5_SHARE_OF_DIARRHOEA_DEATHS = 273 / 1035; // about 0.26
// Danaei et al. (2016) PLOS Med 13:e1002164: 7.2 of 44.1 million stunting cases attributable to unimproved sanitation.
export const SANITATION_STUNTING_PAF = Math.round((7.2 / 44.1) * 100) / 100; // 0.16
// Haacker, Hallett & Atun (2020) Health Policy Plan: at least 5% for low- and lower-middle-income countries.
export const DEFAULT_DISCOUNT_RATE = 0.05;
// Extra time per person per day for open defecation vs a home latrine: about 10 minutes
// (Hickling & Hutton 2014, 2.5 days/year; Radin et al. 2020, 4–12 min per visit).
export const OD_HOURS_PER_DAY = 10 / 60;
// WHO's standard life table for years of life lost has a life expectancy at birth of about 92.
const STANDARD_LIFE_EXPECTANCY = 92;
// Drugs and supplies, not included in WHO-CHOICE unit costs (approximate).
const DRUGS_OUTPATIENT_USD = 0.5; // oral rehydration salts + 10-day zinc course
const DRUGS_INPATIENT_USD = 3; // IV fluids, ORS, zinc, antibiotics when needed
const DAYS_PER_ADMISSION = 3;
const CHOLERA_DAYS_LOST = 4;
// Fallback for the VSL transfer if the US series fails to load (US GDP per person, 2023, World Bank).
const US_GDP_PER_CAPITA_FALLBACK = 82769;

interface Interval { value: number; low: number; high: number }
interface CountryEvidence {
  whoSanitation?: {
    year: number;
    deathsPerPerson: Interval;
    deathsUnder5PerPerson: Interval | null;
    dalysPerPerson: Interval | null;
    dalysUnder5PerPerson: Interval | null;
    attributableFraction: Interval | null;
  };
  cholera?: { averageCases: number; yearsReported: number; firstYear: number | null; lastYear: number | null };
  whoChoice?: { outpatientVisitUSD2010: Interval; bedDayUSD2010: Interval; priceLevelEstimated?: boolean };
}
const EVIDENCE_BY_COUNTRY = (EVIDENCE as { countries: Record<string, CountryEvidence> }).countries;

const getField = (rawData: CountryApiData | null | undefined, key: RawFieldKey) => rawData?.fields[key];
const has = (v: number | null | undefined): v is number => v !== null && v !== undefined && Number.isFinite(v);
const round = (x: number, d = 3) => Number.parseFloat(x.toFixed(d));
const ratioRange = (i: Interval, basis: string) =>
  ({ low: round(i.low / i.value, 3), high: round(i.high / i.value, 3), basis });

const withTone = (source: DataSourceInfo, overrides: Partial<DataSourceInfo> = {}): DataSourceInfo => ({
  ...source,
  ...overrides,
});

const derivedFrom = (
  source: DataSourceInfo | undefined,
  label: string,
  notes: string,
  tone: DataSourceInfo['tone'] = source?.fallbackUsed ? 'warning' : 'neutral'
): DataSourceInfo => ({
  label,
  kind: 'derived',
  sourceName: source?.sourceName || 'Model derivation',
  indicatorCode: source?.indicatorCode,
  requestedYear: source?.requestedYear,
  actualYear: source?.actualYear,
  fallbackUsed: source?.fallbackUsed,
  fallbackDirection: source?.fallbackDirection,
  tone,
  notes,
  link: source?.link,
});

const estimateSource = (label: string, notes: string): DataSourceInfo => ({
  label,
  kind: 'estimate',
  sourceName: 'Model estimate',
  tone: 'warning',
  notes,
});

const assumptionSource = (label: string, notes: string): DataSourceInfo => ({
  label,
  kind: 'assumption',
  sourceName: 'Model assumption',
  tone: 'neutral',
  notes,
});

const whoSource = (label: string, notes: string, link = 'https://www.who.int/data/gho/data/themes/topics/wash'): DataSourceInfo => ({
  label,
  kind: 'api',
  sourceName: 'WHO Global Health Observatory',
  requestedYear: 2019,
  actualYear: 2019,
  tone: 'success',
  notes,
  link,
});

/**
 * Estimates the model inputs for a country from World Bank data and the WHO evidence snapshot.
 */
export const estimateInputs = (
  rawData: CountryApiData | null | undefined,
  isoCode: string,
  currencyCode: string
): { inputs: ModelInputs; sources: DataSourceMap } => {
  const sources: DataSourceMap = {};
  const ranges: UncertaintyRanges = { ...DEFAULT_RANGES };
  const evidence: CountryEvidence = EVIDENCE_BY_COUNTRY[isoCode] || {};
  const analysisYear = rawData?.analysisYear || DEFAULT_ANALYSIS_YEAR;

  // --- Macro ---
  const gdpField = getField(rawData, 'gdpPerCapita');
  const gdpPerCapita = gdpField?.value || 1000;
  sources.gdpPerCapita = gdpField?.value
    ? withTone(gdpField.source)
    : estimateSource('Default GDP estimate', 'World Bank GDP per capita was unavailable, so a conservative USD 1,000 fallback was used.');

  const exchangeRateField = getField(rawData, 'exchangeRate');
  const exchangeRate = exchangeRateField?.value || 1;
  sources.exchangeRate = exchangeRateField?.value
    ? withTone(exchangeRateField.source, exchangeRateField.source.kind === 'api' && exchangeRateField.source.indicatorCode
        ? { notes: `${exchangeRateField.source.notes} Official rate for the analysis year, so local-currency figures are in the same year's prices as the US$ figures.` }
        : {})
    : estimateSource('Default FX rate', 'No exchange rate was available, so 1.0 was used for local-currency conversion.');

  const hourlyWage = (gdpPerCapita / (260 * 8)) * 0.8;
  sources.hourlyWage = gdpField?.value
    ? derivedFrom(
        gdpField.source,
        'Derived from GDP per capita',
        `Hourly wage proxy derived from GDP per capita (${gdpPerCapita.toFixed(0)} USD) using 260 working days and an 80% wage-to-GDP adjustment.`
      )
    : estimateSource('Estimated hourly wage', 'Hourly wage estimated from fallback GDP per capita.');

  const usGdpPerCapita = rawData?.usGdpPerCapita || US_GDP_PER_CAPITA_FALLBACK;
  sources.usGdpPerCapita = rawData?.usGdpPerCapita
    ? { label: `World Bank ${analysisYear}`, kind: 'api', sourceName: 'World Bank Open Data', indicatorCode: 'NY.GDP.PCAP.CD', tone: 'success', notes: 'US GDP per person, used to transfer the US value of a statistical life (160 × US income) to this country.' }
    : estimateSource('Fallback', 'US GDP per person (2023) used because the World Bank series did not load.');
  sources.vslIncomeElasticity = assumptionSource(
    'Robinson et al. 2019',
    'Value of a statistical life = 160 × US income × (country income ÷ US income)^1.5, but at least 20 × income per person (Robinson, Hammitt & O\'Keeffe, Journal of Benefit-Cost Analysis 2019, reference case). An elasticity of 1.0 gives 160 × income per person, a common upper bound.'
  );

  // --- Population ---
  const populationField = getField(rawData, 'population');
  const population = populationField?.value || 10000000;
  sources.population = populationField?.value
    ? withTone(populationField.source)
    : estimateSource('Default population estimate', 'World Bank population was unavailable, so 10 million was used.');

  const washMortalityField = getField(rawData, 'washMortality');
  const birthRateField = getField(rawData, 'birthRate');
  const u5MortalityField = getField(rawData, 'mortalityUnder5Rate');
  const healthExpField = getField(rawData, 'healthExpenditure');
  const stuntingField = getField(rawData, 'stuntingPrevalence');
  const odField = getField(rawData, 'openDefecation');
  const sanitationField = getField(rawData, 'basicSanitation');
  const tourismField = getField(rawData, 'tourismReceipts');
  const urbanField = getField(rawData, 'urbanShare');
  const odUrbanField = getField(rawData, 'openDefecationUrban');
  const odRuralField = getField(rawData, 'openDefecationRural');
  const basicUrbanField = getField(rawData, 'basicSanitationUrban');
  const basicRuralField = getField(rawData, 'basicSanitationRural');
  const childrenField = getField(rawData, 'children0to14Share');

  const birthRate = birthRateField?.value || 25;
  const u5MortalityRate = u5MortalityField?.value || 40;

  // Share of the population under 5: five annual birth cohorts, less roughly half of under-5 deaths.
  const under5Share = birthRateField?.value
    ? Math.min(0.25, 5 * (birthRate / 1000) * (1 - u5MortalityRate / 2000))
    : 0.15;
  sources.under5Share = birthRateField?.value
    ? derivedFrom(
        birthRateField.source,
        'Derived from birth rate',
        `Five annual birth cohorts (crude birth rate ${birthRate.toFixed(1)} per 1,000) less about half of under-5 deaths. Used to split diarrhoea cases between age groups and to size the yearly cohort for stunting.`
      )
    : estimateSource('Default under-5 share', 'Birth rate was unavailable, so 15% (typical for sub-Saharan Africa) was used.');

  const children5to14Share = has(childrenField?.value)
    ? Math.max(0, childrenField!.value! / 100 - under5Share)
    : 0.27;
  sources.children5to14Share = has(childrenField?.value)
    ? derivedFrom(childrenField!.source, 'Derived from population aged 0-14', `Population aged 0-14 (${childrenField!.value!.toFixed(1)}%) minus the under-5 share. Children's time is valued at a lower rate than adults'.`)
    : estimateSource('Default', 'Population aged 0-14 was unavailable, so 27% aged 5-14 was assumed.');

  // --- Health: deaths and the sanitation share ---
  // Deaths inputs are ALL diarrhoea deaths; the sanitation share is applied in the calculation.
  let diarrheaDeathsUnder5 = 0;
  let diarrheaDeathsOver5 = 0;
  let attribution = SANITATION_DIARRHOEA_PAF;
  let ageAtDeathOver5 = 45;
  const who = evidence.whoSanitation;

  if (who?.deathsPerPerson && who.attributableFraction) {
    const paf = who.attributableFraction.value;
    attribution = round(paf, 3);
    const sanDeaths = who.deathsPerPerson.value * population;
    const sanDeathsU5 = (who.deathsUnder5PerPerson?.value ?? who.deathsPerPerson.value * UNDER5_SHARE_OF_DIARRHOEA_DEATHS) * population;
    diarrheaDeathsUnder5 = Math.round(sanDeathsU5 / paf);
    diarrheaDeathsOver5 = Math.round((sanDeaths - sanDeathsU5) / paf);
    ranges.attributionToSanitation = ratioRange(who.attributableFraction, 'WHO 2023 country 95% uncertainty interval');
    ranges.diarrheaDeaths = ratioRange(who.deathsPerPerson, 'WHO 2023 country 95% uncertainty interval');

    const note = `WHO estimates ${Math.round(sanDeaths).toLocaleString('en-US')} diarrhoea deaths from inadequate sanitation in this country (2019 rate applied to the ${analysisYear} population), ${Math.round(paf * 100)}% of all diarrhoea deaths. The input is all diarrhoea deaths (sanitation deaths ÷ ${paf.toFixed(2)}); the model applies the sanitation share.`;
    sources.diarrheaDeathsUnder5 = whoSource('WHO 2019 (2023 report)', `${note} Under 5: ${Math.round(sanDeathsU5).toLocaleString('en-US')} sanitation deaths.`);
    sources.diarrheaDeathsOver5 = whoSource('WHO 2019 (2023 report)', `${note} Aged 5 and over: ${Math.round(sanDeaths - sanDeathsU5).toLocaleString('en-US')} sanitation deaths.`);
    sources.attributionToSanitation = whoSource(
      'WHO 2019 (2023 report)',
      `${Math.round(paf * 100)}% of diarrhoea in this country is attributable to inadequate sanitation (95% interval ${Math.round(who.attributableFraction.low * 100)}–${Math.round(who.attributableFraction.high * 100)}%). WHO 2023, indicator WSH_20_SAN. Global average 38%. Applied to cases, deaths and cholera.`,
      'https://www.who.int/data/gho/data/indicators/indicator-details/GHO/attributable-fraction-of-diarrhoea-to-inadequate-sanitation'
    );

    // Average age at death over 5, from WHO DALYs per death: years of life lost ≈ standard life expectancy − age.
    const dalysO5 = (who.dalysPerPerson?.value ?? 0) - (who.dalysUnder5PerPerson?.value ?? 0);
    const deathsO5 = who.deathsPerPerson.value - (who.deathsUnder5PerPerson?.value ?? 0);
    // Where few people over 5 die, illness dominates their DALYs and the implied age is meaningless (below 15).
    const impliedAge = deathsO5 > 0 ? STANDARD_LIFE_EXPECTANCY - dalysO5 / deathsO5 : NaN;
    if (dalysO5 > 0 && deathsO5 > 0 && impliedAge < 15) {
      sources.ageAtDeathOver5 = assumptionSource('Model assumption', `Set to 45. WHO's figures for this country cannot be used to infer it: few deaths aged 5+ relative to illness, so DALYs per death (${(dalysO5 / deathsO5).toFixed(0)}) mostly reflect illness, not years of life lost.`);
    } else if (dalysO5 > 0 && deathsO5 > 0) {
      ageAtDeathOver5 = Math.round(Math.min(85, impliedAge));
      sources.ageAtDeathOver5 = whoSource(
        'Derived from WHO DALYs',
        `WHO's figures give ${(dalysO5 / deathsO5).toFixed(0)} DALYs per sanitation-related diarrhoea death aged 5+. With WHO's standard life expectancy of about 92, that is an average age at death of about ${ageAtDeathOver5}. DALYs also count illness, so the true age is a little higher. Deaths after 64 lose no working years in the human capital method.`
      );
    }
  } else if (washMortalityField?.value) {
    const totalWashDeaths = (washMortalityField.value / 100000) * population;
    const allDiarrhoeaDeaths = (totalWashDeaths * WASH_DEATHS_DIARRHOEA_SHARE) / WASH_DIARRHOEA_PAF;
    diarrheaDeathsUnder5 = Math.round(allDiarrhoeaDeaths * UNDER5_SHARE_OF_DIARRHOEA_DEATHS);
    diarrheaDeathsOver5 = Math.round(allDiarrhoeaDeaths * (1 - UNDER5_SHARE_OF_DIARRHOEA_DEATHS));
    const washNote = `No WHO sanitation estimate for this country. All diarrhoea deaths from WHO's WASH-attributable death rate (${washMortalityField.value.toFixed(1)} per 100,000, SDG 3.9.2): WASH deaths × 0.74 ÷ 0.69 (WHO 2023).`;
    sources.diarrheaDeathsUnder5 = derivedFrom(washMortalityField.source, 'Derived from WASH mortality', `${washNote} Under-5 share 26% (WHO 2023 global).`);
    sources.diarrheaDeathsOver5 = derivedFrom(washMortalityField.source, 'Derived from WASH mortality', `${washNote} Over-5 share 74%.`);
  } else {
    const annualBirths = population * (birthRate / 1000);
    const totalU5Deaths = annualBirths * (u5MortalityRate / 1000);
    diarrheaDeathsUnder5 = Math.round(totalU5Deaths * 0.09);
    diarrheaDeathsOver5 = Math.round(diarrheaDeathsUnder5 * (1 - UNDER5_SHARE_OF_DIARRHOEA_DEATHS) / UNDER5_SHARE_OF_DIARRHOEA_DEATHS);
    sources.diarrheaDeathsUnder5 = u5MortalityField?.value
      ? derivedFrom(u5MortalityField.source, 'Derived from under-5 mortality', 'No WHO sanitation estimate. Under-5 diarrhoea deaths estimated as 9% of all under-5 deaths (UNICEF/WHO).')
      : estimateSource('Estimated diarrhoea mortality', 'Diarrhoea deaths estimated from fallback birth and mortality rates.');
    sources.diarrheaDeathsOver5 = u5MortalityField?.value
      ? derivedFrom(u5MortalityField.source, 'Derived from under-5 mortality', 'Over-5 diarrhoea deaths scaled from under-5 deaths using the global age split (26% under 5, 74% over 5; WHO 2023).')
      : estimateSource('Estimated diarrhoea mortality', 'Over-5 diarrhoea deaths estimated relative to fallback under-5 deaths.');
  }
  if (!sources.attributionToSanitation) {
    sources.attributionToSanitation = assumptionSource(
      'WHO 2023 global',
      `No WHO country estimate, so the global figure is used: ${Math.round(SANITATION_DIARRHOEA_PAF * 100)}% of diarrhoea is attributable to unsafe sanitation alone (564,000 of about 1.5 million diarrhoea deaths in 2019; WHO 2023). Likely higher where sanitation coverage is low.`
    );
  }
  if (!sources.ageAtDeathOver5) {
    sources.ageAtDeathOver5 = assumptionSource('Model assumption', 'Average age at death for diarrhoea deaths aged 5+ set to 45. No WHO DALY data for this country.');
  }

  // --- Health: incidence ---
  // The World Bank diarrhoea prevalence series (SH.STA.DIRH.ZS) has been archived, so incidence is set by income level.
  let incidenceU5 = 3.5;
  if (gdpPerCapita > 2000) incidenceU5 = 1.5;
  if (gdpPerCapita > 10000) incidenceU5 = 0.5;
  sources.diarrheaIncidenceUnder5 = estimateSource(
    'Income-based estimate',
    'Under-5 diarrhoea episodes per child per year, set by income level: 3.5 below US$2,000 GDP per person, 1.5 up to US$10,000, 0.5 above. Low-income figure in line with WHO/CHERG estimates of about 3 episodes a year (Fischer Walker et al., Lancet 2013). Replace with a DHS/MICS-based figure if you have one: 2-week prevalence × 21 ≈ episodes per year.'
  );
  const incidenceO5 = incidenceU5 * 0.15;
  sources.diarrheaIncidenceOver5 = derivedFrom(
    sources.diarrheaIncidenceUnder5,
    'Derived from under-5 incidence',
    'Over-5 incidence estimated as 15% of under-5 incidence.',
    sources.diarrheaIncidenceUnder5.tone
  );

  const seekRate = Math.min(0.95, Math.max(0.4, 0.4 + (gdpPerCapita / 10000) * 0.4));
  sources.treatmentSeekingRate = derivedFrom(
    sources.gdpPerCapita,
    'Derived from GDP per capita',
    'Share of cases treated at a health facility: 40% at low incomes, rising with GDP per person (capped at 95%). DHS surveys typically show 40–70% of children with diarrhoea taken for care in low-income countries.',
    sources.gdpPerCapita.tone
  );

  // --- Health: unit costs (WHO-CHOICE) ---
  let costOutpatient: number;
  let costInpatient: number;
  const choice = evidence.whoChoice;
  const deflator = rawData?.usDeflatorRatio;
  if (choice && deflator) {
    const visit = choice.outpatientVisitUSD2010.value * deflator;
    const bedDay = choice.bedDayUSD2010.value * deflator;
    costOutpatient = visit + DRUGS_OUTPATIENT_USD;
    costInpatient = bedDay * DAYS_PER_ADMISSION + DRUGS_INPATIENT_USD;
    ranges.costOutpatient = ratioRange(choice.outpatientVisitUSD2010, 'WHO-CHOICE 95% uncertainty interval');
    ranges.costInpatient = ratioRange(choice.bedDayUSD2010, 'WHO-CHOICE 95% uncertainty interval');
    const link = 'https://www.who.int/publications/m/item/who-choice-estimates-of-cost-for-inpatient-and-outpatient-health-service-delivery';
    const plrNote = choice.priceLevelEstimated
      ? ' This country\'s 2010 price level could not be worked out from World Bank data (official exchange rate far from the market rate), so the median of the other countries was used.'
      : ' Converted from international dollars with the country\'s 2010 price level.';
    sources.costOutpatient = {
      label: 'WHO-CHOICE', kind: 'derived', sourceName: 'WHO-CHOICE (Stenberg et al. 2018)', tone: choice.priceLevelEstimated ? 'warning' : 'success', link,
      notes: `Health-centre visit US$${visit.toFixed(2)} (WHO-CHOICE 2010 estimate US$${choice.outpatientVisitUSD2010.value.toFixed(2)}, inflated to ${analysisYear} with the US GDP deflator, × ${deflator.toFixed(2)}), plus about US$${DRUGS_OUTPATIENT_USD.toFixed(2)} for oral rehydration salts and zinc, which WHO-CHOICE leaves out.${plrNote}`,
    };
    sources.costInpatient = {
      label: 'WHO-CHOICE', kind: 'derived', sourceName: 'WHO-CHOICE (Stenberg et al. 2018)', tone: 'success', link,
      notes: `${DAYS_PER_ADMISSION} bed-days at a primary hospital (US$${bedDay.toFixed(2)} a day: WHO-CHOICE 2010 estimate US$${choice.bedDayUSD2010.value.toFixed(2)} × ${deflator.toFixed(2)}) plus about US$${DRUGS_INPATIENT_USD} for fluids and drugs. The ${DAYS_PER_ADMISSION}-day stay is an assumption.`,
    };
  } else {
    costOutpatient = healthExpField?.value ? Math.max(1, healthExpField.value * 0.1) : Math.max(2, gdpPerCapita * 0.005);
    costInpatient = Math.max(15, costOutpatient * 8);
    sources.costOutpatient = healthExpField?.value
      ? derivedFrom(healthExpField.source, 'Derived from health expenditure', 'No WHO-CHOICE estimate for this country, so 10% of health spending per person is used for an outpatient case.')
      : estimateSource('GDP-based estimate', 'No WHO-CHOICE estimate or health spending data; outpatient cost set to 0.5% of GDP per person.');
    sources.costInpatient = derivedFrom(sources.costOutpatient, 'Derived from outpatient cost', 'No WHO-CHOICE estimate for this country; an admission is set to 8 × the outpatient cost.', sources.costOutpatient.tone);
  }

  // --- Stunting (shown separately by default) ---
  let stuntingPrevalence = 0.3;
  if (stuntingField?.value) {
    stuntingPrevalence = stuntingField.value / 100;
    sources.stuntingPrevalence = withTone(stuntingField.source, {
      notes: `Stunting prevalence loaded from aligned World Bank value (${stuntingField.value.toFixed(1)}%).`,
    });
  } else {
    if (gdpPerCapita < 1000) stuntingPrevalence = 0.4;
    else if (gdpPerCapita < 3000) stuntingPrevalence = 0.25;
    else stuntingPrevalence = 0.1;
    sources.stuntingPrevalence = estimateSource('Income-based estimate', 'Stunting prevalence estimated from income-level heuristics.');
  }

  // --- Access time, urban and rural ---
  // A real 0% is valid data (e.g. Bangladesh), so test for a missing value, not a falsy one.
  const nationalOd = has(odField?.value) ? odField!.value! / 100 : 0.05;
  const urbanShare = has(urbanField?.value) ? urbanField!.value! / 100 : 0.3;
  const odUrban = has(odUrbanField?.value) ? odUrbanField!.value! / 100 : nationalOd;
  const odRural = has(odRuralField?.value) ? odRuralField!.value! / 100 : nationalOd;
  sources.urbanShare = has(urbanField?.value) ? withTone(urbanField!.source) : estimateSource('Default', 'Urban share unavailable; 30% assumed.');
  const odFallbackNote = has(odField?.value)
    ? `No separate figure; the national rate (${(nationalOd * 100).toFixed(1)}%) is used.`
    : 'No World Bank value; 5% assumed.';
  sources.openDefecationUrban = has(odUrbanField?.value) ? withTone(odUrbanField!.source) : estimateSource('National rate', odFallbackNote);
  sources.openDefecationRural = has(odRuralField?.value) ? withTone(odRuralField!.source) : estimateSource('National rate', odFallbackNote);

  // --- Carbon: people without at least basic sanitation ---
  let percentPoorSanitation = 0.6;
  if (has(basicUrbanField?.value) && has(basicRuralField?.value)) {
    percentPoorSanitation = 1 - (urbanShare * basicUrbanField!.value! + (1 - urbanShare) * basicRuralField!.value!) / 100;
    sources.percentWithPoorSanitation = derivedFrom(basicRuralField!.source, 'Derived from urban and rural coverage',
      `People without at least basic sanitation: urban ${(100 - basicUrbanField!.value!).toFixed(1)}%, rural ${(100 - basicRuralField!.value!).toFixed(1)}%, weighted by population.`);
  } else if (sanitationField?.value) {
    percentPoorSanitation = 1 - (sanitationField.value / 100);
    sources.percentWithPoorSanitation = derivedFrom(sanitationField.source, 'Derived from basic sanitation coverage',
      `Population without at least basic sanitation: 100% minus basic coverage (${sanitationField.value.toFixed(1)}%).`);
  } else {
    percentPoorSanitation = Math.min(0.95, nationalOd * 3 + 0.2);
    sources.percentWithPoorSanitation = estimateSource('Estimated poor sanitation share', 'Estimated from open defecation prevalence.');
  }

  // --- Cholera ---
  const cholera = evidence.cholera;
  const choleraCasesPerYear = cholera?.averageCases ?? 0;
  const choleraCostPerCase = costInpatient + CHOLERA_DAYS_LOST * hourlyWage * 8 * 0.5;
  sources.choleraCasesPerYear = cholera && cholera.yearsReported > 0
    ? whoSource(
        `WHO, ${cholera.firstYear}–${cholera.lastYear}`,
        `Average of the last ${cholera.yearsReported} years with reported cases (${cholera.firstYear}–${cholera.lastYear}), WHO Global Health Observatory. WHO's series ends around 2016–2017, so recent outbreaks are missing: enter recent figures from the national cholera response if you have them.`,
        'https://www.who.int/data/gho/data/indicators/indicator-details/GHO/number-of-reported-cases-of-cholera'
      )
    : estimateSource('No reports', 'WHO has no cholera reports for this country, so 0 is used.');
  sources.choleraCostPerCase = derivedFrom(sources.costInpatient, 'Derived from inpatient cost',
    `One admission (US$${costInpatient.toFixed(2)}) plus ${CHOLERA_DAYS_LOST} days of lost work at 50% of the wage. Outbreak response costs (surveillance, vaccination) are not included.`);

  // --- Tourism (shown separately by default) ---
  const tourismReceipts = tourismField?.value || (gdpPerCapita * population * 0.02);
  sources.tourismReceipts = tourismField?.value
    ? withTone(tourismField.source)
    : estimateSource('Estimated tourism receipts', 'Tourism receipts estimated as 2% of total GDP because no aligned World Bank value was available.');

  const inputs: ModelInputs = {
    macro: {
      analysisYear,
      currencyCode,
      exchangeRate,
      gdpPerCapita,
      discountRate: DEFAULT_DISCOUNT_RATE,
      hourlyWage,
      workingDaysPerYear: 260,
      mortalityMethod: 'humanCapital',
      usGdpPerCapita,
      vslIncomeElasticity: 1.5,
    },
    health: {
      population,
      under5Share: round(under5Share),
      children5to14Share: round(children5to14Share),
      diarrheaIncidenceUnder5: round(incidenceU5, 2),
      diarrheaIncidenceOver5: round(incidenceO5, 2),
      diarrheaDeathsUnder5,
      diarrheaDeathsOver5,
      attributionToSanitation: attribution,
      ageAtDeathOver5,
      treatmentSeekingRate: round(seekRate, 2),
      costOutpatient: round(costOutpatient, 2),
      costInpatient: round(costInpatient, 2),
    },
    nutrition: {
      stuntingPrevalence,
      attributionStunting: SANITATION_STUNTING_PAF,
      wageLossPercent: 0.1,
      realWageGrowth: 0.015,
      includeInTotal: false,
    },
    access: {
      urbanShare: round(urbanShare),
      openDefecationUrban: round(odUrban, 4),
      openDefecationRural: round(odRural, 4),
      dailyTimeForODUrban: OD_HOURS_PER_DAY,
      dailyTimeForODRural: OD_HOURS_PER_DAY,
      valueOfTimeAdult: 0.5,
      valueOfTimeChild: 0.25,
    },
    carbon: {
      percentWithPoorSanitation: round(percentPoorSanitation, 2),
      emissionFactorSource: 'IPCC',
      emissionFactor: EMISSION_PRESETS.IPCC,
      socialCostOfCarbon: 100,
      includeInTotal: false,
    },
    other: {
      choleraCasesPerYear,
      choleraCostPerCase: round(choleraCostPerCase, 2),
      funeralCostPerDeath: round(gdpPerCapita * 0.2, 2),
      tourismLossPercentage: 0.05,
      tourismReceipts,
      includeTourismInTotal: false,
    },
    ranges,
  };

  sources.analysisYear = rawData
    ? {
        label: rawData.fallbackFields.length > 0
          ? `Aligned year ${analysisYear} with fallbacks`
          : `Aligned year ${analysisYear}`,
        kind: 'api',
        sourceName: 'World Bank alignment',
        requestedYear: analysisYear,
        actualYear: analysisYear,
        fallbackUsed: rawData.fallbackFields.length > 0,
        tone: rawData.fallbackFields.length > 0 ? 'warning' : 'success',
        notes: `${rawData.yearExplanation.rule}${rawData.yearExplanation.limiting.length
          ? ` For this country, ${rawData.yearExplanation.limiting.join(', ')} ${rawData.yearExplanation.limiting.length > 1 ? 'have' : 'has'} no data after ${analysisYear}.`
          : ''}`,
      }
    : estimateSource('Default analysis year', 'No external data was available, so the model fell back to the default analysis year.');

  sources.discountRate = assumptionSource(
    'Haacker et al. 2020',
    'Discount rate 5%. The usual 3% in global health is low for countries with fast-growing incomes; Haacker, Hallett & Atun (Health Policy and Planning, 2020) recommend at least 5% for low- and lower-middle-income countries. Try 3% as a sensitivity check.'
  );
  sources.workingDaysPerYear = assumptionSource('Standard assumption', 'Working days per year fixed at 260.');
  sources.attributionStunting = assumptionSource(
    'Danaei et al. 2016',
    `${Math.round(SANITATION_STUNTING_PAF * 100)}% of stunting attributable to unimproved sanitation (7.2 of 44.1 million cases; Danaei et al., PLOS Medicine 2016). Treat as an upper bound: three large trials (WASH Benefits Bangladesh and Kenya, SHINE Zimbabwe) found household WASH did not improve child growth. That is why stunting is shown separately and not in the total unless you include it.`
  );
  sources.wageLossPercent = assumptionSource(
    'Literature estimate',
    'Adults who were stunted earn less: Hoddinott et al. (2013) find 1 SD more height-for-age goes with 21% higher household spending; Galasso & Wagstaff (2019) put the population-wide income penalty at about 7%. 10% is a conservative middle value.'
  );
  sources.realWageGrowth = assumptionSource('Radin et al. 2020', 'Future wages grow 1.5% a year in real terms (Radin et al., Journal of Benefit-Cost Analysis 2020). Without growth, discounting future earnings understates the loss.');
  const odTimeNote = 'About 10 minutes of extra time per person per day for open defecation compared with a latrine at home. WSP sector experts put it at 2.5 days a year (about 10 minutes a day); field studies found about 7 minutes a day per adult in rural India and about 4 minutes more per trip in Ethiopia (Radin et al., Journal of Benefit-Cost Analysis 2020). People aged 5 and over. Replace with local survey data if available.';
  sources.dailyTimeForODUrban = assumptionSource('Hickling & Hutton 2014; Radin et al. 2020', odTimeNote);
  sources.dailyTimeForODRural = assumptionSource('Hickling & Hutton 2014; Radin et al. 2020', odTimeNote);
  sources.valueOfTimeAdult = assumptionSource('Radin et al. 2020', 'Time of people aged 15+ valued at 50% of the wage proxy (Radin et al. 2020, range 25–75%). Also used for days lost to illness, including carers of sick children.');
  sources.valueOfTimeChild = assumptionSource('Radin et al. 2020', 'Time of children aged 5-14 valued at 25% of the wage proxy (Radin et al. 2020, range 0–50%). Under-5s are not counted.');
  sources.tourismLossPercentage = assumptionSource('Model assumption', 'Tourism loss attributable to poor sanitation set to 5%. Not based on a published estimate, so tourism is shown separately and not in the total unless you include it.');
  sources.funeralCostPerDeath = derivedFrom(
    sources.gdpPerCapita,
    'Derived from GDP per capita',
    'Funeral cost per sanitation-attributable death set to 20% of GDP per person. Rough assumption, no direct source.',
    sources.gdpPerCapita.tone
  );
  sources.mortalityMethod = {
    label: 'User selection',
    kind: 'user',
    sourceName: 'Analyst input',
    tone: 'neutral',
    notes: 'Human capital (default): lost output over the remaining working life, by age at death. Value of statistical life: what people are willing to pay to reduce the risk of death (Robinson et al. 2019); usually higher. Both are shown in the results.',
  };
  sources.emissionFactor = assumptionSource('IPCC/SCARE reference', '35 kg CO2e per person per year (IPCC method, pit latrines). Very uncertain: Cheng et al. (2022) estimate non-sewered sanitation emits 377 Mt CO2e a year (range 22–1,003), about 4.7% of human methane emissions.');
  sources.socialCostOfCarbon = assumptionSource('Conservative estimate', 'US$100 per tonne CO2e. Recent central estimates are higher (about US$185–190 per tonne: Rennert et al., Nature 2022; US EPA 2023).');

  return { inputs, sources };
};
