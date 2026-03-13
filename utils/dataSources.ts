import { DataSourceInfo, DataSourceMap } from '../types';

const sentence = (value?: string) => (value ? `${value.trim().replace(/[. ]+$/, '')}.` : '');

export const getSourceTooltip = (source?: DataSourceInfo) => {
  if (!source) return '';

  const lines = [
    source.sourceName || source.label,
    source.indicatorCode ? `Indicator: ${source.indicatorCode}` : '',
    source.requestedYear ? `Aligned year: ${source.requestedYear}` : '',
    source.actualYear ? `Data year used: ${source.actualYear}` : '',
    source.fallbackUsed
      ? `Fallback used: yes${source.fallbackDirection ? ` (${source.fallbackDirection})` : ''}`
      : source.actualYear
        ? 'Fallback used: no'
        : '',
    sentence(source.notes),
  ].filter(Boolean);

  return lines.join('\n');
};

export const getSourceYearLabel = (source?: DataSourceInfo) => {
  if (!source?.actualYear) return null;
  return source.fallbackUsed ? `${source.actualYear} fallback` : `${source.actualYear}`;
};

export const getSourceToneClasses = (source?: DataSourceInfo) => {
  switch (source?.tone) {
    case 'success':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'danger':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};

export const getFallbackSources = (sources: DataSourceMap) =>
  Object.entries(sources).filter(([, source]) => source?.fallbackUsed);
