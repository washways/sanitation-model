
import { ModelInputs } from './types';

// Focused list of Least Developed Countries (LDCs) and high-priority developing nations for sanitation interventions
export const SUPPORTED_COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', currency: 'AFN' },
  { code: 'AO', name: 'Angola', currency: 'AOA' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT' },
  { code: 'BJ', name: 'Benin', currency: 'XOF' },
  { code: 'BF', name: 'Burkina Faso', currency: 'XOF' },
  { code: 'BI', name: 'Burundi', currency: 'BIF' },
  { code: 'KH', name: 'Cambodia', currency: 'KHR' },
  { code: 'CF', name: 'Central African Republic', currency: 'XAF' },
  { code: 'TD', name: 'Chad', currency: 'XAF' },
  { code: 'CD', name: 'Dem. Rep. Congo', currency: 'CDF' },
  { code: 'DJ', name: 'Djibouti', currency: 'DJF' },
  { code: 'ER', name: 'Eritrea', currency: 'ERN' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB' },
  { code: 'GM', name: 'Gambia', currency: 'GMD' },
  { code: 'GN', name: 'Guinea', currency: 'GNF' },
  { code: 'GW', name: 'Guinea-Bissau', currency: 'XOF' },
  { code: 'HT', name: 'Haiti', currency: 'HTG' },
  { code: 'LA', name: 'Laos', currency: 'LAK' },
  { code: 'LS', name: 'Lesotho', currency: 'LSL' },
  { code: 'LR', name: 'Liberia', currency: 'LRD' },
  { code: 'MG', name: 'Madagascar', currency: 'MGA' },
  { code: 'MW', name: 'Malawi', currency: 'MWK' },
  { code: 'ML', name: 'Mali', currency: 'XOF' },
  { code: 'MR', name: 'Mauritania', currency: 'MRU' },
  { code: 'MZ', name: 'Mozambique', currency: 'MZN' },
  { code: 'MM', name: 'Myanmar', currency: 'MMK' },
  { code: 'NP', name: 'Nepal', currency: 'NPR' },
  { code: 'NE', name: 'Niger', currency: 'XOF' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF' },
  { code: 'SN', name: 'Senegal', currency: 'XOF' },
  { code: 'SL', name: 'Sierra Leone', currency: 'SLE' },
  { code: 'SO', name: 'Somalia', currency: 'SOS' },
  { code: 'SS', name: 'South Sudan', currency: 'SSP' },
  { code: 'SD', name: 'Sudan', currency: 'SDG' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS' },
  { code: 'TL', name: 'Timor-Leste', currency: 'USD' },
  { code: 'TG', name: 'Togo', currency: 'XOF' },
  { code: 'UG', name: 'Uganda', currency: 'UGX' },
  { code: 'YE', name: 'Yemen', currency: 'YER' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW' },
];

export const EMISSION_PRESETS = {
  IPCC: 35, // kg CO2e/person/year (Typical Pit Latrine/Septic in warm climate - IPCC 2019)
  SCARE: 52, // kg CO2e/person/year (Higher estimates from SCARE tool for containment + emptying)
};

// Approximate baseline values for a hypothetical Malawi scenario (Fallback)
export const DEFAULT_INPUTS: ModelInputs = {
  macro: {
    analysisYear: 2023,
    currencyCode: 'MWK',
    exchangeRate: 1700, 
    gdpPerCapita: 600, 
    discountRate: 0.10, 
    hourlyWage: 0.50, 
    workingDaysPerYear: 260,
    mortalityMethod: 'humanCapital',
    vslMultiplier: 70, 
  },
  health: {
    population: 20000000, 
    diarrheaIncidenceUnder5: 3.5, 
    diarrheaIncidenceOver5: 0.5,
    diarrheaDeathsUnder5: 4500, 
    diarrheaDeathsOver5: 1500,
    attributionToSanitation: 0.88, 
    treatmentSeekingRate: 0.60, 
    costOutpatient: 5.0, 
    costInpatient: 40.0, 
  },
  nutrition: {
    stuntingPrevalence: 0.30, // Updated to 30% to align with broader LDC averages
    attributionStunting: 0.50, // Approx 50% of stunting often linked to WASH/Environment
    wageLossPercent: 0.10, // 10% future wage penalty
  },
  access: {
    openDefecationPrevalence: 0.06, 
    dailyTimeForOD: 0.5, 
  },
  carbon: {
    percentWithPoorSanitation: 0.60, // Default estimate (Unimproved + OD)
    emissionFactor: EMISSION_PRESETS.IPCC, // Default to IPCC
    emissionFactorSource: 'IPCC',
    socialCostOfCarbon: 100, // USD per ton
  },
  other: {
    choleraResponseCost: 2000000, 
    funeralCostPerDeath: 200, 
    tourismReceipts: 50000000, 
    tourismLossPercentage: 0.05, 
  }
};

export const COLOR_PALETTE = {
  healthCare: '#1CABE2', // Brand Cyan
  productivity: '#FFC20E', // Brand Accent (Yellow)
  mortality: '#E2231A', // UNICEF Red (approx for alerts)
  nutrition: '#84BD00', // Green
  accessTime: '#00833D', // Dark Green
  choleraAndFunerals: '#80276C', // Purple
  tourism: '#004C97', // Secondary Blue
  carbon: '#475569', // Slate/Dark Grey for Carbon
};
