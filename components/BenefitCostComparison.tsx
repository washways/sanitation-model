import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CountryComparisonResult } from '../types';
import { formatCurrency } from '../utils/calculations';

type Basis = 'core' | 'wider';

const TEAL = '#0B6E80';
const INK_MUTED = '#64748b';
const GRID = '#e2e8f0';

/** Benefit-cost ratio of basic sanitation for everyone, one bar per country, ranked. */
export const BenefitCostComparison: React.FC<{ results: CountryComparisonResult[] }> = ({ results }) => {
  const [basis, setBasis] = useState<Basis>('core');
  const [showTable, setShowTable] = useState(false);

  const data = useMemo(
    () => results
      .map((r) => ({
        name: r.name,
        ratio: basis === 'core' ? r.bcr : r.bcrWider,
        core: r.bcr,
        wider: r.bcrWider,
        cost: r.bcAnnualCostUSD,
        benefit: r.bcAnnualBenefitUSD,
      }))
      .sort((a, b) => b.ratio - a.ratio),
    [results, basis]
  );
  const above = data.filter((d) => d.ratio >= 1).length;
  const sorted = [...data.map((d) => d.ratio)].sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;

  const toggle = (value: Basis, label: string) => (
    <button
      onClick={() => setBasis(value)}
      className={`px-3 py-1.5 text-xs font-bold ${basis === value ? 'bg-brand-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white p-6 rounded-xl border border-line">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-2">
        <div>
          <h3 className="font-bold text-slate-700">Benefit-cost ratio of basic sanitation for everyone</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Yearly losses avoided ÷ yearly cost of reaching everyone without at least basic sanitation (World Bank unit costs, Hutton &amp; Varughese 2016).
            Above 1, the benefits exceed the costs. {above} of {data.length} countries are above 1; median {median.toFixed(1)}.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="flex bg-white rounded-lg border border-slate-300 overflow-hidden">
            {toggle('core', 'Core benefits')}
            {toggle('wider', 'With VSL + stunting')}
          </div>
          <button onClick={() => setShowTable((v) => !v)} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">
            {showTable ? 'Chart' : 'Table'}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mb-4">
        {basis === 'core'
          ? 'Core benefits = the headline total: health care, days lost, deaths valued by lost working life, access time, cholera and funerals.'
          : 'Adds the wider benefits shown separately: deaths valued with the value of statistical life (Robinson et al. 2019) and lost earnings from stunting (an upper bound, since trials found no effect of household sanitation on growth).'}
      </p>

      {showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 border-b border-line">
                <th className="py-2 pr-3">Country</th>
                <th className="py-2 pr-3 text-right">Ratio (core)</th>
                <th className="py-2 pr-3 text-right">Ratio (with VSL + stunting)</th>
                <th className="py-2 pr-3 text-right">Yearly cost</th>
                <th className="py-2 text-right">Yearly benefit (core)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.name} className="border-b border-line/60">
                  <td className="py-1.5 pr-3 font-semibold text-slate-700">{d.name}</td>
                  <td className="py-1.5 pr-3 text-right font-mono">{d.core.toFixed(2)}</td>
                  <td className="py-1.5 pr-3 text-right font-mono">{d.wider.toFixed(2)}</td>
                  <td className="py-1.5 pr-3 text-right font-mono">{formatCurrency(d.cost)}</td>
                  <td className="py-1.5 text-right font-mono">{formatCurrency(d.benefit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height: Math.max(400, data.length * 24) }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
              <XAxis type="number" orientation="top" fontSize={11} stroke={INK_MUTED} tickFormatter={(v) => `${v}`} />
              <YAxis type="category" dataKey="name" fontSize={11} width={150} stroke="#475569" interval={0} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-800 text-white p-3 rounded text-xs min-w-[220px]">
                      <p className="font-bold mb-1">{d.name}</p>
                      <div className="flex justify-between"><span>Ratio, core benefits</span><span className="font-mono">{d.core.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>With VSL + stunting</span><span className="font-mono">{d.wider.toFixed(2)}</span></div>
                      <div className="flex justify-between mt-1 text-slate-300"><span>Yearly cost</span><span className="font-mono">{formatCurrency(d.cost)}</span></div>
                      <div className="flex justify-between text-slate-300"><span>Yearly benefit (core)</span><span className="font-mono">{formatCurrency(d.benefit)}</span></div>
                    </div>
                  );
                }}
              />
              <ReferenceLine x={1} stroke="#334155" strokeDasharray="4 3" label={{ value: 'Break-even', position: 'top', fontSize: 10, fill: '#334155' }} />
              <Bar dataKey="ratio" name="Benefit-cost ratio" fill={TEAL} radius={[0, 4, 4, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
