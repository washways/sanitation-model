
import { ModelInputs, ModelOutputs, CostBreakdown } from '../types';

/**
 * Calculates the Net Present Value (NPV) multiplier for premature mortality.
 * Simplified Human Capital Approach.
 */
const calculateMortalityMultiplier = (gdpPerCapita: number, discountRate: number, yearsLost: number = 20): number => {
  let multiplier = 0;
  for (let t = 0; t < yearsLost; t++) {
    multiplier += gdpPerCapita / Math.pow(1 + discountRate, t);
  }
  return multiplier;
};

/**
 * Calculates NPV of future lost wages due to stunting.
 * Method: Incidence-based Human Capital Approach.
 * We estimate the present value of the future income deficit for the cohort of children
 * who become stunted in the current year.
 * 
 * Assumptions:
 * - Child starts working in 15 years.
 * - Works for 40 years.
 * - Discount rate applies from year 0 (now) to year t.
 */
const calculateNutritionMultiplier = (hourlyWage: number, wageLossPercent: number, discountRate: number): number => {
  const dailyWage = hourlyWage * 8;
  const annualWage = dailyWage * 260;
  const annualLoss = annualWage * wageLossPercent;
  
  let npv = 0;
  const startWorkAge = 15;
  const workDuration = 40;

  for (let t = startWorkAge; t < startWorkAge + workDuration; t++) {
    npv += annualLoss / Math.pow(1 + discountRate, t);
  }
  return npv;
};

export const calculateModelOutputs = (inputs: ModelInputs): ModelOutputs => {
  const { macro, health, nutrition, access, carbon, other } = inputs;

  // --- 1. Health Care Costs ---
  const totalDiarrheaCases = 
    (health.diarrheaIncidenceUnder5 * (health.population * 0.15)) + 
    (health.diarrheaIncidenceOver5 * (health.population * 0.85));

  const attributableCases = totalDiarrheaCases * health.attributionToSanitation;
  const treatedCases = attributableCases * health.treatmentSeekingRate;
  
  const averageTreatmentCost = (health.costOutpatient * 0.9) + (health.costInpatient * 0.1);
  const healthCareCostUSD = treatedCases * averageTreatmentCost;

  // --- 2. Productivity Loss ---
  const daysLostPerEpisode = 2;
  const dailyWage = macro.hourlyWage * 8;
  const productivityCostUSD = attributableCases * daysLostPerEpisode * dailyWage * 0.5;

  // --- 3. Mortality Costs ---
  const totalDeaths = health.diarrheaDeathsUnder5 + health.diarrheaDeathsOver5;
  const attributableDeaths = totalDeaths * health.attributionToSanitation;
  
  let mortalityCostUSD = 0;

  if (macro.mortalityMethod === 'vsl') {
      // Value of Statistical Life approach
      const vsl = macro.gdpPerCapita * macro.vslMultiplier;
      mortalityCostUSD = attributableDeaths * vsl;
  } else {
      // Human Capital Approach (Default)
      const mortalityMultiplier = calculateMortalityMultiplier(macro.gdpPerCapita, macro.discountRate);
      mortalityCostUSD = attributableDeaths * mortalityMultiplier;
  }

  // --- 4. Stunting Costs (Nutrition) ---
  // Approximate annual cohort of children turning 2 (peak stunting risk)
  // 15% of population is U5. Divide by 5 to get one year cohort.
  const populationUnder5 = health.population * 0.15; 
  const annualCohort = populationUnder5 / 5;
  
  const newStuntedCases = annualCohort * nutrition.stuntingPrevalence;
  const attributableStunted = newStuntedCases * nutrition.attributionStunting;
  
  // Calculate NPV of future lost wages for this cohort
  const stuntingCostPerChild = calculateNutritionMultiplier(macro.hourlyWage, nutrition.wageLossPercent, macro.discountRate);
  const nutritionCostUSD = attributableStunted * stuntingCostPerChild;

  // --- 5. Access Time Costs ---
  const odPopulation = health.population * access.openDefecationPrevalence;
  const valueOfAccessTime = macro.hourlyWage * 0.3; 
  const accessTimeCostUSD = odPopulation * 365 * access.dailyTimeForOD * valueOfAccessTime;

  // --- 6. Carbon (GHG) Costs ---
  // Population with poor sanitation (OD, unimproved latrines, septic without treatment)
  const populationPoorSanitation = health.population * carbon.percentWithPoorSanitation;
  
  // Total Annual Emissions in Metric Tons of CO2e
  // Input emissionFactor is kg/person/year -> divide by 1000 for metric tons
  const totalEmissionsTons = (populationPoorSanitation * carbon.emissionFactor) / 1000;
  
  // Economic cost = Emissions * Social Cost of Carbon (NPV of future damage)
  // Note: We do not discount again because SCC typically represents the Present Value of damage per ton emitted *today*.
  const carbonCostUSD = totalEmissionsTons * carbon.socialCostOfCarbon;

  // --- 7. Cholera & Funerals ---
  const funeralCostsUSD = attributableDeaths * other.funeralCostPerDeath;
  const choleraAndFuneralsUSD = other.choleraResponseCost + funeralCostsUSD;

  // --- 8. Tourism ---
  const tourismCostUSD = other.tourismReceipts * other.tourismLossPercentage;

  // --- Aggregation ---
  const costsUSD: CostBreakdown = {
    healthCare: healthCareCostUSD,
    productivity: productivityCostUSD,
    mortality: mortalityCostUSD,
    nutrition: nutritionCostUSD,
    accessTime: accessTimeCostUSD,
    carbon: carbonCostUSD,
    choleraAndFunerals: choleraAndFuneralsUSD,
    tourism: tourismCostUSD
  };

  const totalCostUSD = 
    healthCareCostUSD + 
    productivityCostUSD + 
    mortalityCostUSD + 
    nutritionCostUSD +
    accessTimeCostUSD + 
    carbonCostUSD +
    choleraAndFuneralsUSD + 
    tourismCostUSD;

  // Convert to Local Currency
  const costsLocal: CostBreakdown = {
    healthCare: healthCareCostUSD * macro.exchangeRate,
    productivity: productivityCostUSD * macro.exchangeRate,
    mortality: mortalityCostUSD * macro.exchangeRate,
    nutrition: nutritionCostUSD * macro.exchangeRate,
    accessTime: accessTimeCostUSD * macro.exchangeRate,
    carbon: carbonCostUSD * macro.exchangeRate,
    choleraAndFunerals: choleraAndFuneralsUSD * macro.exchangeRate,
    tourism: tourismCostUSD * macro.exchangeRate
  };

  const totalCostLocal = totalCostUSD * macro.exchangeRate;

  const totalNationalGDP = health.population * macro.gdpPerCapita;
  const percentGDP = totalNationalGDP > 0 ? (totalCostUSD / totalNationalGDP) * 100 : 0;

  return {
    costsUSD,
    costsLocal,
    totalCostUSD,
    totalCostLocal,
    percentGDP,
    currencyCode: macro.currencyCode
  };
};

export const formatCurrency = (val: number, currency: string = 'USD') => {
  // If > 10, round to integer (fractionDigits: 0)
  const fractionDigits = Math.abs(val) >= 10 ? 0 : 2;
  
  try {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currency, 
        maximumFractionDigits: fractionDigits 
    }).format(val);
  } catch (e) {
    // Fallback logic for unsupported currencies
    return `${currency} ${val.toLocaleString('en-US', { maximumFractionDigits: fractionDigits })}`;
  }
};

export const formatNumber = (val: number) => {
  // If > 10, round to integer. Else allow decimals.
  if (Math.abs(val) >= 10) {
      return Math.round(val).toLocaleString('en-US');
  }
  return val.toLocaleString('en-US', { maximumFractionDigits: 1 });
};