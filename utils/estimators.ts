import { EMISSION_PRESETS } from '../constants';
import { CountryApiData, DataSourceInfo, DataSourceMap, ModelInputs } from '../types';

type RawFieldKey = keyof CountryApiData['fields'];

const DEFAULT_ANALYSIS_YEAR = 2023;

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
  const diarrheaField = getField(rawData, 'diarrheaPrevalence');
  const healthExpField = getField(rawData, 'healthExpenditure');
  const stuntingField = getField(rawData, 'stuntingPrevalence');
  const odField = getField(rawData, 'openDefecation');
  const sanitationField = getField(rawData, 'basicSanitation');
  const tourismField = getField(rawData, 'tourismReceipts');

  let diarrheaDeathsUnder5 = 0;
  let diarrheaDeathsOver5 = 0;

  if (washMortalityField?.value) {
    const totalWashDeaths = (washMortalityField.value / 100000) * population;
    diarrheaDeathsUnder5 = Math.round(totalWashDeaths * 0.7);
    diarrheaDeathsOver5 = Math.round(totalWashDeaths * 0.3);
    sources.diarrheaDeathsUnder5 = derivedFrom(
      washMortalityField.source,
      'Derived from WASH mortality',
      `Under-5 deaths derived from aligned WASH mortality data (${washMortalityField.value.toFixed(1)} per 100,000 population).`
    );
    sources.diarrheaDeathsOver5 = derivedFrom(
      washMortalityField.source,
      'Derived from WASH mortality',
      'Over-5 deaths estimated as 30% of WASH-attributable mortality.'
    );
  } else {
    const birthRate = birthRateField?.value || 25;
    const u5MortalityRate = u5MortalityField?.value || 40;
    const annualBirths = population * (birthRate / 1000);
    const totalU5Deaths = annualBirths * (u5MortalityRate / 1000);

    diarrheaDeathsUnder5 = Math.round(totalU5Deaths * 0.09);
    diarrheaDeathsOver5 = Math.round(diarrheaDeathsUnder5 * 0.35);

    if (u5MortalityField?.value) {
      sources.diarrheaDeathsUnder5 = derivedFrom(
        u5MortalityField.source,
        'Derived from under-5 mortality',
        'Under-5 diarrhea deaths estimated as 9% of total under-5 mortality.'
      );
      sources.diarrheaDeathsOver5 = derivedFrom(
        u5MortalityField.source,
        'Derived from under-5 mortality',
        'Over-5 diarrhea deaths estimated relative to under-5 diarrhea deaths.'
      );
    } else {
      sources.diarrheaDeathsUnder5 = estimateSource('Estimated diarrhea mortality', 'Diarrhea deaths estimated from fallback birth and mortality rates.');
      sources.diarrheaDeathsOver5 = estimateSource('Estimated diarrhea mortality', 'Over-5 diarrhea deaths estimated relative to fallback under-5 deaths.');
    }
  }

  let incidenceU5 = 3.5;
  if (diarrheaField?.value) {
    incidenceU5 = diarrheaField.value * 0.25;
    sources.diarrheaIncidenceUnder5 = derivedFrom(
      diarrheaField.source,
      'Derived from diarrhea prevalence',
      `Under-5 incidence derived from World Bank diarrhea prevalence (${diarrheaField.value.toFixed(1)}%).`
    );
  } else {
    if (gdpPerCapita > 2000) incidenceU5 = 1.5;
    if (gdpPerCapita > 10000) incidenceU5 = 0.5;
    sources.diarrheaIncidenceUnder5 = estimateSource('Income-based estimate', 'Under-5 diarrhea incidence estimated from income-level heuristics.');
  }

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
  const odPrevalence = odField?.value ? odField.value / 100 : 0.05;
  sources.openDefecationPrevalence = odField?.value
    ? withTone(odField.source, {
        notes: `Open defecation prevalence loaded from aligned World Bank value (${odField.value.toFixed(1)}%).`,
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
      discountRate: 0.1,
      hourlyWage,
      workingDaysPerYear: 260,
      mortalityMethod: 'humanCapital',
      vslMultiplier: 70,
    },
    health: {
      population,
      diarrheaIncidenceUnder5: Number.parseFloat(incidenceU5.toFixed(2)),
      diarrheaIncidenceOver5: Number.parseFloat(incidenceO5.toFixed(2)),
      diarrheaDeathsUnder5,
      diarrheaDeathsOver5,
      attributionToSanitation: washMortalityField?.value ? 1.0 : 0.88,
      treatmentSeekingRate: Number.parseFloat(seekRate.toFixed(2)),
      costOutpatient: Number.parseFloat(costOutpatient.toFixed(2)),
      costInpatient: Number.parseFloat(costInpatient.toFixed(2)),
    },
    nutrition: {
      stuntingPrevalence,
      attributionStunting: 0.5,
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
        notes: rawData.alignmentStrategy === 'latest-common-year'
          ? `Calculations are aligned to ${analysisYear}, the latest year shared across the fetched World Bank indicators.`
          : `Calculations are aligned to ${analysisYear}, the year with the strongest indicator coverage across the fetched World Bank series.`,
      }
    : estimateSource('Default analysis year', 'No external data was available, so the model fell back to the default analysis year.');

  sources.discountRate = assumptionSource('Standard assumption', 'Discount rate set to 10% by default.');
  sources.workingDaysPerYear = assumptionSource('Standard assumption', 'Working days per year fixed at 260.');
  sources.attributionToSanitation = washMortalityField?.value
    ? derivedFrom(
        washMortalityField.source,
        'Included in WASH mortality source',
        'Attribution is set to 100% because the source already isolates WASH-attributable mortality.'
      )
    : assumptionSource('WHO estimate', 'Attribution to sanitation set to 88% when WASH-attributable mortality is not available.');
  sources.attributionStunting = assumptionSource('Model assumption', 'Sanitation-attributable share of stunting set to 50%.');
  sources.wageLossPercent = assumptionSource('Literature estimate', 'Future wage penalty for stunting set to 10%.');
  sources.dailyTimeForOD = assumptionSource('Model assumption', 'Time spent on open defecation set to 0.5 hours per day.');
  sources.tourismLossPercentage = assumptionSource('Model assumption', 'Tourism loss attributable to poor sanitation set to 5%.');
  sources.choleraResponseCost = derivedFrom(
    sources.gdpPerCapita,
    'Derived from GDP per capita',
    'Annual cholera response cost estimated as 2,000 times GDP per capita.',
    sources.gdpPerCapita.tone
  );
  sources.funeralCostPerDeath = derivedFrom(
    sources.gdpPerCapita,
    'Derived from GDP per capita',
    'Funeral cost per death estimated as 20% of GDP per capita.',
    sources.gdpPerCapita.tone
  );
  sources.mortalityMethod = {
    label: 'User selection',
    kind: 'user',
    sourceName: 'Analyst input',
    tone: 'neutral',
    notes: 'Mortality valuation method can be switched between Human Capital and VSL.',
  };
  sources.vslMultiplier = assumptionSource('Standard assumption', 'VSL multiplier set to 70x GDP per capita.');
  sources.emissionFactor = assumptionSource('IPCC/SCARE reference', 'Emission factor defaults to the IPCC preset unless changed by the analyst.');
  sources.socialCostOfCarbon = assumptionSource('Global estimate', 'Social cost of carbon defaults to USD 100 per ton.');

  return { inputs, sources };
};
