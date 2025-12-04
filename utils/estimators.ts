
import { ModelInputs, DataSourceMap } from '../types';
import { EMISSION_PRESETS } from '../constants';

/**
 * Estimates missing inputs based on macroeconomic data (GDP per capita, etc.)
 * This provides reasonable defaults for any country.
 */
export const estimateInputs = (
  rawData: {
    population?: number | null;
    gdpPerCapita?: number | null;
    exchangeRate?: number | null;
    openDefecation?: number | null;
    mortalityUnder5Rate?: number | null;
    tourismReceipts?: number | null;
    birthRate?: number | null;
    healthExpenditure?: number | null;
    diarrheaPrevalence?: number | null;
    stuntingPrevalence?: number | null;
    washMortality?: number | null;
    basicSanitation?: number | null;
  },
  isoCode: string,
  currencyCode: string
): { inputs: ModelInputs; sources: DataSourceMap } => {
  const sources: DataSourceMap = {};
  
  // --- Macro ---
  const analysisYear = new Date().getFullYear();
  const gdpPerCapita = rawData.gdpPerCapita || 1000;
  sources['gdpPerCapita'] = rawData.gdpPerCapita ? 'Data: World Bank' : 'Default Estimate';
  
  const exchangeRate = rawData.exchangeRate || 1;
  sources['exchangeRate'] = rawData.exchangeRate ? 'Live Market Rate (open.er-api)' : 'Default (1.0)';

  const hourlyWage = (gdpPerCapita / (260 * 8)) * 0.8; // Rough estimate: GDPpc is slightly higher than avg wage income
  sources['hourlyWage'] = `Est. derived from GDP (${gdpPerCapita.toFixed(0)} USD)`;

  // --- Health ---
  const population = rawData.population || 10000000;
  sources['population'] = rawData.population ? 'Data: World Bank' : 'Default Estimate';

  // Mortality Estimation
  let diarrheaDeathsUnder5 = 0;
  let diarrheaDeathsOver5 = 0;

  if (rawData.washMortality) {
      // Use WHO/WB specific WASH mortality rate (per 100,000)
      const totalWashDeaths = (rawData.washMortality / 100000) * population;
      
      // Heuristic split U5 vs Over 5 (WASH deaths are heavily skewed to U5)
      diarrheaDeathsUnder5 = Math.round(totalWashDeaths * 0.70);
      diarrheaDeathsOver5 = Math.round(totalWashDeaths * 0.30);
      sources['diarrheaDeathsUnder5'] = `Derived from WHO/WB WASH Mortality Rate (${rawData.washMortality.toFixed(1)} per 100k)`;
      sources['diarrheaDeathsOver5'] = `Derived from WHO/WB WASH Mortality Rate`;
  } else {
      // Fallback: Epidemiological approach
      const birthRate = rawData.birthRate || 25; 
      const u5MortalityRate = rawData.mortalityUnder5Rate || 40; 
      const annualBirths = population * (birthRate / 1000);
      const totalU5Deaths = annualBirths * (u5MortalityRate / 1000);
      
      // Assume Diarrhea causes ~9% of U5 deaths
      diarrheaDeathsUnder5 = Math.round(totalU5Deaths * 0.09);
      sources['diarrheaDeathsUnder5'] = rawData.mortalityUnder5Rate ? 'Est. derived from WB Mortality Data (9% fraction)' : 'Default Estimate';

      diarrheaDeathsOver5 = Math.round(diarrheaDeathsUnder5 * 0.35);
      sources['diarrheaDeathsOver5'] = 'Est. relative to U5 deaths';
  }

  // Incidence
  let incidenceU5 = 3.5;
  if (rawData.diarrheaPrevalence) {
      incidenceU5 = rawData.diarrheaPrevalence * 0.25;
      sources['diarrheaIncidenceUnder5'] = `Data: World Bank (Prevalence ${rawData.diarrheaPrevalence.toFixed(1)}%)`;
  } else {
      if (gdpPerCapita > 2000) incidenceU5 = 1.5;
      if (gdpPerCapita > 10000) incidenceU5 = 0.5;
      sources['diarrheaIncidenceUnder5'] = `Est. based on Income Level`;
  }
  
  const incidenceO5 = incidenceU5 * 0.15;
  sources['diarrheaIncidenceOver5'] = `Est. relative to U5`;

  // Seeking Rate
  const seekRate = Math.min(0.95, Math.max(0.4, 0.4 + (gdpPerCapita / 10000) * 0.4));
  sources['treatmentSeekingRate'] = `Est. based on GDP`;

  // Unit Costs
  let costOutpatient = 5;
  if (rawData.healthExpenditure) {
      costOutpatient = Math.max(1, rawData.healthExpenditure * 0.1);
      sources['costOutpatient'] = `Data: World Bank (Health Exp)`;
  } else {
      costOutpatient = Math.max(2, gdpPerCapita * 0.005); 
      sources['costOutpatient'] = `Est. ~0.5% of GDPpc`;
  }
  
  const costInpatient = Math.max(15, costOutpatient * 8);
  sources['costInpatient'] = `Est. ~8x Outpatient Cost`;

  // --- Nutrition ---
  let stuntingPrevalence = 0.30;
  if (rawData.stuntingPrevalence) {
      stuntingPrevalence = rawData.stuntingPrevalence / 100;
      sources['stuntingPrevalence'] = `Data: World Bank (${rawData.stuntingPrevalence.toFixed(1)}%)`;
  } else {
      if (gdpPerCapita < 1000) stuntingPrevalence = 0.40;
      else if (gdpPerCapita < 3000) stuntingPrevalence = 0.25;
      else stuntingPrevalence = 0.10;
      sources['stuntingPrevalence'] = 'Est. based on Income Level';
  }

  // --- Access ---
  const odPrevalence = rawData.openDefecation ? (rawData.openDefecation / 100) : 0.05;
  sources['openDefecationPrevalence'] = rawData.openDefecation ? 'Data: World Bank' : 'Default (5%)';

  // --- Carbon ---
  // Estimate percent of population with poor sanitation
  // Rule: Use 100% - Basic Sanitation (which covers Unimproved + Limited + OD)
  // This is more widely available than Safely Managed.
  let percentPoorSanitation = 0.60;
  
  if (rawData.basicSanitation) {
      percentPoorSanitation = 1 - (rawData.basicSanitation / 100);
      sources['percentWithPoorSanitation'] = `Data: World Bank (Pop. without Basic San.)`;
  } else {
      // Fallback only if basic data missing: OD * 2.5 or just a high default for LDCs
      percentPoorSanitation = Math.min(0.95, odPrevalence * 3 + 0.2); 
      sources['percentWithPoorSanitation'] = 'Est. based on OD & LDC avg';
  }

  // --- Other ---
  const tourismReceipts = rawData.tourismReceipts || (gdpPerCapita * population * 0.02);
  sources['tourismReceipts'] = rawData.tourismReceipts ? 'Data: World Bank' : 'Est. 2% of GDP';

  // Construction
  const inputs: ModelInputs = {
    macro: {
      analysisYear,
      currencyCode,
      exchangeRate,
      gdpPerCapita,
      discountRate: 0.10,
      hourlyWage,
      workingDaysPerYear: 260,
      mortalityMethod: 'humanCapital',
      vslMultiplier: 70,
    },
    health: {
      population,
      diarrheaIncidenceUnder5: parseFloat(incidenceU5.toFixed(2)),
      diarrheaIncidenceOver5: parseFloat(incidenceO5.toFixed(2)),
      diarrheaDeathsUnder5,
      diarrheaDeathsOver5,
      attributionToSanitation: rawData.washMortality ? 1.0 : 0.88,
      treatmentSeekingRate: parseFloat(seekRate.toFixed(2)),
      costOutpatient: parseFloat(costOutpatient.toFixed(2)),
      costInpatient: parseFloat(costInpatient.toFixed(2)),
    },
    nutrition: {
      stuntingPrevalence,
      attributionStunting: 0.50,
      wageLossPercent: 0.10,
    },
    access: {
      openDefecationPrevalence: odPrevalence,
      dailyTimeForOD: 0.5,
    },
    carbon: {
      percentWithPoorSanitation: parseFloat(percentPoorSanitation.toFixed(2)),
      emissionFactorSource: 'IPCC',
      emissionFactor: EMISSION_PRESETS.IPCC,
      socialCostOfCarbon: 100,
    },
    other: {
      choleraResponseCost: gdpPerCapita * 2000,
      funeralCostPerDeath: gdpPerCapita * 0.2,
      tourismLossPercentage: 0.05,
      tourismReceipts,
    }
  };

  sources['analysisYear'] = 'Current Year';
  sources['discountRate'] = 'Model Assumption (Standard)';
  sources['workingDaysPerYear'] = 'Model Assumption';
  sources['attributionToSanitation'] = rawData.washMortality ? 'Included in source data' : 'WHO Estimate (0.88)';
  sources['attributionStunting'] = 'Model Assumption (50%)';
  sources['wageLossPercent'] = 'Literature Estimate (10%)';
  sources['dailyTimeForOD'] = 'Model Assumption (30m/day)';
  sources['tourismLossPercentage'] = 'Model Assumption (5%)';
  sources['choleraResponseCost'] = 'Model Estimate';
  sources['funeralCostPerDeath'] = 'Est. 20% Annual Income';
  sources['mortalityMethod'] = 'User Selection';
  sources['vslMultiplier'] = 'Standard Assumption (70x GDP)';
  
  sources['emissionFactor'] = 'IPCC/SCARE Estimate (Avg latrine)';
  sources['socialCostOfCarbon'] = 'Global Estimate ($100/t)';

  return { inputs, sources };
};
