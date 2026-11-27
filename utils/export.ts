import { ModelInputs, ModelOutputs, DataSourceMap, YearExplanation } from '../types';
import { costEntries, excludedEntries, formatCurrency, formatNumber } from './calculations';
import { runSensitivity } from './uncertainty';
import { runBenefitCost } from './benefitCost';

interface ExportField {
  section: string;
  key: string; // key into the sources map
  label: string;
  unit?: string;
  get: (i: ModelInputs) => number | string;
}

const pct = (v: number) => v * 100;

const INPUT_FIELDS: ExportField[] = [
  { section: 'Macro', key: 'analysisYear', label: 'Analysis Year', unit: 'year', get: (i) => i.macro.analysisYear },
  { section: 'Macro', key: 'exchangeRate', label: 'Exchange Rate', unit: 'LCU per USD', get: (i) => i.macro.exchangeRate },
  { section: 'Macro', key: 'gdpPerCapita', label: 'GDP Per Capita', unit: 'USD/person', get: (i) => i.macro.gdpPerCapita },
  { section: 'Macro', key: 'hourlyWage', label: 'Hourly Wage', unit: 'USD/hour', get: (i) => i.macro.hourlyWage },
  { section: 'Macro', key: 'discountRate', label: 'Discount Rate', unit: '%', get: (i) => pct(i.macro.discountRate) },
  { section: 'Macro', key: 'mortalityMethod', label: 'Mortality Method in Total', get: (i) => i.macro.mortalityMethod },
  { section: 'Macro', key: 'vslIncomeElasticity', label: 'VSL Income Elasticity', get: (i) => i.macro.vslIncomeElasticity },
  { section: 'Macro', key: 'usGdpPerCapita', label: 'US GDP Per Capita', unit: 'USD/person', get: (i) => i.macro.usGdpPerCapita },
  { section: 'Health', key: 'population', label: 'Population', unit: 'people', get: (i) => i.health.population },
  { section: 'Health', key: 'under5Share', label: 'Population Under 5', unit: '%', get: (i) => pct(i.health.under5Share) },
  { section: 'Health', key: 'children5to14Share', label: 'Population Aged 5-14', unit: '%', get: (i) => pct(i.health.children5to14Share) },
  { section: 'Health', key: 'attributionToSanitation', label: 'Share of Diarrhoea Caused by Inadequate Sanitation', unit: '%', get: (i) => pct(i.health.attributionToSanitation) },
  { section: 'Health', key: 'diarrheaIncidenceUnder5', label: 'Under-5 Diarrhoea Incidence', unit: 'cases/person/year', get: (i) => i.health.diarrheaIncidenceUnder5 },
  { section: 'Health', key: 'diarrheaDeathsUnder5', label: 'Under-5 Diarrhoea Deaths (all causes)', unit: 'deaths/year', get: (i) => i.health.diarrheaDeathsUnder5 },
  { section: 'Health', key: 'diarrheaIncidenceOver5', label: 'Over-5 Diarrhoea Incidence', unit: 'cases/person/year', get: (i) => i.health.diarrheaIncidenceOver5 },
  { section: 'Health', key: 'diarrheaDeathsOver5', label: 'Over-5 Diarrhoea Deaths (all causes)', unit: 'deaths/year', get: (i) => i.health.diarrheaDeathsOver5 },
  { section: 'Health', key: 'ageAtDeathOver5', label: 'Average Age at Death (5+)', unit: 'years', get: (i) => i.health.ageAtDeathOver5 },
  { section: 'Health', key: 'treatmentSeekingRate', label: 'Treatment Seeking Rate', unit: '%', get: (i) => pct(i.health.treatmentSeekingRate) },
  { section: 'Health', key: 'costOutpatient', label: 'Outpatient Case Cost', unit: 'USD/case', get: (i) => i.health.costOutpatient },
  { section: 'Health', key: 'costInpatient', label: 'Hospital Admission Cost', unit: 'USD/admission', get: (i) => i.health.costInpatient },
  { section: 'Access', key: 'urbanShare', label: 'Urban Population', unit: '%', get: (i) => pct(i.access.urbanShare) },
  { section: 'Access', key: 'openDefecationUrban', label: 'Open Defecation, Urban', unit: '%', get: (i) => pct(i.access.openDefecationUrban) },
  { section: 'Access', key: 'openDefecationRural', label: 'Open Defecation, Rural', unit: '%', get: (i) => pct(i.access.openDefecationRural) },
  { section: 'Access', key: 'dailyTimeForODUrban', label: 'Extra Time for OD, Urban', unit: 'minutes/day', get: (i) => i.access.dailyTimeForODUrban * 60 },
  { section: 'Access', key: 'dailyTimeForODRural', label: 'Extra Time for OD, Rural', unit: 'minutes/day', get: (i) => i.access.dailyTimeForODRural * 60 },
  { section: 'Access', key: 'valueOfTimeAdult', label: 'Value of Time, Adults 15+', unit: '% of wage', get: (i) => pct(i.access.valueOfTimeAdult) },
  { section: 'Access', key: 'valueOfTimeChild', label: 'Value of Time, Children 5-14', unit: '% of wage', get: (i) => pct(i.access.valueOfTimeChild) },
  { section: 'Cholera', key: 'choleraCasesPerYear', label: 'Cholera Cases per Year', unit: 'cases/year', get: (i) => i.other.choleraCasesPerYear },
  { section: 'Cholera', key: 'choleraCostPerCase', label: 'Cost per Cholera Case', unit: 'USD/case', get: (i) => i.other.choleraCostPerCase },
  { section: 'Cholera', key: 'funeralCostPerDeath', label: 'Funeral Cost per Death', unit: 'USD/death', get: (i) => i.other.funeralCostPerDeath },
  { section: 'Stunting', key: 'stuntingIncluded', label: 'Stunting Included in Total', get: (i) => (i.nutrition.includeInTotal ? 'Yes' : 'No') },
  { section: 'Stunting', key: 'stuntingPrevalence', label: 'Stunting Prevalence', unit: '%', get: (i) => pct(i.nutrition.stuntingPrevalence) },
  { section: 'Stunting', key: 'attributionStunting', label: 'Share of Stunting Caused by Unsafe Sanitation', unit: '%', get: (i) => pct(i.nutrition.attributionStunting) },
  { section: 'Stunting', key: 'wageLossPercent', label: 'Future Wage Penalty', unit: '%', get: (i) => pct(i.nutrition.wageLossPercent) },
  { section: 'Stunting', key: 'realWageGrowth', label: 'Real Wage Growth', unit: '%/year', get: (i) => pct(i.nutrition.realWageGrowth) },
  { section: 'Tourism', key: 'tourismIncluded', label: 'Tourism Included in Total', get: (i) => (i.other.includeTourismInTotal ? 'Yes' : 'No') },
  { section: 'Tourism', key: 'tourismReceipts', label: 'Tourism Receipts', unit: 'USD/year', get: (i) => i.other.tourismReceipts },
  { section: 'Tourism', key: 'tourismLossPercentage', label: 'Tourism Loss Attributable', unit: '%', get: (i) => pct(i.other.tourismLossPercentage) },
  { section: 'Carbon', key: 'carbonIncluded', label: 'Carbon Included in Total', get: (i) => (i.carbon.includeInTotal ? 'Yes' : 'No') },
  { section: 'Carbon', key: 'percentWithPoorSanitation', label: 'Population Without Basic Sanitation', unit: '%', get: (i) => pct(i.carbon.percentWithPoorSanitation) },
  { section: 'Carbon', key: 'emissionFactorSource', label: 'Emission Factor Source', get: (i) => i.carbon.emissionFactorSource },
  { section: 'Carbon', key: 'emissionFactor', label: 'Emission Factor', unit: 'kg CO2e/person/year', get: (i) => i.carbon.emissionFactor },
  { section: 'Carbon', key: 'socialCostOfCarbon', label: 'Social Cost of Carbon', unit: 'USD/tCO2e', get: (i) => i.carbon.socialCostOfCarbon },
  { section: 'Benefit-cost', key: 'withoutBasicUrban', label: 'Without Basic Sanitation, Urban', unit: '%', get: (i) => pct(i.investment.withoutBasicUrban) },
  { section: 'Benefit-cost', key: 'withoutBasicRural', label: 'Without Basic Sanitation, Rural', unit: '%', get: (i) => pct(i.investment.withoutBasicRural) },
  { section: 'Benefit-cost', key: 'capitalCostUrban', label: 'Build Cost per Person, Urban', unit: 'USD', get: (i) => i.investment.capitalCostUrban },
  { section: 'Benefit-cost', key: 'capitalCostRural', label: 'Build Cost per Person, Rural', unit: 'USD', get: (i) => i.investment.capitalCostRural },
  { section: 'Benefit-cost', key: 'upgradeShareUrban', label: 'Need Only an Upgrade (Unimproved Latrine), Urban', unit: '% of those without basic', get: (i) => pct(i.investment.upgradeShareUrban) },
  { section: 'Benefit-cost', key: 'upgradeShareRural', label: 'Need Only an Upgrade (Unimproved Latrine), Rural', unit: '% of those without basic', get: (i) => pct(i.investment.upgradeShareRural) },
  { section: 'Benefit-cost', key: 'upgradeCostPerPerson', label: 'Upgrade Cost per Person (Slab)', unit: 'USD', get: (i) => i.investment.upgradeCostPerPerson },
  { section: 'Benefit-cost', key: 'lifespanUrban', label: 'Lifespan, Urban', unit: 'years', get: (i) => i.investment.lifespanUrban },
  { section: 'Benefit-cost', key: 'lifespanRural', label: 'Lifespan, Rural', unit: 'years', get: (i) => i.investment.lifespanRural },
  { section: 'Benefit-cost', key: 'programmeShare', label: 'Programme Delivery', unit: '% of build cost', get: (i) => pct(i.investment.programmeShare) },
  { section: 'Benefit-cost', key: 'upkeepShare', label: 'Upkeep per Year', unit: '% of build cost', get: (i) => pct(i.investment.upkeepShare) },
];

const csvEscape = (value: string | number | boolean | undefined) => {
  const text = value === undefined ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const triggerDownload = (content: string, filename: string, type: string) => {
  const blob = new Blob(['﻿', content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const downloadAnalysisCsv = (
  countryName: string,
  inputs: ModelInputs,
  outputs: ModelOutputs,
  sources: DataSourceMap,
  yearExplanation?: YearExplanation | null
) => {
  const exportDate = new Date().toISOString();
  const rows: (string | number)[][] = [
    ['Country', countryName],
    ['Exported At', exportDate],
    ['Tool version', __APP_VERSION__],
    ['Aligned Analysis Year', inputs.macro.analysisYear],
    ['Currency Code', inputs.macro.currencyCode],
    ['Counterfactual', 'Everyone has at least basic sanitation'],
  ];
  if (yearExplanation) {
    rows.push(['How the year is chosen', yearExplanation.rule]);
    rows.push(['Core indicators (latest data year)', yearExplanation.core.map((c) => `${c.label} ${c.latestYear ?? 'none'}`).join('; ')]);
    if (yearExplanation.olderOrMissing.length) {
      rows.push(['Older or missing inputs (year used)', yearExplanation.olderOrMissing.map((c) => `${c.label} ${c.usedYear ?? 'no data, estimated'}`).join('; ')]);
    }
  }
  rows.push(
    [],
    ['Section', 'Parameter', 'Value', 'Unit', 'Source Label', 'Source Name', 'Aligned Year', 'Data Year Used', 'Fallback Used', 'Notes'],
  );

  INPUT_FIELDS.forEach((field) => {
    const source = sources[field.key];
    rows.push([
      field.section,
      field.label,
      field.get(inputs),
      field.unit || '',
      source?.label || 'Manual / calculated',
      source?.sourceName || '',
      source?.requestedYear || '',
      source?.actualYear || '',
      source?.fallbackUsed ? 'Yes' : 'No',
      source?.notes || '',
    ]);
  });

  const out = (label: string, value: number | string, unit = 'USD/year', notes = '') =>
    rows.push(['Outputs', label, value, unit, 'Calculated output', 'Sanitation Impact Modeler', inputs.macro.analysisYear, inputs.macro.analysisYear, 'No', notes]);
  out('Total Annual Cost (USD)', outputs.totalCostUSD);
  out('Total Annual Cost (Local Currency)', outputs.totalCostLocal, 'local/year');
  out('Impact on GDP', outputs.percentGDP, '%');
  costEntries(outputs).forEach(([key, value]) => out(COST_LABELS[key] ?? key, value));
  excludedEntries(outputs).forEach(([key, value]) => out(`${COST_LABELS[key] ?? key} (not in total)`, value));
  out('Deaths valued by human capital', outputs.mortalityHumanCapitalUSD, 'USD/year', 'Lost output over the remaining working life, by age at death');
  out('Deaths valued by VSL', outputs.mortalityVslUSD, 'USD/year', `Value of statistical life ${formatCurrency(outputs.vslPerDeathUSD)} per death (Robinson et al. 2019)`);
  out('Deaths attributable to inadequate sanitation', outputs.attributableDeaths, 'deaths/year');

  const bc = runBenefitCost(inputs);
  const bcNote = 'Unit costs: World Bank country estimates (Hutton & Varughese 2016) unless changed';
  out('People without basic sanitation', bc.peopleUrban + bc.peopleRural, 'people', `${Math.round(bc.peopleUrban)} urban, ${Math.round(bc.peopleRural)} rural`);
  out('Upfront investment to reach basic sanitation', bc.upfrontUSD, 'USD', bcNote);
  out('Yearly cost (annualised capital + upkeep)', bc.annualCostUSD, 'USD/year', bcNote);
  out('Benefit-cost ratio', bc.ratio, 'ratio', bcNote);
  out('Payback period (undiscounted)', bc.paybackYears ?? 'never', 'years', `${bcNote}. ${bc.paybackWithinLife ? 'Within' : 'Not within'} the average ${bc.averageLifespan.toFixed(1)}-year life.`);

  const sens = runSensitivity(inputs);
  out('Conservative scenario total', sens.conservative, 'USD/year', 'Every uncertain input at the end of its range that lowers the total');
  out('Upper scenario total', sens.upper, 'USD/year', 'Every uncertain input at the end of its range that raises the total');
  sens.rows.forEach((r) => out(`Sensitivity: ${r.label}`, `${Math.round(r.lowTotal)} to ${Math.round(r.highTotal)}`, 'USD/year (total at low / high)', r.basis));

  const content = rows.map((row) => row.map((cell) => csvEscape(cell as string | number | boolean | undefined)).join(',')).join('\n');
  const filename = `${countryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-sanitation-analysis.csv`;
  triggerDownload(content, filename, 'text/csv;charset=utf-8;');
};

export const COST_LABELS: Record<string, string> = {
  healthCare: 'Health care',
  productivity: 'Days lost to illness',
  mortality: 'Premature deaths',
  nutrition: 'Stunting (future earnings)',
  accessTime: 'Time lost to open defecation',
  carbon: 'Greenhouse gas emissions',
  choleraAndFunerals: 'Cholera and funerals',
  tourism: 'Tourism losses',
};

export const getAdvocacySummary = (outputs: ModelOutputs) => {
  const breakdown = costEntries(outputs)
    .map(([key, value]) => ({
      key,
      label: COST_LABELS[key] ?? key,
      value,
      share: outputs.totalCostUSD > 0 ? (value / outputs.totalCostUSD) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    headline: `${formatCurrency(outputs.totalCostUSD)} lost each year`,
    percentGdp: `${formatNumber(outputs.percentGDP)}% of GDP`,
    topDrivers: breakdown.slice(0, 4),
  };
};
