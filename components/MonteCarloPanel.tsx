
import React, { useMemo } from 'react';
import { ModelInputs, ModelOutputs, SimulationStats } from '../types';
import { runSimulation } from '../utils/monteCarlo';
import { formatCurrency } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface MonteCarloPanelProps {
  inputs: ModelInputs;
  baseOutputs: ModelOutputs;
}

export const MonteCarloPanel: React.FC<MonteCarloPanelProps> = ({ inputs, baseOutputs }) => {
  // Run simulation on render (or when inputs change)
  const stats: SimulationStats = useMemo(() => {
    return runSimulation(inputs, 10000);
  }, [inputs]);

  // Prepare Histogram Data
  const histogramData = useMemo(() => {
    if (!stats.distribution.length) return [];
    const min = stats.p5; 
    const max = stats.p95;
    const plotMin = min * 0.95;
    const plotMax = max * 1.05;
    const range = plotMax - plotMin;
    const step = range / 15;
    
    const bins = Array(15).fill(0).map((_, i) => {
        const binStart = plotMin + (i * step);
        const center = binStart + (step/2);
        return {
            rangeStart: binStart,
            rangeEnd: plotMin + ((i + 1) * step),
            count: 0,
            label: (center / 1000000).toFixed(1) + 'M',
            fullValue: center
        }
    });

    stats.distribution.forEach(val => {
      if (val >= plotMin && val <= plotMax) {
        const binIdx = Math.min(14, Math.floor((val - plotMin) / step));
        if (bins[binIdx]) bins[binIdx].count++;
      }
    });

    return bins;
  }, [stats]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-brand-dark flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Uncertainty Analysis (Monte Carlo)
        </h3>
        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">N=10,000</span>
      </div>

      <div className="p-6">
        
        {/* Summary Stats Card */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 mb-6">
           <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider text-center">Projected Annual Cost (90% Confidence Interval)</h4>
           
           <div className="grid grid-cols-3 gap-4 items-end mb-2">
              <div className="text-center group">
                 <div className="text-[10px] text-slate-400 font-bold mb-1 group-hover:text-brand-primary transition-colors">Lower Bound (P5)</div>
                 <div className="text-lg font-bold text-slate-700 leading-tight">
                    {formatCurrency(stats.p5)}
                 </div>
              </div>
              
              <div className="text-center relative">
                 <div className="absolute left-0 top-1 bottom-1 w-px bg-slate-200"></div>
                 <div className="absolute right-0 top-1 bottom-1 w-px bg-slate-200"></div>
                 
                 <div className="text-xs text-brand-primary font-bold mb-1">Mean Estimate</div>
                 <div className="text-2xl font-black text-brand-dark leading-tight">
                    {formatCurrency(stats.mean)}
                 </div>
              </div>
              
              <div className="text-center group">
                 <div className="text-[10px] text-slate-400 font-bold mb-1 group-hover:text-brand-primary transition-colors">Upper Bound (P95)</div>
                 <div className="text-lg font-bold text-slate-700 leading-tight">
                    {formatCurrency(stats.p95)}
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Histogram */}
            <div className="h-64 flex flex-col">
                <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase">Probability Distribution</h4>
                <div className="flex-1 min-h-0 border border-slate-100 rounded bg-white p-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={histogramData} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                            <XAxis 
                                dataKey="label" 
                                tick={{fontSize: 9, fill: '#64748b'}} 
                                interval={2}
                                height={20}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis hide />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                content={({active, payload}) => {
                                    if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-brand-dark text-white text-xs p-2 rounded shadow-xl">
                                        <span className="font-bold text-brand-primary">~{formatCurrency(payload[0].payload.fullValue)}</span><br/>
                                        Simulations: {payload[0].value}
                                        </div>
                                    )
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                                {histogramData.map((entry, index) => {
                                    const isMean = Math.abs(entry.fullValue - stats.mean) < (entry.rangeEnd - entry.rangeStart);
                                    return <Cell key={`cell-${index}`} fill={isMean ? '#1CABE2' : '#cbd5e1'} />;
                                })}
                            </Bar>
                            <ReferenceLine x={histogramData.find(h => h.fullValue > stats.mean)?.label} stroke="#374EA2" strokeDasharray="3 3" />
                            </BarChart>
                        </ResponsiveContainer>
                </div>
            </div>

            {/* Interpretation */}
            <div className="flex flex-col justify-center">
                <div className="bg-blue-50/50 border-l-4 border-brand-primary p-4 rounded-r-lg">
                    <h4 className="text-sm font-bold text-brand-dark mb-2">Analysis Insight</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        The model estimates a mean economic cost of <strong className="text-brand-dark">{formatCurrency(stats.mean)}</strong>. 
                        Given the input uncertainties, there is a 90% probability the true cost falls between <strong>{formatCurrency(stats.p5)}</strong> and <strong>{formatCurrency(stats.p95)}</strong>.
                        { stats.stdDev > stats.mean * 0.25 
                            ? " The wide variance suggests that improved data collection (especially on disease incidence) would significantly refine this estimate." 
                            : " The relatively narrow range indicates a robust estimate despite data limitations." 
                        }
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
