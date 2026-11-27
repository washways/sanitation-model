import { ModelInputs, UncertaintyRanges } from './types';
import COUNTRIES from './data/countries.json';

// All 44 UN Least Developed Countries (list after São Tomé and Príncipe graduated in Dec 2024; Bangladesh,
// Lao PDR and Nepal were scheduled to graduate on 24 Nov 2026 and are kept), plus Zimbabwe (not an LDC).
// The list lives in data/countries.json so scripts/build-evidence.mjs can read it too.
export const SUPPORTED_COUNTRIES: { code: string; iso3: string; name: string; currency: string }[] = COUNTRIES;

export const EMISSION_PRESETS = {
  IPCC: 35, // kg CO2e/person/year (Typical Pit Latrine/Septic in warm climate - IPCC 2019)
  SCARE: 52, // kg CO2e/person/year (Higher estimates from SCARE tool for containment + emptying)
};

/**
 * Default uncertainty ranges (low and high as multiples of the input). Country estimates replace the first few
 * with WHO's and WHO-CHOICE's own 95% uncertainty intervals where they exist (utils/estimators.ts).
 */
export const DEFAULT_RANGES: UncertaintyRanges = {
  attributionToSanitation: { low: 0.75, high: 1.25, basis: '±25% (no country interval available)' },
  diarrheaDeaths: { low: 0.7, high: 1.3, basis: '±30% (no country interval available)' },
  diarrheaIncidence: { low: 0.6, high: 1.4, basis: '±40%: income-based estimate, no country data' },
  costOutpatient: { low: 0.5, high: 2, basis: 'Half to double (no WHO-CHOICE interval available)' },
  costInpatient: { low: 0.5, high: 2, basis: 'Half to double (no WHO-CHOICE interval available)' },
  treatmentSeekingRate: { low: 0.75, high: 1.25, basis: '±25%: rough proxy' },
  discountRate: { low: 0.6, high: 1.4, basis: '3% to 7% (iDSI reference case 3%; Haacker et al. 2020 at least 5%)' },
  hourlyWage: { low: 0.7, high: 1.3, basis: '±30%: GDP-based wage proxy' },
  ageAtDeathOver5: { low: 0.75, high: 1.25, basis: '±25%: derived from WHO deaths and DALYs' },
  dailyTimeForOD: { low: 0.5, high: 1.5, basis: '5 to 15 minutes (Radin et al. 2020: 4–12 minutes per visit)' },
  choleraCasesPerYear: { low: 0.5, high: 2, basis: 'Half to double: outbreaks vary a lot from year to year' },
  attributionStunting: { low: 0, high: 1.5, basis: '0 to 24%: trials found no effect of household WASH on growth' },
  tourismLossPercentage: { low: 0, high: 2, basis: '0 to 10%: no published estimate' },
  emissionFactor: { low: 0.06, high: 2.7, basis: 'Cheng et al. 2022 range (22–1,003 around 377 Mt CO2e)' },
  socialCostOfCarbon: { low: 0.5, high: 1.9, basis: 'US$50–190 per tonne (Rennert et al. 2022)' },
};

/**
 * Basic-sanitation cost assumptions from Hutton & Varughese (2016), The Costs of Meeting the 2030 SDG Targets on
 * Drinking Water, Sanitation, and Hygiene, World Bank WSP. Country unit costs (table E.1, US$ 2015, hardware +
 * software) are in data/sanitationUnitCosts.json. Technology mix: table D.1. Life, capital maintenance and
 * operating costs: table D.2.
 */
export const SANITATION_COSTING = {
  source: 'Hutton & Varughese 2016 (World Bank)',
  link: 'https://www.fsmtoolbox.com/assets/pdf/The_costs_of_Meeting_the_2030_SDG_in_WASH.pdf',
  priceYear: 2015,
  urbanSepticShare: 0.5, // urban: 50% flush to septic tank, 50% pit latrine
  ruralPourFlushShare: 0.5, // rural: 50% pour-flush pit, 50% dry pit
  lifespanSeptic: 20,
  lifespanPit: 8,
  capitalMaintenanceShare: 0.3, // 30% of initial capital, once per life (at half-life)
  pitOperatingShare: 0.05, // 5% of initial capital a year for pit latrines; none given for septic tanks
};

/**
 * Upgrading an unimproved latrine (a pit without a slab) to basic: a concrete sanitation platform (SanPlat).
 * Peletz et al. (2017), Environmental Science & Technology: average cost of supplying a concrete SanPlat to a
 * household in rural Tanzania US$7.51 (plastic platform US$23.28). Programme delivery added at the World Bank
 * study's 20% for rural sanitation; household size of 5 is an assumption.
 */
export const LATRINE_UPGRADE = {
  source: 'Peletz et al. 2017',
  link: 'https://susana.org/knowledge-hub/resources?id=2883',
  slabCostPerHousehold: 7.51,
  plasticSlabCostPerHousehold: 23.28,
  priceYear: 2015,
  softwareShare: 0.2,
  householdSize: 5,
};

/** Used only when a country has no World Bank unit costs (all 45 currently have them): Malawi's 2015 values. */
export const FALLBACK_INVESTMENT_COSTS = {
  capitalCostUrban: 82,
  capitalCostRural: 24,
  upgradeShareUrban: 0,
  upgradeShareRural: 0,
  upgradeCostPerPerson: 1.8,
  programmeShare: 0,
  upkeepShare: 0.07,
  lifespanUrban: 17,
  lifespanRural: 8,
};

// Approximate fallback baseline values used before country-specific data is loaded
export const DEFAULT_INPUTS: ModelInputs = {
  macro: {
    analysisYear: 2023,
    currencyCode: 'MWK',
    exchangeRate: 1161,
    gdpPerCapita: 600,
    discountRate: 0.05,
    hourlyWage: 0.23,
    workingDaysPerYear: 260,
    mortalityMethod: 'humanCapital',
    usGdpPerCapita: 82000,
    vslIncomeElasticity: 1.5,
  },
  health: {
    population: 20000000,
    under5Share: 0.15,
    children5to14Share: 0.27,
    diarrheaIncidenceUnder5: 3.5,
    diarrheaIncidenceOver5: 0.5,
    diarrheaDeathsUnder5: 1800, // all diarrhoea deaths
    diarrheaDeathsOver5: 5000,
    attributionToSanitation: 0.38, // WHO 2023 global: unsafe sanitation alone
    ageAtDeathOver5: 45,
    treatmentSeekingRate: 0.60,
    costOutpatient: 2.0,
    costInpatient: 15.0,
  },
  nutrition: {
    stuntingPrevalence: 0.30,
    attributionStunting: 0.16, // Danaei et al. 2016: unimproved sanitation
    wageLossPercent: 0.10, // 10% future wage penalty
    realWageGrowth: 0.015, // Radin et al. 2020
    includeInTotal: false,
  },
  access: {
    urbanShare: 0.18,
    openDefecationUrban: 0.01,
    openDefecationRural: 0.03,
    dailyTimeForODUrban: 10 / 60, // about 10 minutes (Hickling & Hutton 2014; Radin et al. 2020)
    dailyTimeForODRural: 10 / 60,
    valueOfTimeAdult: 0.5, // Radin et al. 2020
    valueOfTimeChild: 0.25,
  },
  carbon: {
    percentWithPoorSanitation: 0.50, // without at least basic sanitation
    emissionFactor: EMISSION_PRESETS.IPCC,
    emissionFactorSource: 'IPCC',
    socialCostOfCarbon: 100, // USD per ton
    includeInTotal: false,
  },
  other: {
    choleraCasesPerYear: 0,
    choleraCostPerCase: 20,
    funeralCostPerDeath: 120,
    tourismReceipts: 50000000,
    tourismLossPercentage: 0.05,
    includeTourismInTotal: false,
  },
  investment: {
    withoutBasicUrban: 0.5,
    withoutBasicRural: 0.5,
    ...FALLBACK_INVESTMENT_COSTS,
  },
  ranges: DEFAULT_RANGES,
};

export const COLOR_PALETTE = {
  healthCare: '#0B6E80', // Brand Teal
  productivity: '#FFC20E', // Brand Accent (Yellow)
  mortality: '#E2231A', // UNICEF Red (approx for alerts)
  nutrition: '#84BD00', // Green
  accessTime: '#00833D', // Dark Green
  choleraAndFunerals: '#80276C', // Purple
  tourism: '#004C97', // Secondary Blue
  carbon: '#475569', // Slate/Dark Grey for Carbon
};
