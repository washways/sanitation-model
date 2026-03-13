import { ModelInputs, ModelOutputs, DataSourceMap } from '../types';
import { formatCurrency, formatNumber } from './calculations';

interface ExportField {
  section: string;
  key: keyof DataSourceMap | string;
  label: string;
  value: number | string;
  unit?: string;
}

const INPUT_FIELDS: ExportField[] = [
  { section: 'Macro', key: 'analysisYear', label: 'Analysis Year', value: 0, unit: 'year' },
  { section: 'Macro', key: 'exchangeRate', label: 'Exchange Rate', value: 0, unit: 'LCU per USD' },
  { section: 'Macro', key: 'gdpPerCapita', label: 'GDP Per Capita', value: 0, unit: 'USD/person' },
  { section: 'Macro', key: 'hourlyWage', label: 'Hourly Wage', value: 0, unit: 'USD/hour' },
  { section: 'Macro', key: 'discountRate', label: 'Discount Rate', value: 0, unit: '%' },
  { section: 'Macro', key: 'mortalityMethod', label: 'Mortality Method', value: '' },
  { section: 'Macro', key: 'vslMultiplier', label: 'VSL Multiplier', value: 0, unit: 'x GDPpc' },
  { section: 'Health', key: 'population', label: 'Population', value: 0, unit: 'people' },
  { section: 'Health', key: 'attributionToSanitation', label: 'Attributable to Sanitation', value: 0, unit: '%' },
  { section: 'Health', key: 'diarrheaIncidenceUnder5', label: 'Under-5 Diarrhea Incidence', value: 0, unit: 'cases/person/year' },
  { section: 'Health', key: 'diarrheaDeathsUnder5', label: 'Under-5 Diarrhea Deaths', value: 0, unit: 'deaths/year' },
  { section: 'Health', key: 'diarrheaIncidenceOver5', label: 'Over-5 Diarrhea Incidence', value: 0, unit: 'cases/person/year' },
  { section: 'Health', key: 'diarrheaDeathsOver5', label: 'Over-5 Diarrhea Deaths', value: 0, unit: 'deaths/year' },
  { section: 'Health', key: 'treatmentSeekingRate', label: 'Treatment Seeking Rate', value: 0, unit: '%' },
  { section: 'Health', key: 'costOutpatient', label: 'Outpatient Cost', value: 0, unit: 'USD/case' },
  { section: 'Health', key: 'costInpatient', label: 'Inpatient Cost', value: 0, unit: 'USD/case' },
  { section: 'Nutrition', key: 'stuntingPrevalence', label: 'Stunting Prevalence', value: 0, unit: '%' },
  { section: 'Nutrition', key: 'attributionStunting', label: 'Attributable Stunting', value: 0, unit: '%' },
  { section: 'Nutrition', key: 'wageLossPercent', label: 'Future Wage Penalty', value: 0, unit: '%' },
  { section: 'Access', key: 'openDefecationPrevalence', label: 'Open Defecation Prevalence', value: 0, unit: '%' },
  { section: 'Access', key: 'dailyTimeForOD', label: 'Time Spent on OD', value: 0, unit: 'hours/day' },
  { section: 'Carbon', key: 'percentWithPoorSanitation', label: 'Population with Poor Sanitation', value: 0, unit: '%' },
  { section: 'Carbon', key: 'emissionFactorSource', label: 'Emission Factor Source', value: '' },
  { section: 'Carbon', key: 'emissionFactor', label: 'Emission Factor', value: 0, unit: 'kg CO2e/person/year' },
  { section: 'Carbon', key: 'socialCostOfCarbon', label: 'Social Cost of Carbon', value: 0, unit: 'USD/tCO2e' },
  { section: 'Other', key: 'tourismReceipts', label: 'Tourism Receipts', value: 0, unit: 'USD/year' },
  { section: 'Other', key: 'tourismLossPercentage', label: 'Tourism Loss Attributable', value: 0, unit: '%' },
  { section: 'Other', key: 'choleraResponseCost', label: 'Cholera Response Cost', value: 0, unit: 'USD/year' },
  { section: 'Other', key: 'funeralCostPerDeath', label: 'Funeral Cost per Death', value: 0, unit: 'USD/death' },
];

const OUTPUT_FIELDS: ExportField[] = [
  { section: 'Outputs', key: 'totalCostUSD', label: 'Total Annual Cost (USD)', value: 0, unit: 'USD/year' },
  { section: 'Outputs', key: 'totalCostLocal', label: 'Total Annual Cost (Local Currency)', value: 0, unit: 'local/year' },
  { section: 'Outputs', key: 'percentGDP', label: 'Impact on GDP', value: 0, unit: '%' },
  { section: 'Outputs', key: 'healthCare', label: 'Health Care Cost', value: 0, unit: 'USD/year' },
  { section: 'Outputs', key: 'productivity', label: 'Productivity Cost', value: 0, unit: 'USD/year' },
  { section: 'Outputs', key: 'mortality', label: 'Mortality Cost', value: 0, unit: 'USD/year' },
  { section: 'Outputs', key: 'nutrition', label: 'Stunting Cost', value: 0, unit: 'USD/year' },
  { section: 'Outputs', key: 'accessTime', label: 'Access Time Cost', value: 0, unit: 'USD/year' },
  { section: 'Outputs', key: 'carbon', label: 'Carbon Cost', value: 0, unit: 'USD/year' },
  { section: 'Outputs', key: 'choleraAndFunerals', label: 'Cholera and Funeral Cost', value: 0, unit: 'USD/year' },
  { section: 'Outputs', key: 'tourism', label: 'Tourism Cost', value: 0, unit: 'USD/year' },
];

const csvEscape = (value: string | number | boolean | undefined) => {
  const text = value === undefined ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const triggerDownload = (content: string, filename: string, type: string) => {
  const blob = new Blob(['\uFEFF', content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const getInputValue = (inputs: ModelInputs, key: string) => {
  switch (key) {
    case 'analysisYear': return inputs.macro.analysisYear;
    case 'exchangeRate': return inputs.macro.exchangeRate;
    case 'gdpPerCapita': return inputs.macro.gdpPerCapita;
    case 'hourlyWage': return inputs.macro.hourlyWage;
    case 'discountRate': return inputs.macro.discountRate * 100;
    case 'mortalityMethod': return inputs.macro.mortalityMethod;
    case 'vslMultiplier': return inputs.macro.vslMultiplier;
    case 'population': return inputs.health.population;
    case 'attributionToSanitation': return inputs.health.attributionToSanitation * 100;
    case 'diarrheaIncidenceUnder5': return inputs.health.diarrheaIncidenceUnder5;
    case 'diarrheaDeathsUnder5': return inputs.health.diarrheaDeathsUnder5;
    case 'diarrheaIncidenceOver5': return inputs.health.diarrheaIncidenceOver5;
    case 'diarrheaDeathsOver5': return inputs.health.diarrheaDeathsOver5;
    case 'treatmentSeekingRate': return inputs.health.treatmentSeekingRate * 100;
    case 'costOutpatient': return inputs.health.costOutpatient;
    case 'costInpatient': return inputs.health.costInpatient;
    case 'stuntingPrevalence': return inputs.nutrition.stuntingPrevalence * 100;
    case 'attributionStunting': return inputs.nutrition.attributionStunting * 100;
    case 'wageLossPercent': return inputs.nutrition.wageLossPercent * 100;
    case 'openDefecationPrevalence': return inputs.access.openDefecationPrevalence * 100;
    case 'dailyTimeForOD': return inputs.access.dailyTimeForOD;
    case 'percentWithPoorSanitation': return inputs.carbon.percentWithPoorSanitation * 100;
    case 'emissionFactorSource': return inputs.carbon.emissionFactorSource;
    case 'emissionFactor': return inputs.carbon.emissionFactor;
    case 'socialCostOfCarbon': return inputs.carbon.socialCostOfCarbon;
    case 'tourismReceipts': return inputs.other.tourismReceipts;
    case 'tourismLossPercentage': return inputs.other.tourismLossPercentage * 100;
    case 'choleraResponseCost': return inputs.other.choleraResponseCost;
    case 'funeralCostPerDeath': return inputs.other.funeralCostPerDeath;
    default: return '';
  }
};

const getOutputValue = (outputs: ModelOutputs, key: string) => {
  switch (key) {
    case 'totalCostUSD': return outputs.totalCostUSD;
    case 'totalCostLocal': return outputs.totalCostLocal;
    case 'percentGDP': return outputs.percentGDP;
    default: return outputs.costsUSD[key as keyof typeof outputs.costsUSD] ?? '';
  }
};

export const downloadAnalysisCsv = (
  countryName: string,
  inputs: ModelInputs,
  outputs: ModelOutputs,
  sources: DataSourceMap
) => {
  const exportDate = new Date().toISOString();
  const rows = [
    ['Country', countryName],
    ['Exported At', exportDate],
    ['Aligned Analysis Year', inputs.macro.analysisYear],
    ['Currency Code', inputs.macro.currencyCode],
    [],
    [
      'Section',
      'Parameter',
      'Value',
      'Unit',
      'Source Label',
      'Source Name',
      'Aligned Year',
      'Data Year Used',
      'Fallback Used',
      'Notes',
    ],
  ];

  INPUT_FIELDS.forEach((field) => {
    const source = sources[field.key as keyof DataSourceMap];
    rows.push([
      field.section,
      field.label,
      getInputValue(inputs, field.key),
      field.unit || '',
      source?.label || 'Manual / calculated',
      source?.sourceName || '',
      source?.requestedYear || '',
      source?.actualYear || '',
      source?.fallbackUsed ? 'Yes' : 'No',
      source?.notes || '',
    ]);
  });

  OUTPUT_FIELDS.forEach((field) => {
    rows.push([
      field.section,
      field.label,
      getOutputValue(outputs, field.key),
      field.unit || '',
      'Calculated output',
      'Sanitation Impact Modeler',
      inputs.macro.analysisYear,
      inputs.macro.analysisYear,
      'No',
      '',
    ]);
  });

  const content = rows.map((row) => row.map((cell) => csvEscape(cell as string | number | boolean | undefined)).join(',')).join('\n');
  const filename = `${countryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-sanitation-analysis.csv`;
  triggerDownload(content, filename, 'text/csv;charset=utf-8;');
};

export const getAdvocacySummary = (outputs: ModelOutputs) => {
  const breakdown = Object.entries(outputs.costsUSD)
    .map(([key, value]) => ({
      key,
      label: key.replace(/([A-Z])/g, ' $1').trim().replace('nutrition', 'Stunting').replace('cholera And Funerals', 'Cholera and Funerals'),
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
