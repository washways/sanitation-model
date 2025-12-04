
import React, { useState } from 'react';
import { fetchAllLDCData } from '../services/worldBank';
import { estimateInputs } from '../utils/estimators';
import { runSimulation } from '../utils/monteCarlo';
import { SUPPORTED_COUNTRIES, COLOR_PALETTE } from '../constants';
import { CountryComparisonResult } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ErrorBar } from 'recharts';

export const ComparisonView = () => {
  const [results, setResults] = useState<CountryComparisonResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [sortBy, setSortBy] = useState<'total' | 'gdp'>('gdp');

  const startAnalysis = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    try {
      // 1. Fetch Data Batch
      const allWBData = await fetchAllLDCData((p) => setProgress(p * 0.5)); // First 50% is fetching

      // 2. Process & Simulate
      const computedResults: CountryComparisonResult[] = [];
      const totalCountries = SUPPORTED_COUNTRIES.length;

      await new Promise(r => setTimeout(r, 100));

      for (let i = 0; i < SUPPORTED_COUNTRIES.length; i++) {
        const country = SUPPORTED_COUNTRIES[i];
        const rawData = allWBData[country.code];
        const { inputs } = estimateInputs(rawData || {}, country.code, country.currency);
        
        const stats = runSimulation(inputs, 2000);
        
        const totalNationalGDP = inputs.health.population * inputs.macro.gdpPerCapita;
        const percentGDP = totalNationalGDP > 0 ? (stats.mean / totalNationalGDP) * 100 : 0;

        computedResults.push({
            code: country.code,
            name: country.name,
            inputs,
            stats,
            percentGDP_Mean: percentGDP
        });

        setProgress(50 + Math.round(((i + 1) / totalCountries) * 50));
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
      }

      setResults(computedResults);
      setHasRun(true);

    } catch (error) {
        console.error("Comparison failed", error);
        alert("An error occurred during the global analysis.");
    } finally {
        setIsRunning(false);
    }
  };

  const sortedResults = [...results].sort((a, b) => {
      if (sortBy === 'gdp') return b.percentGDP_Mean - a.percentGDP_Mean;
      return b.stats.mean - a.stats.mean;
  });

  const chartData = sortedResults.map(r => {
      const gdp = (r.inputs.health.population * r.inputs.macro.gdpPerCapita) || 1;
      const scale = sortBy === 'gdp' ? (100 / gdp) : 1;

      const errorNegative = (r.stats.mean - r.stats.p5) * scale;
      const errorPositive = (r.stats.p95 - r.stats.mean) * scale;

      return {
          name: r.name,
          code: r.code,
          totalMean: r.stats.mean * scale,
          
          healthCare: r.stats.meanBreakdown.healthCare * scale,
          productivity: r.stats.meanBreakdown.productivity * scale,
          accessTime: r.stats.meanBreakdown.accessTime * scale,
          nutrition: r.stats.meanBreakdown.nutrition * scale,
          carbon: r.stats.meanBreakdown.carbon * scale,
          choleraAndFunerals: r.stats.meanBreakdown.choleraAndFunerals * scale,
          tourism: r.stats.meanBreakdown.tourism * scale,
          mortality: r.stats.meanBreakdown.mortality * scale,

          error: [errorNegative, errorPositive]
      };
  });

  const chartHeight = Math.max(500, chartData.length * 40);

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 shrink-0">
        <div>
            <h2 className="text-xl font-bold text-brand-dark">Global LDC Comparison</h2>
            <p className="text-sm text-slate-500">Ranking economic impact across {SUPPORTED_COUNTRIES.length} countries using Monte Carlo analysis.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
             {!isRunning && !hasRun && (
                 <button 
                    onClick={startAnalysis}
                    className="w-full md:w-auto px-6 py-2 bg-brand-primary hover:bg-sky-500 text-white font-bold rounded-lg shadow transition-colors flex items-center gap-2 justify-center"
                 >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Run Monte Carlo Analysis
                 </button>
             )}
             
             {isRunning && (
                 <div className="w-full md:w-64">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>Analyzing...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div className="bg-brand-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                 </div>
             )}

             {hasRun && !isRunning && (
                 <div className="flex bg-white rounded-lg border border-slate-300 overflow-hidden shadow-sm">
                     <button 
                        onClick={() => setSortBy('gdp')}
                        className={`px-4 py-2 text-sm font-bold ${sortBy === 'gdp' ? 'bg-brand-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                     >
                        % of GDP
                     </button>
                     <button 
                        onClick={() => setSortBy('total')}
                        className={`px-4 py-2 text-sm font-bold ${sortBy === 'total' ? 'bg-brand-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                     >
                        Total Cost ($)
                     </button>
                 </div>
             )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
        {!hasRun && !isRunning && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 p-10">
                <svg className="w-24 h-24 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Click "Run Monte Carlo Analysis" to fetch data and simulate models for all LDCs.</p>
            </div>
        )}

        {hasRun && (
            <div className="flex flex-col gap-8 p-6">
                {/* Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-6 ml-2">Estimated Impact ({sortBy === 'gdp' ? '% GDP' : 'USD'}) Breakdown</h3>
                    <div style={{ height: chartHeight }} className="w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                layout="vertical"
                                data={chartData} 
                                margin={{top: 5, right: 30, left: 40, bottom: 5}}
                                barSize={24}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis 
                                    type="number"
                                    tickFormatter={(val) => sortBy === 'gdp' ? `${val}%` : `$${(val/1e9).toFixed(1)}B`} 
                                    fontSize={12}
                                    stroke="#94a3b8"
                                    position="top"
                                    fontWeight={500}
                                />
                                <YAxis 
                                    type="category"
                                    dataKey="name" 
                                    fontSize={12}
                                    width={120}
                                    stroke="#475569"
                                    fontWeight={600}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    content={({active, payload}) => {
                                        if(active && payload && payload.length) {
                                            const d = payload[0].payload;
                                            const total = d.totalMean;
                                            return (
                                                <div className="bg-slate-800 p-3 shadow-xl rounded z-50 text-white min-w-[200px]">
                                                    <p className="font-bold text-white mb-2 border-b border-slate-600 pb-1">{d.name}</p>
                                                    <div className="text-xs space-y-1 mb-2">
                                                        <div className="flex justify-between"><span>Health:</span> <span className="font-mono text-slate-300">{sortBy === 'gdp' ? formatNumber(d.healthCare) + '%' : formatCurrency(d.healthCare)}</span></div>
                                                        <div className="flex justify-between"><span>Productivity:</span> <span className="font-mono text-slate-300">{sortBy === 'gdp' ? formatNumber(d.productivity) + '%' : formatCurrency(d.productivity)}</span></div>
                                                        <div className="flex justify-between"><span>Mortality:</span> <span className="font-mono text-slate-300">{sortBy === 'gdp' ? formatNumber(d.mortality) + '%' : formatCurrency(d.mortality)}</span></div>
                                                        <div className="flex justify-between"><span>Stunting:</span> <span className="font-mono text-slate-300">{sortBy === 'gdp' ? formatNumber(d.nutrition) + '%' : formatCurrency(d.nutrition)}</span></div>
                                                        <div className="flex justify-between"><span>Access Time:</span> <span className="font-mono text-slate-300">{sortBy === 'gdp' ? formatNumber(d.accessTime) + '%' : formatCurrency(d.accessTime)}</span></div>
                                                        <div className="flex justify-between"><span>Carbon:</span> <span className="font-mono text-slate-300">{sortBy === 'gdp' ? formatNumber(d.carbon) + '%' : formatCurrency(d.carbon)}</span></div>
                                                        <div className="flex justify-between"><span>Tourism:</span> <span className="font-mono text-slate-300">{sortBy === 'gdp' ? formatNumber(d.tourism) + '%' : formatCurrency(d.tourism)}</span></div>
                                                    </div>
                                                    <div className="border-t border-slate-600 pt-1 mt-1">
                                                        <p className="text-brand-primary font-bold text-sm flex justify-between">
                                                            <span>Total Mean:</span>
                                                            <span>{sortBy === 'gdp' ? `${formatNumber(total)}%` : formatCurrency(total)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend verticalAlign="top" height={36} iconSize={10} />
                                
                                <Bar dataKey="healthCare" name="Health Care" stackId="a" fill={COLOR_PALETTE.healthCare} />
                                <Bar dataKey="productivity" name="Productivity" stackId="a" fill={COLOR_PALETTE.productivity} />
                                <Bar dataKey="nutrition" name="Stunting" stackId="a" fill={COLOR_PALETTE.nutrition} />
                                <Bar dataKey="accessTime" name="Access Time" stackId="a" fill={COLOR_PALETTE.accessTime} />
                                <Bar dataKey="carbon" name="Carbon (GHG)" stackId="a" fill={COLOR_PALETTE.carbon} />
                                <Bar dataKey="choleraAndFunerals" name="Cholera" stackId="a" fill={COLOR_PALETTE.choleraAndFunerals} />
                                <Bar dataKey="tourism" name="Tourism" stackId="a" fill={COLOR_PALETTE.tourism} />
                                <Bar dataKey="mortality" name="Mortality" stackId="a" fill={COLOR_PALETTE.mortality}>
                                    <ErrorBar dataKey="error" width={4} strokeWidth={2} stroke="black" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Methodology Footer for Comparison Tab */}
                <div className="bg-slate-900 text-slate-300 p-8 rounded-xl border-l-4 border-brand-accent">
                    <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                        <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Methodology & Interpretation
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm leading-relaxed mb-6">
                        <div>
                            <p className="mb-4">
                                <strong className="text-white uppercase tracking-wider text-xs block mb-1">Batch Simulation</strong>
                                For each country, the model pulls the latest available data from the <strong className="text-white">World Bank API</strong> and <strong className="text-white">Open Exchange Rates</strong>. Where specific disease data is missing, regional estimates based on GDP and WHO tables are used.
                            </p>
                            <p>
                                <strong className="text-white uppercase tracking-wider text-xs block mb-1">Uncertainty Analysis</strong>
                                A Monte Carlo simulation (N=2,000 runs per country) is performed, varying inputs by ±5% (Demographics) to ±50% (Tourism/Cholera) to generate the error bars shown above.
                            </p>
                        </div>
                        <div>
                            <p className="mb-4">
                                <strong className="text-white uppercase tracking-wider text-xs block mb-1">Reading the Chart</strong>
                                The stacked bars represent the breakdown of the <strong>Mean</strong> cost by category. The black error lines extend from the <strong>5th percentile (P5)</strong> to the <strong>95th percentile (P95)</strong> of the <em>Total Cost</em> distribution.
                            </p>
                            <p>
                                <strong className="text-white uppercase tracking-wider text-xs block mb-1">Ranking Insight</strong>
                                Countries are ranked by their mean impact. High % GDP impact typically indicates low income combined with high prevalence of poor sanitation and related disease.
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-6">
                        <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">Primary Data Sources (World Bank Open Data)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <a href="https://data.worldbank.org/indicator/NY.GDP.PCAP.CD" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-primary transition-colors text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span> GDP per Capita
                            </a>
                            <a href="https://data.worldbank.org/indicator/SP.POP.TOTL" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-primary transition-colors text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span> Population
                            </a>
                            <a href="https://data.worldbank.org/indicator/SH.STA.WASH.P5" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-primary transition-colors text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span> WASH Mortality
                            </a>
                            <a href="https://data.worldbank.org/indicator/SH.STA.ODEF.ZS" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-primary transition-colors text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span> Open Defecation
                            </a>
                            <a href="https://data.worldbank.org/indicator/SH.XPD.CHEX.PC.CD" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-primary transition-colors text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span> Health Exp.
                            </a>
                            <a href="https://data.worldbank.org/indicator/SH.STA.STNT.ZS" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-primary transition-colors text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span> Stunting
                            </a>
                            <a href="https://data.worldbank.org/indicator/ST.INT.RCPT.CD" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-primary transition-colors text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span> Tourism
                            </a>
                            <a href="https://data.worldbank.org/indicator/SH.STA.DIAR.ZS" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-primary transition-colors text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span> Diarrhea
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};