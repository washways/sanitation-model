
import React, { useState, useEffect, useMemo } from 'react';
import { DEFAULT_INPUTS, SUPPORTED_COUNTRIES } from './constants';
import { ModelInputs, DataSourceMap } from './types';
import { calculateModelOutputs, formatCurrency, formatNumber } from './utils/calculations';
import { InputPanel } from './components/InputPanel';
import { CostChart } from './components/CostChart';
import { MonteCarloPanel } from './components/MonteCarloPanel';
import { ComparisonView } from './components/ComparisonView';
import { CountrySelector } from './components/CountrySelector';
import { SplashScreen } from './components/SplashScreen';
import { fetchCountryData } from './services/worldBank';
import { estimateInputs } from './utils/estimators';

const MobileStickyFooter = ({ outputs, currency }: { outputs: any, currency: string }) => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 px-4 py-3 flex justify-between items-center safe-area-pb">
        <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Economic Cost</p>
            <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-brand-dark">{formatCurrency(outputs.totalCostUSD)}</span>
                <span className="text-xs font-bold text-brand-primary bg-blue-50 px-1.5 py-0.5 rounded">
                    {formatNumber(outputs.percentGDP)}% GDP
                </span>
            </div>
        </div>
        <div className="text-right">
             <p className="text-[10px] text-slate-400 font-medium">Local Currency</p>
             <p className="text-sm font-bold text-slate-600">
                {formatCurrency(outputs.totalCostLocal, currency)}
             </p>
        </div>
    </div>
);

const MethodologySection = () => (
    <div className="bg-slate-900 text-slate-300 p-8 md:p-12 rounded-t-3xl mt-12 border-t-4 border-brand-accent">
        <h3 className="text-white text-2xl font-bold mb-8 flex items-center gap-3">
            <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Methodology & Formulas
        </h3>
        
        <p className="text-slate-400 mb-10 max-w-4xl text-sm leading-relaxed">
            This model applies the <strong>Economics of Sanitation Initiative (ESI)</strong> methodology developed by the World Bank WSP. 
            It estimates the economic costs of poor sanitation by comparing the current status against a counterfactual of universal access to safely managed sanitation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-sm leading-relaxed mb-12">
            
            {/* COLUMN 1: HEALTH */}
            <div>
                <h4 className="text-brand-primary font-bold mb-4 uppercase tracking-widest text-xs border-b border-slate-700 pb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    Health & Lives
                </h4>
                
                <div className="mb-6">
                    <strong className="text-white block mb-1">Health Care (Treatment)</strong>
                    <p className="font-mono text-xs text-brand-accent bg-slate-800 p-2 rounded mb-2">
                        Cost = Cases × %Seeking × (AvgCost<sub>OP</sub> + AvgCost<sub>IP</sub>)
                    </p>
                    <p className="text-xs">Based on disease incidence (WB/WHO) attributable to sanitation (default 88%). Unit costs derived from national health expenditure data.</p>
                </div>

                <div>
                    <strong className="text-white block mb-1">Premature Mortality</strong>
                    <p className="text-xs mb-2">Valued using one of two methods:</p>
                    <ul className="space-y-3 text-xs">
                        <li className="bg-slate-800 p-2 rounded border-l-2 border-brand-primary">
                            <span className="text-white font-bold block">Human Capital Approach (HCA)</span>
                            <span className="text-slate-400">NPV of lost future GDP contribution. Conservative.</span>
                            <br/><em className="text-[10px] text-slate-500">Formula: Σ (GDPpc / (1+r)^t)</em>
                        </li>
                        <li className="bg-slate-800 p-2 rounded border-l-2 border-brand-accent">
                            <span className="text-white font-bold block">Value of Statistical Life (VSL)</span>
                            <span className="text-slate-400">Willingness-to-pay to reduce risk. Captures intrinsic value.</span>
                            <br/><em className="text-[10px] text-slate-500">Formula: Deaths × GDPpc × Multiplier (typ. 50-100)</em>
                        </li>
                    </ul>
                </div>
            </div>

            {/* COLUMN 2: ECONOMY */}
            <div>
                <h4 className="text-brand-primary font-bold mb-4 uppercase tracking-widest text-xs border-b border-slate-700 pb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Economic & Opportunity
                </h4>
                
                <div className="mb-6">
                    <strong className="text-white block mb-1">Stunting (Long-term)</strong>
                    <p className="font-mono text-xs text-brand-accent bg-slate-800 p-2 rounded mb-2">
                        Loss = Cohort × Stunt% × Attr% × WagePenalty% × NPV
                    </p>
                    <p className="text-xs">
                        Ref: <em>Grantham-McGregor et al.</em> Estimates income loss (typ. 10-20%) due to cognitive delays in stunted children. Modeled as an NPV of future working life (40 yrs).
                    </p>
                </div>

                <div className="mb-6">
                    <strong className="text-white block mb-1">Productivity (Sick Days)</strong>
                    <p className="text-xs mb-2">Value of time lost to illness for adults and caregivers.</p>
                    <p className="font-mono text-xs text-brand-accent bg-slate-800 p-2 rounded">
                        Cost = Cases × Days × Wage × 50%
                    </p>
                    <em className="text-[10px] text-slate-500">50% adjustment for labor substitution (WSP methodology).</em>
                </div>

                <div>
                    <strong className="text-white block mb-1">Access Time</strong>
                    <p className="text-xs">Opportunity cost of walking to open defecation sites.</p>
                    <p className="font-mono text-xs text-brand-accent bg-slate-800 p-2 rounded">
                         Pop<sub>OD</sub> × 365 × Hours × (30% Wage)
                    </p>
                </div>
            </div>

            {/* COLUMN 3: CLIMATE */}
            <div>
                 <h4 className="text-brand-primary font-bold mb-4 uppercase tracking-widest text-xs border-b border-slate-700 pb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Climate Impact (Carbon)
                </h4>
                
                <p className="text-xs mb-4">
                    Quantifies the economic damage of Greenhouse Gas (GHG) emissions—primarily Methane (CH<sub>4</sub>)—from decomposing waste in pit latrines and open defecation.
                </p>

                <div className="bg-slate-800 p-3 rounded border border-slate-700 mb-4">
                    <strong className="text-brand-accent text-xs uppercase tracking-wide block mb-2 font-mono">
                        Cost = Emissions (tCO2e) × SCC ($)
                    </strong>
                    <div className="space-y-3">
                        <div>
                            <span className="text-white text-xs font-bold">1. Emission Factors</span>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Default: <strong>35 kg CO2e/person/year</strong> (IPCC 2019 Refinement, Vol 4, Ch 6).
                                <br/>Alternative: <strong>52 kg</strong> via SCARE Tool (Univ. of Leeds) which accounts for emptying/dumping.
                            </p>
                        </div>
                        <div>
                            <span className="text-white text-xs font-bold">2. Social Cost of Carbon (SCC)</span>
                            <p className="text-[10px] text-slate-400 mt-1">
                                The marginal economic damage of one extra ton of CO2.
                                <br/>Ref: <strong>Rennert et al. (2022) Nature</strong>; US EPA 2023 Update.
                                <br/>Default: <strong>$100/ton</strong> (Conservative central estimate).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="border-t border-slate-800 pt-8">
            <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">Primary Data Sources (World Bank Open Data)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
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
                 <a href="https://data.worldbank.org/indicator/SH.STA.SMSS.ZS" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-primary transition-colors text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span> Safely Managed San.
                </a>
            </div>
            <p className="mt-8 text-xs text-slate-600">
                © 2025 Sanitation Impact Modeler. Not an official UNICEF product. Currency rates via Open Exchange Rates.
            </p>
        </div>
    </div>
);

const App = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysis' | 'comparison'>('analysis');
  const [selectedCountry, setSelectedCountry] = useState('MW'); // Default Malawi
  const [inputs, setInputs] = useState<ModelInputs>(DEFAULT_INPUTS);
  const [sources, setSources] = useState<DataSourceMap>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initial Load
  useEffect(() => {
      loadCountryData('MW');
  }, []);

  const loadCountryData = async (code: string) => {
      setIsLoading(true);
      setSelectedCountry(code);
      const country = SUPPORTED_COUNTRIES.find(c => c.code === code);
      if (country) {
          try {
              const rawData = await fetchCountryData(country.code, country.currency);
              const estimated = estimateInputs(rawData || {}, country.code, country.currency);
              setInputs(estimated.inputs);
              setSources(estimated.sources);
          } catch (e) {
              console.error("Failed to load country data", e);
          }
      }
      setIsLoading(false);
  };

  const outputs = useMemo(() => calculateModelOutputs(inputs), [inputs]);

  if (showIntro) {
      return <SplashScreen onStart={() => setShowIntro(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Header */}
      <header className="bg-brand-primary text-white shadow-md z-20 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white text-brand-primary rounded flex items-center justify-center font-bold shadow-lg">
                    S
                </div>
                <h1 className="font-bold text-lg tracking-tight hidden sm:block">Sanitation Impact Modeler</h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center bg-black/10 rounded-lg p-1 mr-2">
                    <button 
                        onClick={() => setActiveTab('analysis')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'analysis' ? 'bg-white text-brand-primary shadow' : 'text-white/80 hover:text-white'}`}
                    >
                        Single Analysis
                    </button>
                    <button 
                        onClick={() => setActiveTab('comparison')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'comparison' ? 'bg-white text-brand-primary shadow' : 'text-white/80 hover:text-white'}`}
                    >
                        Global Comparison
                    </button>
                </div>
                
                {/* PDF Export Disabled in Preview Mode due to library crash */}
                <button 
                    disabled={true}
                    title="PDF Export requires local build environment"
                    className="bg-white/10 text-white/50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-white/10 cursor-not-allowed"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="hidden sm:inline">Export PDF (Local Only)</span>
                </button>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden max-w-[1600px] mx-auto w-full">
        
        {activeTab === 'analysis' ? (
             <div className="flex-1 flex flex-col lg:flex-row relative lg:h-full">
                
                {/* LEFT PANEL: INPUTS (Top on mobile, Left on desktop) */}
                <div className="w-full lg:w-1/2 flex flex-col border-r border-slate-200 bg-white shadow-xl lg:shadow-none lg:h-full h-auto order-1 z-10">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 flex items-center justify-between sticky top-0 lg:static z-20">
                         <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Country Context</h2>
                         <CountrySelector 
                            selectedCode={selectedCountry} 
                            onSelect={loadCountryData} 
                            isLoading={isLoading} 
                         />
                    </div>
                    {/* Content */}
                    <div className="overflow-visible lg:overflow-y-auto custom-scrollbar p-4 lg:p-6 pb-6 lg:pb-6">
                        <InputPanel inputs={inputs} sources={sources} onUpdate={setInputs} />
                    </div>
                </div>

                {/* RIGHT PANEL: RESULTS (Bottom on mobile, Right on desktop) */}
                <div className="w-full lg:w-1/2 bg-slate-50 flex flex-col lg:h-full h-auto order-2">
                    {/* Content */}
                    <div className="overflow-visible lg:overflow-y-auto custom-scrollbar p-4 lg:p-8 pb-32">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-brand-primary">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Annual Cost</p>
                                <p className="text-2xl lg:text-3xl font-black text-brand-dark">{formatCurrency(outputs.totalCostUSD)}</p>
                                <p className="text-xs text-slate-400 mt-1">{formatCurrency(outputs.totalCostLocal, inputs.macro.currencyCode)}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-brand-accent">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Impact on Economy</p>
                                <p className="text-2xl lg:text-3xl font-black text-brand-dark">{formatNumber(outputs.percentGDP)}%</p>
                                <p className="text-xs text-slate-400 mt-1">of National GDP</p>
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
                             <div className="flex justify-between items-center mb-6">
                                 <h3 className="font-bold text-brand-dark">Cost Breakdown by Category</h3>
                                 <div className="flex gap-2">
                                     {['Health', 'Productivity', 'Carbon'].map(l => (
                                         <span key={l} className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded-full">{l}</span>
                                     ))}
                                 </div>
                             </div>
                             <CostChart outputs={outputs} />
                        </div>

                        {/* Breakdown Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
                             <table className="w-full text-sm">
                                 <thead className="bg-slate-50 border-b border-slate-200">
                                     <tr>
                                         <th className="px-6 py-3 text-left font-bold text-slate-500">Category</th>
                                         <th className="px-6 py-3 text-right font-bold text-slate-500">Cost (USD)</th>
                                         <th className="px-6 py-3 text-right font-bold text-slate-500">% Total</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                     {Object.entries(outputs.costsUSD).map(([key, value]) => (
                                         <tr key={key} className="hover:bg-slate-50 transition-colors">
                                             <td className="px-6 py-3 font-medium text-slate-700 capitalize">
                                                 {key.replace(/([A-Z])/g, ' $1').trim().replace('Nutrition', 'Stunting').replace('Carbon', 'Carbon (GHG)')}
                                             </td>
                                             <td className="px-6 py-3 text-right font-mono text-slate-600">
                                                 {formatCurrency(value as number)}
                                             </td>
                                             <td className="px-6 py-3 text-right text-slate-400">
                                                 {formatNumber((value as number / outputs.totalCostUSD) * 100)}%
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                        </div>

                        {/* Monte Carlo Analysis */}
                        <div className="mt-6">
                            <MonteCarloPanel inputs={inputs} baseOutputs={outputs} />
                        </div>

                        {/* Methodology Footer */}
                        <MethodologySection />
                    </div>
                </div>

                <MobileStickyFooter outputs={outputs} currency={inputs.macro.currencyCode} />
             </div>
        ) : (
            <div className="h-full overflow-hidden">
                <ComparisonView />
            </div>
        )}

      </main>
    </div>
  );
};

export default App;