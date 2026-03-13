
export type MortalityMethod = 'humanCapital' | 'vsl';
export type DataSourceKind = 'api' | 'live' | 'derived' | 'estimate' | 'assumption' | 'user';
export type DataSourceTone = 'success' | 'warning' | 'danger' | 'neutral';

export interface DataSourceInfo {
  label: string;
  kind: DataSourceKind;
  sourceName?: string;
  indicatorCode?: string;
  requestedYear?: number;
  actualYear?: number;
  fallbackUsed?: boolean;
  fallbackDirection?: 'earlier' | 'later';
  tone?: DataSourceTone;
  notes?: string;
  link?: string;
}

export interface CountryIndicatorValue {
  value: number | null;
  source: DataSourceInfo;
}

export interface CountryApiData {
  analysisYear: number;
  alignmentStrategy: 'latest-common-year' | 'best-coverage-year';
  fallbackFields: string[];
  fields: {
    population: CountryIndicatorValue;
    gdpPerCapita: CountryIndicatorValue;
    openDefecation: CountryIndicatorValue;
    mortalityUnder5Rate: CountryIndicatorValue;
    tourismReceipts: CountryIndicatorValue;
    birthRate: CountryIndicatorValue;
    healthExpenditure: CountryIndicatorValue;
    diarrheaPrevalence: CountryIndicatorValue;
    stuntingPrevalence: CountryIndicatorValue;
    washMortality: CountryIndicatorValue;
    exchangeRate: CountryIndicatorValue;
    basicSanitation: CountryIndicatorValue;
  };
}

export interface MacroInputs {
  analysisYear: number;
  currencyCode: string; // e.g., 'MWK', 'INR', 'NGN'
  exchangeRate: number; // LCU per USD
  gdpPerCapita: number; // USD
  discountRate: number; // Percentage (0.0 - 1.0)
  hourlyWage: number; // USD
  workingDaysPerYear: number;
  mortalityMethod: MortalityMethod; // 'humanCapital' or 'vsl'
  vslMultiplier: number; // For VSL method (Multiple of GDPpc)
}

export interface HealthInputs {
  population: number;
  diarrheaIncidenceUnder5: number; // Cases per person per year
  diarrheaIncidenceOver5: number;
  diarrheaDeathsUnder5: number;
  diarrheaDeathsOver5: number;
  attributionToSanitation: number; // 0.0 - 1.0 (Attributable fraction)
  treatmentSeekingRate: number; // 0.0 - 1.0
  costOutpatient: number; // USD
  costInpatient: number; // USD
}

export interface NutritionInputs {
  stuntingPrevalence: number; // 0.0 - 1.0 (Prevalence in U5)
  attributionStunting: number; // 0.0 - 1.0 (Fraction attributable to sanitation)
  wageLossPercent: number; // 0.0 - 1.0 (Future income loss per stunted child)
}

export interface AccessTimeInputs {
  openDefecationPrevalence: number; // 0.0 - 1.0
  dailyTimeForOD: number; // Hours per person per day
}

export interface CarbonInputs {
  percentWithPoorSanitation: number; // 0.0 - 1.0 (Pop using unimproved/OD)
  emissionFactor: number; // kg CO2e per person per year
  emissionFactorSource: 'IPCC' | 'SCARE' | 'Custom'; // Source of the factor
  socialCostOfCarbon: number; // USD per ton CO2e
}

export interface OtherCostsInputs {
  choleraResponseCost: number; // USD
  funeralCostPerDeath: number; // USD
  tourismLossPercentage: number; // Percentage of receipts
  tourismReceipts: number; // USD
}

export interface ModelInputs {
  macro: MacroInputs;
  health: HealthInputs;
  nutrition: NutritionInputs;
  access: AccessTimeInputs;
  carbon: CarbonInputs;
  other: OtherCostsInputs;
}

export interface CostBreakdown {
  healthCare: number;
  productivity: number;
  mortality: number;
  nutrition: number;
  accessTime: number;
  choleraAndFunerals: number;
  tourism: number;
  carbon: number;
  waterTreatment?: number; // Optional, currently not used in main logic but kept for extensibility
}

export interface ModelOutputs {
  costsUSD: CostBreakdown;
  costsLocal: CostBreakdown;
  totalCostUSD: number;
  totalCostLocal: number;
  percentGDP: number;
  currencyCode: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

export type DataSourceMap = Record<string, DataSourceInfo>;

// Monte Carlo & Comparison Types
export interface SimulationStats {
  mean: number;
  meanBreakdown: CostBreakdown; // Mean of each component
  median: number;
  p5: number;
  p95: number;
  stdDev: number;
  iterations: number;
  distribution: number[]; // Array of total costs for histogram
}

export interface CountryComparisonResult {
  code: string;
  name: string;
  inputs: ModelInputs;
  stats: SimulationStats;
  percentGDP_Mean: number;
}
