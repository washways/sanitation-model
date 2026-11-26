
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

export interface IndicatorYearInfo {
  label: string; // short, plain-language name
  latestYear: number | null; // latest year with data (2015 onwards); null = no data
  usedYear?: number | null; // year actually used for the analysis
}

/** Why the analysis year is what it is — shown in the app, PDF and CSV. */
export interface YearExplanation {
  rule: string; // one-sentence description of the rule
  core: IndicatorYearInfo[]; // indicators that set the year
  limiting: string[]; // core indicators whose data stops at the analysis year
  olderOrMissing: IndicatorYearInfo[]; // non-core inputs that use an older year or have no data
}

export interface CountryApiData {
  analysisYear: number;
  alignmentStrategy: 'latest-common-year' | 'best-coverage-year';
  fallbackFields: string[];
  yearExplanation: YearExplanation;
  fields: {
    population: CountryIndicatorValue;
    gdpPerCapita: CountryIndicatorValue;
    openDefecation: CountryIndicatorValue;
    mortalityUnder5Rate: CountryIndicatorValue;
    tourismReceipts: CountryIndicatorValue;
    birthRate: CountryIndicatorValue;
    healthExpenditure: CountryIndicatorValue;
    stuntingPrevalence: CountryIndicatorValue;
    washMortality: CountryIndicatorValue;
    exchangeRate: CountryIndicatorValue;
    basicSanitation: CountryIndicatorValue;
    urbanShare: CountryIndicatorValue;
    openDefecationUrban: CountryIndicatorValue;
    openDefecationRural: CountryIndicatorValue;
    basicSanitationUrban: CountryIndicatorValue;
    basicSanitationRural: CountryIndicatorValue;
    children0to14Share: CountryIndicatorValue;
  };
  usGdpPerCapita: number | null; // same year, for transferring the value of a statistical life
  usDeflatorRatio: number | null; // US GDP deflator, analysis year ÷ 2010 (inflates WHO-CHOICE 2010 costs)
}

export interface MacroInputs {
  analysisYear: number;
  currencyCode: string; // e.g., 'MWK', 'INR', 'NGN'
  exchangeRate: number; // LCU per USD (official rate for the analysis year)
  gdpPerCapita: number; // USD
  discountRate: number; // Percentage (0.0 - 1.0)
  hourlyWage: number; // USD
  workingDaysPerYear: number;
  mortalityMethod: MortalityMethod; // 'humanCapital' (headline) or 'vsl'
  usGdpPerCapita: number; // USD, for the VSL income transfer
  vslIncomeElasticity: number; // Robinson et al. 2019 reference case: 1.5
}

export interface HealthInputs {
  population: number;
  under5Share: number; // 0.0 - 1.0 share of population aged under 5
  children5to14Share: number; // 0.0 - 1.0 share of population aged 5-14
  diarrheaIncidenceUnder5: number; // Cases per person per year
  diarrheaIncidenceOver5: number;
  diarrheaDeathsUnder5: number; // ALL diarrhoea deaths (not yet attributed)
  diarrheaDeathsOver5: number;
  attributionToSanitation: number; // 0.0 - 1.0 share of diarrhoea cases and deaths caused by unsafe sanitation
  ageAtDeathOver5: number; // average age of diarrhoea deaths aged 5+, years
  treatmentSeekingRate: number; // 0.0 - 1.0
  costOutpatient: number; // USD per outpatient case (visit + drugs)
  costInpatient: number; // USD per admission (bed-days + drugs)
}

export interface NutritionInputs {
  stuntingPrevalence: number; // 0.0 - 1.0 (Prevalence in U5)
  attributionStunting: number; // 0.0 - 1.0 (Fraction attributable to sanitation)
  wageLossPercent: number; // 0.0 - 1.0 (Future income loss per stunted child)
  realWageGrowth: number; // yearly real wage growth applied to future earnings
  includeInTotal: boolean; // Off by default: trials found no effect of household WASH on growth
}

export interface AccessTimeInputs {
  urbanShare: number; // 0.0 - 1.0 share of population living in urban areas
  openDefecationUrban: number; // 0.0 - 1.0
  openDefecationRural: number; // 0.0 - 1.0
  dailyTimeForODUrban: number; // Hours per person per day
  dailyTimeForODRural: number; // Hours per person per day
  valueOfTimeAdult: number; // share of the wage, people aged 15+
  valueOfTimeChild: number; // share of the wage, children aged 5-14
}

export interface CarbonInputs {
  percentWithPoorSanitation: number; // 0.0 - 1.0 (population without at least basic sanitation)
  emissionFactor: number; // kg CO2e per person per year
  emissionFactorSource: 'IPCC' | 'SCARE' | 'Custom'; // Source of the factor
  socialCostOfCarbon: number; // USD per ton CO2e
  includeInTotal: boolean; // Off by default: global climate damage, not a national cost of poor sanitation
}

export interface OtherCostsInputs {
  choleraCasesPerYear: number; // reported cases, all causes
  choleraCostPerCase: number; // USD (treatment as an admission + lost work)
  funeralCostPerDeath: number; // USD
  tourismLossPercentage: number; // Percentage of receipts
  tourismReceipts: number; // USD
  includeTourismInTotal: boolean; // Off by default: no published evidence
}

/** Relative uncertainty for one input: the low and high values as multiples of the current value. */
export interface UncertaintyRange {
  low: number;
  high: number;
  basis: string; // where the range comes from
}

export type UncertaintyKey =
  | 'attributionToSanitation'
  | 'diarrheaDeaths'
  | 'diarrheaIncidence'
  | 'costOutpatient'
  | 'costInpatient'
  | 'treatmentSeekingRate'
  | 'discountRate'
  | 'hourlyWage'
  | 'ageAtDeathOver5'
  | 'dailyTimeForOD'
  | 'choleraCasesPerYear'
  | 'attributionStunting'
  | 'tourismLossPercentage'
  | 'emissionFactor'
  | 'socialCostOfCarbon';

export type UncertaintyRanges = Record<UncertaintyKey, UncertaintyRange>;

export interface ModelInputs {
  macro: MacroInputs;
  health: HealthInputs;
  nutrition: NutritionInputs;
  access: AccessTimeInputs;
  carbon: CarbonInputs;
  other: OtherCostsInputs;
  ranges: UncertaintyRanges;
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
}

/** Costs that can be left out of the headline total (shown separately). */
export type ExtendedCostKey = 'nutrition' | 'tourism' | 'carbon';

export interface ModelOutputs {
  // costsUSD holds 0 for an extended cost that is not included in the total; allCostsUSD always holds the value.
  costsUSD: CostBreakdown;
  allCostsUSD: CostBreakdown;
  included: Record<ExtendedCostKey, boolean>;
  carbonCostUSD: number;
  carbonIncluded: boolean;
  costsLocal: CostBreakdown;
  totalCostUSD: number;
  totalCostLocal: number;
  percentGDP: number;
  currencyCode: string;
  // Deaths valued both ways, whichever method is selected for the total.
  mortalityHumanCapitalUSD: number;
  mortalityVslUSD: number;
  vslPerDeathUSD: number;
  attributableDeaths: number;
  attributableCases: number;
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
