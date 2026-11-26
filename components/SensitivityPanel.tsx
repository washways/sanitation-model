import React, { useMemo } from 'react';
import { ModelInputs } from '../types';
import { runSensitivity } from '../utils/uncertainty';
import { formatCurrency } from '../utils/calculations';

/**
 * One-way sensitivity ("tornado"): the total with each uncertain input at the low and high end of its range,
 * largest effect first, plus conservative and upper scenarios.
 */
export const SensitivityPanel: React.FC<{ inputs: ModelInputs }> = ({ inputs }) => {
  const result = useMemo(() => runSensitivity(inputs), [inputs]);
  const rows = result.rows.slice(0, 10);
  const min = Math.min(result.conservative, ...rows.map((r) => Math.min(r.lowTotal, r.highTotal)));
  const max = Math.max(result.upper, ...rows.map((r) => Math.max(r.lowTotal, r.highTotal)));
  const span = Math.max(max - min, 1);
  const pos = (v: number) => `${((v - min) / span) * 100}%`;

  return (
    <div className="bg-white p-6 rounded-xl border border-line">
      <h3 className="font-bold text-brand-dark">What drives the estimate</h3>
      <p className="text-xs text-slate-500 mt-1 mb-4">
        The total when one input at a time is set to the low or high end of its plausible range. Ranges are WHO's and WHO-CHOICE's 95% intervals where available; hover a row for the basis.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-5 text-center">
        <div className="rounded-lg border border-line p-3">
          <p className="text-[10px] font-bold uppercase text-slate-500">Conservative</p>
          <p className="font-bold text-brand-dark">{formatCurrency(result.conservative)}</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-[10px] font-bold uppercase text-slate-500">Central</p>
          <p className="font-bold text-brand-dark">{formatCurrency(result.baseTotal)}</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-[10px] font-bold uppercase text-slate-500">Upper</p>
          <p className="font-bold text-brand-dark">{formatCurrency(result.upper)}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {rows.map((r) => {
          const lo = Math.min(r.lowTotal, r.highTotal);
          const hi = Math.max(r.lowTotal, r.highTotal);
          return (
            <div key={r.key} title={`Range: ${r.basis}`} className="grid grid-cols-[minmax(0,10rem)_1fr] sm:grid-cols-[minmax(0,13rem)_1fr] items-center gap-3">
              <span className="text-xs text-slate-700 truncate">{r.label}</span>
              <div>
                <div className="relative h-3 bg-page rounded">
                  <div className="absolute top-0 h-3 rounded bg-brand-primary/70" style={{ left: pos(lo), width: `calc(${pos(hi)} - ${pos(lo)})` }} />
                  <div className="absolute -top-0.5 h-4 w-px bg-brand-dark" style={{ left: pos(result.baseTotal) }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>{formatCurrency(lo)}</span>
                  <span>{formatCurrency(hi)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-4">
        Conservative and upper put every input at the end of its range that lowers or raises the total at the same time, so they are wider than any likely outcome.
      </p>
    </div>
  );
};
