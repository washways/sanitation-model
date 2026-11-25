import { EMISSION_PRESETS } from '../constants';
import { CountryApiData, DataSourceInfo, DataSourceMap, ModelInputs } from '../types';

type RawFieldKey = keyof CountryApiData['fields'];

const DEFAULT_ANALYSIS_YEAR = 2023;

/**
 * Evidence behind the default assumptions. ASSUMPTIONS.md gives the full reasoning and sources.
 *
 * WHO (2023), Burden of disease attributable to unsafe drinking-water, sanitation and hygiene, 2019 update,
 * and Wolf et al. (2023) Lancet 401:2060-71:
 * - 1.4 million deaths attributable to unsafe WASH in 2019, of which 1,035,000 are diarrhoea deaths.
 * - 69% of all diarrhoea deaths are attributable to unsafe WASH combined (water + sanitation + hygiene).
 * - 564,000 diarrhoea deaths are attributable to unsafe sanitation on its own.
 * - 273,000 WASH-attributable diarrhoea deaths are in children under 5.
 */
const WASH_DEATHS_DIARRHOEA_SHARE = 1035 / 1400; // share of WASH-attributable deaths that are diarrhoea
const WASH_DIARRHOEA_PAF = 0.69; // share of all diarrhoea deaths attributable to WASH combined
const TOTAL_DIARRHOEA_DEATHS_2019 = 1035 / WASH_DIARRHOEA_PAF; // thousand, about 1.5 million
// Sanitation-only share of diarrhoea: 564k / about 1.5 million = 0.38
export const SANITATION_DIARRHOEA_PAF = Math.round((564 / TOTAL_DIARRHOEA_DEATHS_2019) * 100) / 100;
const UNDER5_SHARE_OF_DIARRHOEA_DEATHS = 273 / 1035; // about 0.26
// Danaei et al. (2016) PLOS Med 13:e1002164: 7.2 of 44.1 million stunting cases attributable to unimproved sanitation.
export const SANITATION_STUNTING_PAF = Math.round((7.2 / 44.1) * 100) / 100; // 0.16
// Haacker, Hallett & Atun (2020) Health Policy Plan: at least 5% for low- and lower-middle-income countries.
export const DEFAULT_DISCOUNT_RATE = 0.05;

const getField = (rawData: CountryApiData | null | undefined, key: RawFieldKey) => rawData?.fields[key];

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

/**
 * Estimates missing inputs based on macroeconomic data.
 */
export const estimateInputs = (
  rawData: CountryApiData | null | undefined,
  isoCode: string,
  currencyCode: string
): { inputs: ModelInputs; sources: DataSourceMap } => {
  void isoCode;

  const sources: DataSourceMap = {};
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
    ? withTone(exchangeRateField.source)
    : estimateSource('Default FX rate', 'Live exchange rate was unavailable, so 1.0 was used for local-currency conversion.');

  const hourlyWage = (gdpPerCapita / (260 * 8)) * 0.8;
  sources.hourlyWage = gdpField?.value
    ? derivedFrom(
        gdpField.source,
        'Derived from GDP per capita',
        `Hourly wage proxy derived from GDP per capita (${gdpPerCapita.toFixed(0)} USD) using 260 working days and an 80% wage-to-GDP adjustment.`
      )
    : estimateSource('Estimated hourly wage', 'Hourly wage estimated from fallback GDP per capita.');

  // --- Health ---
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

  // Deaths inputs are ALL diarrhoea deaths; the sanitation share is applied in the calculation.
  let diarrheaDeathsUnder5 = 0;
  let diarrheaDeathsOver5 = 0;

  if (washMortalityField?.value) {
    const totalWashDeaths = (washMortalityField.value / 100000) * population;
    // WASH deaths include diarrhoea, respiratory infections, undernutrition and worms, and are 69% of diarrhoea deaths.
    const allDiarrhoeaDeaths = (totalWashDeaths * WASH_DEATHS_DIARRHOEA_SHARE) / WASH_DIARRHOEA_PAF;
    diarrheaDeathsUnder5 = Math.round(allDiarrhoeaDeaths * UNDER5_SHARE_OF_DIARRHOEA_DEATHS);
    diarrheaDeathsOver5 = Math.round(allDiarrhoeaDeaths * (1 - UNDER5_SHARE_OF_DIARRHOEA_DEATHS));
    const washNote = `All diarrhoea deaths, from WHO's WASH-attributable death rate (${washMortalityField.value.toFixed(1)} per 100,000, SDG 3.9.2). WASH deaths are about 74% diarrhoea, and WASH causes 69% of diarrhoea deaths (WHO 2023), so all diarrhoea deaths ≈ WASH deaths × 0.74 ÷ 0.69.`;
    sources.diarrheaDeathsUnder5 = derivedFrom(
      washMortalityField.source,
      'Derived from WASH mortality',
      `${washNote} Under-5 share 26% (WHO 2023: 273,000 of 1,035,000).`
    );
    sources.diarrheaDeathsOver5 = derivedFrom(
      washMortalityField.source,
      'Derived from WASH mortality',
      `${washNote} Over-5 share 74%.`
    );
  } else {
    const annualBirths = population * (birthRate / 1000);
    const totalU5Deaths = annualBirths * (u5MortalityRate / 1000);

    // About 9% of under-5 deaths are from diarrhoea (UNICEF/WHO MCEE).
    diarrheaDeathsUnder5 = Math.round(totalU5Deaths * 0.09);
    diarrheaDeathsOver5 = Math.round(diarrheaDeathsUnder5 * (1 - UNDER5_SHARE_OF_DIARRHOEA_DEATHS) / UNDER5_SHARE_OF_DIARRHOEA_DEATHS);

    if (u5MortalityField?.value) {
      sources.diarrheaDeathsUnder5 = derivedFrom(
        u5MortalityField.source,
        'Derived from under-5 mortality',
        'Under-5 diarrhoea deaths estimated as 9% of all under-5 deaths (UNICEF/WHO).'
      );
      sources.diarrheaDeathsOver5 = derivedFrom(
        u5MortalityField.source,
        'Derived from under-5 mortality',
        'Over-5 diarrhoea deaths scaled from under-5 deaths using the global age split (26% under 5, 74% over 5; WHO 2023).'
      );
    } else {
      sources.diarrheaDeathsUnder5 = estimateSource('Estimated diarrhea mortality', 'Diarrhea deaths estimated from fallback birth and mortality rates.');
      sources.diarrheaDeathsOver5 = estimateSource('Estimated diarrhea mortality', 'Over-5 diarrhea deaths estimated relative to fallback under-5 deaths.');
    }
  }

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
    'Treatment-seeking rate estimated from GDP per capita using a bounded linear proxy.',
    sources.gdpPerCapita.tone
  );

  let costOutpatient = 5;
  if (healthExpField?.value) {
    costOutpatient = Math.max(1, healthExpField.value * 0.1);
    sources.costOutpatient = derivedFrom(
      healthExpField.source,
      'Derived from health expenditure',
      'Outpatient unit cost estimated as 10% of health expenditure per capita.'
    );
  } else {
    costOutpatient = Math.max(2, gdpPerCapita * 0.005);
    sources.costOutpatient = estimateSource('GDP-based estimate', 'Outpatient cost estimated as roughly 0.5% of GDP per capita.');
  }

  const costInpatient = Math.max(15, costOutpatient * 8);
  sources.costInpatient = derivedFrom(
    sources.costOutpatient,
    'Derived from outpatient cost',
    'Inpatient unit cost estimated as 8x outpatient cost.',
    sources.costOutpatient.tone
  );

  // --- Nutrition ---
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

  // --- Access ---
  // A real 0% is valid data (e.g. Bangladesh), so test for a missing value, not a falsy one.
  const hasOd = odField?.value !== undefined && odField?.value !== null;
  const odPrevalence = hasOd ? odField!.value! / 100 : 0.05;
  sources.openDefecationPrevalence = hasOd
    ? withTone(odField.source, {
        notes: `Open defecation prevalence loaded from aligned World Bank value (${odField!.value!.toFixed(1)}%).`,
      })
    : estimateSource('Default OD estimate', 'Open defecation prevalence defaulted to 5% because no World Bank value was available.');

  // --- Carbon ---
  let percentPoorSanitation = 0.6;
  if (sanitationField?.value) {
    percentPoorSanitation = 1 - (sanitationField.value / 100);
    sources.percentWithPoorSanitation = derivedFrom(
      sanitationField.source,
      'Derived from basic sanitation coverage',
      `Population with poor sanitation calculated as 100% minus basic sanitation coverage (${sanitationField.value.toFixed(1)}%).`
    );
  } else {
    percentPoorSanitation = Math.min(0.95, odPrevalence * 3 + 0.2);
    sources.percentWithPoorSanitation = estimateSource('Estimated poor sanitation share', 'Poor sanitation share estimated from open defecation prevalence and LDC baseline assumptions.');
  }

  // --- Other ---
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
      vslMultiplier: 70,
    },
    health: {
      population,
      under5Share: Number.parseFloat(under5Share.toFixed(3)),
      diarrheaIncidenceUnder5: Number.parseFloat(incidenceU5.toFixed(2)),
      diarrheaIncidenceOver5: Number.parseFloat(incidenceO5.toFixed(2)),
      diarrheaDeathsUnder5,
      diarrheaDeathsOver5,
      attributionToSanitation: SANITATION_DIARRHOEA_PAF,
      treatmentSeekingRate: Number.parseFloat(seekRate.toFixed(2)),
      costOutpatient: Number.parseFloat(costOutpatient.toFixed(2)),
      costInpatient: Number.parseFloat(costInpatient.toFixed(2)),
    },
    nutrition: {
      stuntingPrevalence,
      attributionStunting: SANITATION_STUNTING_PAF,
      wageLossPercent: 0.1,
    },
    access: {
      openDefecationPrevalence: odPrevalence,
      dailyTimeForOD: 0.5,
    },
    carbon: {
      percentWithPoorSanitation: Number.parseFloat(percentPoorSanitation.toFixed(2)),
      emissionFactorSource: 'IPCC',
      emissionFactor: EMISSION_PRESETS.IPCC,
      socialCostOfCarbon: 100,
    },
    other: {
      choleraResponseCost: gdpPerCapita * 2000,
      funeralCostPerDeath: gdpPerCapita * 0.2,
      tourismLossPercentage: 0.05,
      tourismReceipts,
    },
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
  sources.attributionToSanitation = assumptionSource(
    'WHO 2023',
    `${Math.round(SANITATION_DIARRHOEA_PAF * 100)}% of diarrhoea is attributable to unsafe sanitation alone: 564,000 of about 1.5 million diarrhoea deaths in 2019 (WHO 2023; Wolf et al., Lancet 2023). Water, sanitation and hygiene together account for 69%; the old 88% figure (WHO 2004) was for all three combined and is out of date. A global average: it is likely higher where sanitation coverage is low.`
  );
  sources.attributionStunting = assumptionSource(
    'Danaei et al. 2016',
    `${Math.round(SANITATION_STUNTING_PAF * 100)}% of stunting attributable to unimproved sanitation (7.2 of 44.1 million cases; Danaei et al., PLOS Medicine 2016). Treat as an upper bound: three large trials (WASH Benefits Bangladesh and Kenya, SHINE Zimbabwe) found household WASH did not improve child growth.`
  );
  sources.wageLossPercent = assumptionSource(
    'Literature estimate',
    'Adults who were stunted earn less: Hoddinott et al. (2013) find 1 SD more height-for-age goes with 21% higher household spending; Galasso & Wagstaff (2019) put the population-wide income penalty at about 7%. 10% is a conservative middle value.'
  );
  sources.dailyTimeForOD = assumptionSource('Model assumption', 'Extra time for open defecation set to 0.5 hours per person per day, valued at 30% of the wage proxy, following the WSP Economic Impacts of Sanitation studies. No recent primary source; replace with local survey data if available.');
  sources.tourismLossPercentage = assumptionSource('Model assumption', 'Tourism loss attributable to poor sanitation set to 5%. Not based on a published estimate; treat as illustrative.');
  sources.choleraResponseCost = estimateSource(
    'Placeholder, no source',
    'Placeholder: 2,000 × GDP per person every year. This is not based on data. Replace it with the national cholera response plan budget, or set it to 0.'
  );
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
    notes: 'Mortality valuation method can be switched between Human Capital and VSL.',
  };
  sources.vslMultiplier = assumptionSource('Model assumption', 'Value of a statistical life set to 70 × GDP per person. Published guidance for low-income countries (Robinson, Hammitt & O\'Keeffe 2019) gives a wide range; values well below 70× are common for the poorest countries, so test lower values.');
  sources.emissionFactor = assumptionSource('IPCC/SCARE reference', '35 kg CO2e per person per year (IPCC method, pit latrines). Very uncertain: Cheng et al. (2022) estimate non-sewered sanitation emits 377 Mt CO2e a year (range 22–1,003), about 4.7% of human methane emissions.');
  sources.socialCostOfCarbon = assumptionSource('Conservative estimate', 'US$100 per tonne CO2e. Recent central estimates are higher (about US$185–190 per tonne: Rennert et al., Nature 2022; US EPA 2023).');

  return { inputs, sources };
};
