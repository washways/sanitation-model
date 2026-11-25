import React from 'react';
import { YearExplanation } from '../types';

const formatOlder = (items: YearExplanation['olderOrMissing']) =>
  items.map(i => `${i.label} (${i.usedYear ?? 'no data, estimated'})`).join(', ');

export const YearNotice = ({ year, explanation }: { year: number; explanation: YearExplanation | null }) => {
  if (!explanation) {
    return (
      <div className="mb-4 rounded-lg border border-line bg-white px-4 py-3 text-sm text-slate-700">
        <span className="font-bold text-slate-900">Data year: {year}</span> (default; live data not loaded).
      </div>
    );
  }

  const { core, limiting, olderOrMissing } = explanation;
  const failedCore = core.filter(c => c.latestYear === null);

  return (
    <div className="mb-4 rounded-lg border border-line bg-white px-4 py-3 text-sm text-slate-700">
      <p>
        <span className="font-bold text-slate-900">Data year: {year}.</span>{' '}
        This is the latest year with World Bank data for all {core.length} core indicators
        {limiting.length > 0 && <> ({limiting.join(', ')} {limiting.length > 1 ? 'have' : 'has'} nothing more recent)</>}.
      </p>
      {failedCore.length > 0 && (
        <p className="mt-1.5 text-xs text-amber-800 leading-relaxed">
          Could not load {failedCore.map(c => c.label).join(', ')} from the World Bank just now, so estimates are used for them. Re-select the country to try again.
        </p>
      )}
      {olderOrMissing.length > 0 && (
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-amber-800">Older or missing inputs:</span> {formatOlder(olderOrMissing)}.
          These are survey-based or irregular series, so the most recent value up to {year} is used.
        </p>
      )}
      <details className="mt-1.5 text-xs">
        <summary className="cursor-pointer font-semibold text-brand-primary">How the data year is chosen</summary>
        <p className="mt-1.5 text-slate-600 leading-relaxed">{explanation.rule}</p>
        <table className="mt-2 w-full text-left">
          <thead className="text-slate-500">
            <tr><th className="py-0.5 font-semibold">Core indicator</th><th className="py-0.5 font-semibold text-right">Latest data</th></tr>
          </thead>
          <tbody className="text-slate-700">
            {core.map(c => (
              <tr key={c.label} className="border-t border-line">
                <td className="py-0.5">{c.label}</td>
                <td className={`py-0.5 text-right tabular-nums ${c.latestYear === year ? 'font-bold text-slate-900' : ''}`}>{c.latestYear ?? 'none'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1.5 text-slate-500">Each input's source badge shows the exact year used.</p>
      </details>
    </div>
  );
};
