import { ModelInputs, ModelOutputs, CostBreakdown, ExtendedCostKey } from '../types';

/**
 * Counterfactual (decided 2026-11-26): the costs are what the country loses each year because people do not
 * have at least basic sanitation. Health losses come from WHO's country estimates for inadequate sanitation,
 * whose reference level is stricter than basic, so they include some benefit beyond basic (see ASSUMPTIONS.md).
 */

// Working life used for lost earnings.
const WORK_START_AGE = 15;
const WORK_END_AGE = 65; // exclusive: last working year is 64
// Most under-5 diarrhoea deaths happen in the first two years of life.
export const AGE_AT_DEATH_UNDER5 = 1;
// Admissions for diarrhoea or cholera: share of treated cases admitted.
const SHARE_ADMITTED = 0.1;
const DAYS_LOST_PER_EPISODE = 2;

/**
 * Present value, at the age of death, of the GDP per person a person would have produced over the rest of
 * their working life (ages 15-64). Human capital approach, valued by age at death.
 */
export const humanCapitalPerDeath = (gdpPerCapita: number, discountRate: number, ageAtDeath: number): number => {
  let value = 0;
  for (let age = Math.max(WORK_START_AGE, Math.ceil(ageAtDeath)); age < WORK_END_AGE; age++) {
    value += gdpPerCapita / Math.pow(1 + discountRate, age - ageAtDeath);
  }
  return value;
};

/**
 * Value of a statistical life, Robinson, Hammitt & O'Keeffe (2019) reference case: the US VSL (160 × US income)
 * transferred with an income elasticity (1.5), never below 20 × income per person.
 */
export const valueOfStatisticalLife = (gdpPerCapita: number, usGdpPerCapita: number, elasticity: number): number => {
  const transferred = 160 * usGdpPerCapita * Math.pow(gdpPerCapita / usGdpPerCapita, elasticity);
  return Math.max(20 * gdpPerCapita, transferred);
};

/**
 * Present value of the future earnings lost by one stunted child (incidence-based human capital approach).
 * Earnings start at 15 and last 40 years, grow in real terms, and are discounted to today.
 */
const stuntingLossPerChild = (annualWage: number, wageLossPercent: number, discountRate: number, wageGrowth: number): number => {
  const annualLoss = annualWage * wageLossPercent;
  let npv = 0;
  for (let t = WORK_START_AGE; t < WORK_START_AGE + 40; t++) {
    npv += (annualLoss * Math.pow(1 + wageGrowth, t)) / Math.pow(1 + discountRate, t);
  }
  return npv;
};

export const calculateModelOutputs = (inputs: ModelInputs): ModelOutputs => {
  const { macro, health, nutrition, access, carbon, other } = inputs;
  const dailyWage = macro.hourlyWage * 8;

  // --- 1. Health care ---
  const populationUnder5 = health.population * health.under5Share;
  const totalDiarrheaCases =
    (health.diarrheaIncidenceUnder5 * populationUnder5) +
    (health.diarrheaIncidenceOver5 * (health.population - populationUnder5));
  const attributableCases = totalDiarrheaCases * health.attributionToSanitation;
  const treatedCases = attributableCases * health.treatmentSeekingRate;
  const averageTreatmentCost = (health.costOutpatient * (1 - SHARE_ADMITTED)) + (health.costInpatient * SHARE_ADMITTED);
  const healthCareCostUSD = treatedCases * averageTreatmentCost;

  // --- 2. Days lost to illness (the sick person, or a carer for a child), adult time at 50% of the wage ---
  const productivityCostUSD = attributableCases * DAYS_LOST_PER_EPISODE * dailyWage * access.valueOfTimeAdult;

  // --- 3. Premature deaths ---
  const deathsUnder5 = health.diarrheaDeathsUnder5 * health.attributionToSanitation;
  const deathsOver5 = health.diarrheaDeathsOver5 * health.attributionToSanitation;
  const attributableDeaths = deathsUnder5 + deathsOver5;
  const mortalityHumanCapitalUSD =
    deathsUnder5 * humanCapitalPerDeath(macro.gdpPerCapita, macro.discountRate, AGE_AT_DEATH_UNDER5) +
    deathsOver5 * humanCapitalPerDeath(macro.gdpPerCapita, macro.discountRate, health.ageAtDeathOver5);
  const vslPerDeathUSD = valueOfStatisticalLife(macro.gdpPerCapita, macro.usGdpPerCapita, macro.vslIncomeElasticity);
  const mortalityVslUSD = attributableDeaths * vslPerDeathUSD;
  const mortalityCostUSD = macro.mortalityMethod === 'vsl' ? mortalityVslUSD : mortalityHumanCapitalUSD;

  // --- 4. Stunting (extended) ---
  const annualCohort = populationUnder5 / 5;
  const attributableStunted = annualCohort * nutrition.stuntingPrevalence * nutrition.attributionStunting;
  const nutritionCostUSD = attributableStunted *
    stuntingLossPerChild(dailyWage * macro.workingDaysPerYear, nutrition.wageLossPercent, macro.discountRate, nutrition.realWageGrowth);

  // --- 5. Access time: people aged 5+ who defecate in the open, urban and rural separately ---
  // Adults 15+ valued at valueOfTimeAdult of the wage, children 5-14 at valueOfTimeChild, under-5s not counted.
  const share5plus = Math.max(1e-9, 1 - health.under5Share);
  const childShareOf5plus = Math.min(1, health.children5to14Share / share5plus);
  const valuePerHour = macro.hourlyWage *
    ((1 - childShareOf5plus) * access.valueOfTimeAdult + childShareOf5plus * access.valueOfTimeChild);
  const urbanPeople5plus = health.population * share5plus * access.urbanShare;
  const ruralPeople5plus = health.population * share5plus * (1 - access.urbanShare);
  const hoursPerYear =
    urbanPeople5plus * access.openDefecationUrban * access.dailyTimeForODUrban * 365 +
    ruralPeople5plus * access.openDefecationRural * access.dailyTimeForODRural * 365;
  const accessTimeCostUSD = hoursPerYear * valuePerHour;

  // --- 6. Carbon (extended): people without at least basic sanitation ---
  const totalEmissionsTons = (health.population * carbon.percentWithPoorSanitation * carbon.emissionFactor) / 1000;
  const carbonCostAll = totalEmissionsTons * carbon.socialCostOfCarbon;

  // --- 7. Cholera and funerals ---
  // Cholera cases are costed as admissions; the sanitation share of diarrhoea is applied, as for other diarrhoea.
  const choleraUSD = other.choleraCasesPerYear * health.attributionToSanitation * other.choleraCostPerCase;
  const funeralCostsUSD = attributableDeaths * other.funeralCostPerDeath;
  const choleraAndFuneralsUSD = choleraUSD + funeralCostsUSD;

  // --- 8. Tourism (extended) ---
  const tourismCostUSD = other.tourismReceipts * other.tourismLossPercentage;

  const allCostsUSD: CostBreakdown = {
    healthCare: healthCareCostUSD,
    productivity: productivityCostUSD,
    mortality: mortalityCostUSD,
    nutrition: nutritionCostUSD,
    accessTime: accessTimeCostUSD,
    carbon: carbonCostAll,
    choleraAndFunerals: choleraAndFuneralsUSD,
    tourism: tourismCostUSD,
  };

  const included: Record<ExtendedCostKey, boolean> = {
    nutrition: !!nutrition.includeInTotal,
    tourism: !!other.includeTourismInTotal,
    carbon: !!carbon.includeInTotal,
  };

  const costsUSD: CostBreakdown = {
    ...allCostsUSD,
    nutrition: included.nutrition ? nutritionCostUSD : 0,
    tourism: included.tourism ? tourismCostUSD : 0,
    carbon: included.carbon ? carbonCostAll : 0,
  };

  const totalCostUSD = Object.values(costsUSD).reduce((sum, v) => sum + v, 0);
  const costsLocal = Object.fromEntries(
    Object.entries(costsUSD).map(([k, v]) => [k, v * macro.exchangeRate])
  ) as unknown as CostBreakdown;

  const totalNationalGDP = health.population * macro.gdpPerCapita;
  const percentGDP = totalNationalGDP > 0 ? (totalCostUSD / totalNationalGDP) * 100 : 0;

  return {
    costsUSD,
    allCostsUSD,
    included,
    carbonCostUSD: carbonCostAll,
    carbonIncluded: included.carbon,
    costsLocal,
    totalCostUSD,
    totalCostLocal: totalCostUSD * macro.exchangeRate,
    percentGDP,
    currencyCode: macro.currencyCode,
    mortalityHumanCapitalUSD,
    mortalityVslUSD,
    vslPerDeathUSD,
    attributableDeaths,
    attributableCases,
  };
};

export const EXTENDED_COSTS: ExtendedCostKey[] = ['nutrition', 'tourism', 'carbon'];

const isExtended = (key: keyof CostBreakdown): key is ExtendedCostKey =>
  (EXTENDED_COSTS as string[]).includes(key);

/** Cost categories that make up the total (extended costs only when included). */
export const costEntries = (outputs: ModelOutputs): [keyof CostBreakdown, number][] =>
  (Object.entries(outputs.costsUSD) as [keyof CostBreakdown, number][])
    .filter(([key]) => !isExtended(key) || outputs.included[key]);

/** Extended costs that are shown separately because they are not in the total. */
export const excludedEntries = (outputs: ModelOutputs): [ExtendedCostKey, number][] =>
  EXTENDED_COSTS.filter((key) => !outputs.included[key]).map((key) => [key, outputs.allCostsUSD[key]]);

export const formatCurrency =(val: number, currency: string = 'USD') => {
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
