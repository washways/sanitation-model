import { ModelInputs, UncertaintyKey } from '../types';
import { calculateModelOutputs } from './calculations';

/**
 * The inputs that carry uncertainty, how to scale each one, and when it matters.
 * Ranges (low/high multiples) live in inputs.ranges: WHO and WHO-CHOICE intervals where a country has them,
 * otherwise the defaults in constants.ts.
 */
interface UncertainParam {
  key: UncertaintyKey;
  label: string;
  apply: (inputs: ModelInputs, factor: number) => void; // mutates a copy
  active?: (inputs: ModelInputs) => boolean;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export const UNCERTAIN_PARAMS: UncertainParam[] = [
  {
    key: 'attributionToSanitation',
    label: 'Share of diarrhoea caused by sanitation',
    apply: (i, f) => { i.health.attributionToSanitation = clamp(i.health.attributionToSanitation * f, 0, 1); },
  },
  {
    key: 'diarrheaDeaths',
    label: 'Diarrhoea deaths',
    apply: (i, f) => { i.health.diarrheaDeathsUnder5 *= f; i.health.diarrheaDeathsOver5 *= f; },
  },
  {
    key: 'diarrheaIncidence',
    label: 'Diarrhoea episodes per person',
    apply: (i, f) => { i.health.diarrheaIncidenceUnder5 *= f; i.health.diarrheaIncidenceOver5 *= f; },
  },
  { key: 'costOutpatient', label: 'Outpatient cost', apply: (i, f) => { i.health.costOutpatient *= f; } },
  { key: 'costInpatient', label: 'Inpatient cost', apply: (i, f) => { i.health.costInpatient *= f; } },
  {
    key: 'treatmentSeekingRate',
    label: 'Share of cases treated',
    apply: (i, f) => { i.health.treatmentSeekingRate = clamp(i.health.treatmentSeekingRate * f, 0, 1); },
  },
  {
    key: 'discountRate',
    label: 'Discount rate',
    apply: (i, f) => { i.macro.discountRate = clamp(i.macro.discountRate * f, 0, 0.3); },
    active: (i) => i.macro.mortalityMethod === 'humanCapital' || i.nutrition.includeInTotal,
  },
  { key: 'hourlyWage', label: 'Wage (value of time)', apply: (i, f) => { i.macro.hourlyWage *= f; } },
  {
    key: 'ageAtDeathOver5',
    label: 'Age at death (5 and over)',
    apply: (i, f) => { i.health.ageAtDeathOver5 = clamp(i.health.ageAtDeathOver5 * f, 5, 90); },
    active: (i) => i.macro.mortalityMethod === 'humanCapital',
  },
  {
    key: 'dailyTimeForOD',
    label: 'Time lost to open defecation',
    apply: (i, f) => { i.access.dailyTimeForODUrban *= f; i.access.dailyTimeForODRural *= f; },
  },
  { key: 'choleraCasesPerYear', label: 'Cholera cases', apply: (i, f) => { i.other.choleraCasesPerYear *= f; } },
  {
    key: 'attributionStunting',
    label: 'Share of stunting caused by sanitation',
    apply: (i, f) => { i.nutrition.attributionStunting = clamp(i.nutrition.attributionStunting * f, 0, 1); },
    active: (i) => i.nutrition.includeInTotal,
  },
  {
    key: 'tourismLossPercentage',
    label: 'Tourism loss',
    apply: (i, f) => { i.other.tourismLossPercentage = clamp(i.other.tourismLossPercentage * f, 0, 1); },
    active: (i) => i.other.includeTourismInTotal,
  },
  {
    key: 'emissionFactor',
    label: 'Emissions per person',
    apply: (i, f) => { i.carbon.emissionFactor *= f; },
    active: (i) => i.carbon.includeInTotal,
  },
  {
    key: 'socialCostOfCarbon',
    label: 'Social cost of carbon',
    apply: (i, f) => { i.carbon.socialCostOfCarbon *= f; },
    active: (i) => i.carbon.includeInTotal,
  },
];

export const activeParams = (inputs: ModelInputs) => UNCERTAIN_PARAMS.filter((p) => !p.active || p.active(inputs));

/** Shallow copy of each section, enough because every section is flat. */
export const copyInputs = (inputs: ModelInputs): ModelInputs => ({
  macro: { ...inputs.macro },
  health: { ...inputs.health },
  nutrition: { ...inputs.nutrition },
  access: { ...inputs.access },
  carbon: { ...inputs.carbon },
  other: { ...inputs.other },
  ranges: inputs.ranges,
});

export interface SensitivityRow {
  key: UncertaintyKey;
  label: string;
  basis: string;
  lowTotal: number; // total with this input at its low value
  highTotal: number; // total with this input at its high value
  swing: number;
}

export interface SensitivityResult {
  baseTotal: number;
  rows: SensitivityRow[]; // largest swing first
  conservative: number; // every input at the end of its range that gives the lower total
  upper: number; // every input at the end that gives the higher total
}

/** One-way sensitivity (tornado) plus conservative and upper scenarios. */
export const runSensitivity = (inputs: ModelInputs): SensitivityResult => {
  const baseTotal = calculateModelOutputs(inputs).totalCostUSD;
  const params = activeParams(inputs);
  const rows: SensitivityRow[] = params.map((p) => {
    const range = inputs.ranges[p.key];
    const low = copyInputs(inputs);
    p.apply(low, range.low);
    const high = copyInputs(inputs);
    p.apply(high, range.high);
    const lowTotal = calculateModelOutputs(low).totalCostUSD;
    const highTotal = calculateModelOutputs(high).totalCostUSD;
    return { key: p.key, label: p.label, basis: range.basis, lowTotal, highTotal, swing: Math.abs(highTotal - lowTotal) };
  }).filter((r) => r.swing > baseTotal * 0.001);
  rows.sort((a, b) => b.swing - a.swing);

  const conservativeInputs = copyInputs(inputs);
  const upperInputs = copyInputs(inputs);
  for (const p of params) {
    const range = inputs.ranges[p.key];
    const row = rows.find((r) => r.key === p.key);
    const lowIsLower = !row || row.lowTotal <= row.highTotal;
    p.apply(conservativeInputs, lowIsLower ? range.low : range.high);
    p.apply(upperInputs, lowIsLower ? range.high : range.low);
  }

  return {
    baseTotal,
    rows,
    conservative: calculateModelOutputs(conservativeInputs).totalCostUSD,
    upper: calculateModelOutputs(upperInputs).totalCostUSD,
  };
};

/** Triangular draw between low and high with the mode at 1 (the current value). */
export const drawFactor = (low: number, high: number): number => {
  if (high <= low) return 1;
  const mode = clamp(1, low, high);
  const u = Math.random();
  const c = (mode - low) / (high - low);
  return u < c
    ? low + Math.sqrt(u * (high - low) * (mode - low))
    : high - Math.sqrt((1 - u) * (high - low) * (high - mode));
};
