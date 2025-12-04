
import React, { useState, useEffect } from 'react';
import { ModelInputs, MacroInputs, HealthInputs, NutritionInputs, AccessTimeInputs, OtherCostsInputs, CarbonInputs, DataSourceMap } from '../types';
import { EMISSION_PRESETS } from '../constants';

interface InputPanelProps {
  inputs: ModelInputs;
  sources?: DataSourceMap;
  onUpdate: (newInputs: ModelInputs) => void;
}

const InputGroup = ({ title, children, isOpen, onToggle }: { title: string, children?: React.ReactNode, isOpen: boolean, onToggle: () => void }) => (
  <div className="border border-slate-200 rounded-lg mb-4 overflow-hidden bg-white shadow-sm transition-all duration-200">
    <button 
      className={`w-full px-4 py-3 text-left font-bold flex justify-between items-center transition-colors ${isOpen ? 'bg-slate-50 text-brand-dark' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
      onClick={onToggle}
    >
      <span className="text-base">{title}</span>
      <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-primary' : 'text-slate-400'}`}>▼</span>
    </button>
    {isOpen && <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 bg-white">{children}</div>}
  </div>
);

const SourceBadge = ({ text }: { text: string }) => {
    let colorClass = "bg-slate-100 text-slate-500 border-slate-200";
    let icon = null;

    if (!text) return null;

    if (text.toLowerCase().includes("world bank") || text.toLowerCase().includes("who") || text.toLowerCase().includes("data:")) {
        colorClass = "bg-green-50 text-green-700 border-green-200";
        icon = (
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    } else if (text.toLowerCase().includes("est") || text.toLowerCase().includes("derived")) {
        colorClass = "bg-amber-50 text-amber-700 border-amber-200";
        icon = (
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    }

    return (
        <div className={`flex items-center text-[10px] px-2 py-1 rounded border mt-1.5 w-fit ${colorClass}`}>
            {icon}
            <span className="truncate max-w-[180px]">{text}</span>
        </div>
    );
};

const formatForDisplay = (num: number, useSeparators: boolean = true): string => {
    if (num === null || num === undefined || isNaN(num)) return '';
    if (num === 0) return '0';
    
    // Rule: > 10 (abs) round to nearest integer and add commas (if allowed)
    if (Math.abs(num) >= 10) {
        const rounded = Math.round(num);
        return useSeparators ? rounded.toLocaleString('en-US') : rounded.toString();
    }
    
    // Rule: <= 10, allow decimals (max 2 for inputs typically)
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

interface NumberFieldProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    step?: number;
    unit?: string;
    source?: string;
    noSeparator?: boolean;
}

const NumberField = ({ label, value, onChange, step = 1, unit, source, noSeparator = false }: NumberFieldProps) => {
    const [displayValue, setDisplayValue] = useState(formatForDisplay(value, !noSeparator));
    const [active, setActive] = useState(false);

    // Sync internal state when external value changes
    useEffect(() => {
        if (!active) {
            setDisplayValue(formatForDisplay(value, !noSeparator));
        }
    }, [value, active, noSeparator]);

    const handleFocus = () => {
        setActive(true);
        // Show raw number on focus for easier editing
        setDisplayValue(value.toString());
    };

    const handleBlur = () => {
        setActive(false);
        // Re-format on blur
        setDisplayValue(formatForDisplay(value, !noSeparator));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setDisplayValue(val);

        // Strip commas for parsing
        const cleanVal = val.replace(/,/g, '');
        
        if (cleanVal === '' || cleanVal === '-') {
            if (cleanVal === '') onChange(0);
            return;
        }

        const num = parseFloat(cleanVal);
        if (!isNaN(num)) {
            onChange(num);
        }
    };

    return (
        <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">{label}</label>
            <div className="relative">
                <input 
                    type="text"
                    inputMode="decimal"
                    value={displayValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className={`w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all font-mono ${active ? 'bg-white' : 'bg-slate-50'}`}
                />
                {unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        {unit}
                    </span>
                )}
            </div>
            {source && <SourceBadge text={source} />}
        </div>
    );
};

interface SelectFieldProps {
    label: string;
    value: string;
    options: {label: string; value: string}[];
    onChange: (val: string) => void;
    source?: string;
}

const SelectField = ({ label, value, options, onChange, source }: SelectFieldProps) => (
    <div className="flex flex-col">
        <label className="text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">{label}</label>
        <div className="relative">
             <select 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all appearance-none"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
        </div>
        {source && <SourceBadge text={source} />}
    </div>
);

export const InputPanel: React.FC<InputPanelProps> = ({ inputs, sources = {}, onUpdate }) => {
  const [openSection, setOpenSection] = useState<string>('macro');

  const toggle = (sec: string) => setOpenSection(openSection === sec ? '' : sec);

  const updateMacro = (key: keyof MacroInputs, val: number | string) => {
    onUpdate({ ...inputs, macro: { ...inputs.macro, [key]: val } });
  };
  const updateHealth = (key: keyof HealthInputs, val: number) => {
    onUpdate({ ...inputs, health: { ...inputs.health, [key]: val } });
  };
  const updateNutrition = (key: keyof NutritionInputs, val: number) => {
    onUpdate({ ...inputs, nutrition: { ...inputs.nutrition, [key]: val } });
  };
  const updateAccess = (key: keyof AccessTimeInputs, val: number) => {
    onUpdate({ ...inputs, access: { ...inputs.access, [key]: val } });
  };
  const updateCarbon = (key: keyof CarbonInputs, val: number | string) => {
    // If source changes, update factor using presets
    if (key === 'emissionFactorSource') {
        let newFactor = inputs.carbon.emissionFactor;
        if (val === 'IPCC') newFactor = EMISSION_PRESETS.IPCC;
        if (val === 'SCARE') newFactor = EMISSION_PRESETS.SCARE;
        
        onUpdate({ 
            ...inputs, 
            carbon: { 
                ...inputs.carbon, 
                emissionFactorSource: val as 'IPCC'|'SCARE'|'Custom',
                emissionFactor: newFactor
            } 
        });
    } else {
        onUpdate({ ...inputs, carbon: { ...inputs.carbon, [key]: val } });
    }
  };
  const updateOther = (key: keyof OtherCostsInputs, val: number) => {
    onUpdate({ ...inputs, other: { ...inputs.other, [key]: val } });
  };

  return (
    <div className="w-full">
      <InputGroup title="1. Macroeconomic Inputs" isOpen={openSection === 'macro'} onToggle={() => toggle('macro')}>
        <NumberField 
            label="Analysis Year" 
            value={inputs.macro.analysisYear} 
            onChange={(v) => updateMacro('analysisYear', v)} 
            source={sources['analysisYear']}
            noSeparator={true}
        />
        <NumberField 
            label={`Exchange Rate (LCU per USD)`} 
            value={inputs.macro.exchangeRate} 
            onChange={(v) => updateMacro('exchangeRate', v)} 
            source={sources['exchangeRate']}
        />
        <NumberField 
            label="GDP Per Capita (USD)" 
            value={inputs.macro.gdpPerCapita} 
            onChange={(v) => updateMacro('gdpPerCapita', v)} 
            source={sources['gdpPerCapita']}
        />
        <NumberField 
            label="Hourly Wage (USD)" 
            value={inputs.macro.hourlyWage} 
            onChange={(v) => updateMacro('hourlyWage', v)} 
            step={0.01}
            source={sources['hourlyWage']}
        />
        
        <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField 
                    label="Mortality Valuation Method"
                    value={inputs.macro.mortalityMethod}
                    options={[
                        {label: 'Human Capital Approach (Lost GDP)', value: 'humanCapital'},
                        {label: 'Value of Statistical Life (VSL)', value: 'vsl'}
                    ]}
                    onChange={(v) => updateMacro('mortalityMethod', v)}
                    source={sources['mortalityMethod']}
                />
                
                {inputs.macro.mortalityMethod === 'humanCapital' ? (
                     <NumberField 
                        label="Discount Rate" 
                        value={inputs.macro.discountRate * 100} 
                        onChange={(v) => updateMacro('discountRate', v / 100)} 
                        step={0.1} 
                        unit="%" 
                        source={sources['discountRate']}
                    />
                ) : (
                    <NumberField 
                        label="VSL Multiplier (x GDPpc)" 
                        value={inputs.macro.vslMultiplier} 
                        onChange={(v) => updateMacro('vslMultiplier', v)} 
                        source={sources['vslMultiplier']}
                    />
                )}
            </div>
            <div className="mt-3 bg-blue-50 text-blue-800 text-xs p-3 rounded border border-blue-100">
                {inputs.macro.mortalityMethod === 'humanCapital' 
                    ? <span><strong>Note:</strong> The Human Capital Approach is conservative. It values life based solely on future economic output (GDP contribution).</span>
                    : <span><strong>Note:</strong> VSL (Value of Statistical Life) values risk reduction based on "Willingness to Pay". It captures the intrinsic value of living and is typically 50-100x higher than Human Capital.</span>
                }
            </div>
        </div>
      </InputGroup>

      <InputGroup title="2. Health (Diarrhea)" isOpen={openSection === 'health'} onToggle={() => toggle('health')}>
        <NumberField label="Total Population" value={inputs.health.population} onChange={(v) => updateHealth('population', v)} source={sources['population']} />
        <NumberField 
            label="Attributable to Sanitation" 
            value={inputs.health.attributionToSanitation * 100} 
            onChange={(v) => updateHealth('attributionToSanitation', v / 100)} 
            step={1} 
            unit="%" 
            source={sources['attributionToSanitation']}
        />
        
        <div className="md:col-span-2 grid grid-cols-2 gap-4 border p-3 rounded bg-slate-50/50">
            <h4 className="col-span-2 text-xs font-bold text-slate-400 uppercase">Under 5 Years</h4>
            <NumberField label="Incidence (Cases/Year)" value={inputs.health.diarrheaIncidenceUnder5} onChange={(v) => updateHealth('diarrheaIncidenceUnder5', v)} step={0.1} source={sources['diarrheaIncidenceUnder5']} />
            <NumberField label="Total Annual Deaths" value={inputs.health.diarrheaDeathsUnder5} onChange={(v) => updateHealth('diarrheaDeathsUnder5', v)} source={sources['diarrheaDeathsUnder5']} />
        </div>
        
        <div className="md:col-span-2 grid grid-cols-2 gap-4 border p-3 rounded bg-slate-50/50">
             <h4 className="col-span-2 text-xs font-bold text-slate-400 uppercase">Over 5 Years</h4>
            <NumberField label="Incidence (Cases/Year)" value={inputs.health.diarrheaIncidenceOver5} onChange={(v) => updateHealth('diarrheaIncidenceOver5', v)} step={0.1} source={sources['diarrheaIncidenceOver5']} />
            <NumberField label="Total Annual Deaths" value={inputs.health.diarrheaDeathsOver5} onChange={(v) => updateHealth('diarrheaDeathsOver5', v)} source={sources['diarrheaDeathsOver5']} />
        </div>

        <NumberField label="Treatment Seeking Rate" value={inputs.health.treatmentSeekingRate * 100} onChange={(v) => updateHealth('treatmentSeekingRate', v/100)} unit="%" source={sources['treatmentSeekingRate']} />
        <NumberField label="Outpatient Cost (USD)" value={inputs.health.costOutpatient} onChange={(v) => updateHealth('costOutpatient', v)} unit="$" source={sources['costOutpatient']} />
      </InputGroup>

      <InputGroup title="3. Stunting (Child Development)" isOpen={openSection === 'stunting'} onToggle={() => toggle('stunting')}>
        <NumberField label="Stunting Prevalence (U5)" value={inputs.nutrition.stuntingPrevalence * 100} onChange={(v) => updateNutrition('stuntingPrevalence', v/100)} unit="%" source={sources['stuntingPrevalence']} />
        <NumberField label="Attributable to Sanitation" value={inputs.nutrition.attributionStunting * 100} onChange={(v) => updateNutrition('attributionStunting', v/100)} unit="%" source={sources['attributionStunting']} />
        <NumberField label="Future Wage Penalty" value={inputs.nutrition.wageLossPercent * 100} onChange={(v) => updateNutrition('wageLossPercent', v/100)} unit="%" source={sources['wageLossPercent']} />
      </InputGroup>

      <InputGroup title="4. Access Time (Open Defecation)" isOpen={openSection === 'access'} onToggle={() => toggle('access')}>
        <NumberField label="OD Prevalence" value={inputs.access.openDefecationPrevalence * 100} onChange={(v) => updateAccess('openDefecationPrevalence', v/100)} unit="%" source={sources['openDefecationPrevalence']} />
        <NumberField label="Time Spent (Hours/Day)" value={inputs.access.dailyTimeForOD} onChange={(v) => updateAccess('dailyTimeForOD', v)} step={0.1} unit="hrs" source={sources['dailyTimeForOD']} />
      </InputGroup>
      
      <InputGroup title="5. Carbon (GHG) Emissions" isOpen={openSection === 'carbon'} onToggle={() => toggle('carbon')}>
         <div className="md:col-span-2 bg-slate-50 p-2 rounded text-xs text-slate-500 mb-2">
            Estimates climate damage using emission factors from IPCC or SCARE.
         </div>
         <NumberField 
            label="Pop. with Poor Sanitation" 
            value={inputs.carbon.percentWithPoorSanitation * 100} 
            onChange={(v) => updateCarbon('percentWithPoorSanitation', v/100)} 
            unit="%" 
            source={sources['percentWithPoorSanitation']} 
        />
        
        <SelectField
            label="Emission Factor Source"
            value={inputs.carbon.emissionFactorSource || 'IPCC'}
            options={[
                {label: `IPCC 2019 (~${EMISSION_PRESETS.IPCC}kg)`, value: 'IPCC'},
                {label: `SCARE Tool (~${EMISSION_PRESETS.SCARE}kg)`, value: 'SCARE'},
                {label: 'Custom Value', value: 'Custom'}
            ]}
            onChange={(v) => updateCarbon('emissionFactorSource', v)}
        />
         
         <NumberField 
            label="Emission Factor (kg CO2e)" 
            value={inputs.carbon.emissionFactor} 
            onChange={(v) => updateCarbon('emissionFactor', v)} 
            unit="kg"
            source={inputs.carbon.emissionFactorSource === 'IPCC' ? 'Ref: IPCC 2019 Refinement' : inputs.carbon.emissionFactorSource === 'SCARE' ? 'Ref: SCARE Tool (Univ. of Leeds)' : 'Custom Estimate'} 
        />
         <NumberField 
            label="Social Cost of Carbon (USD/t)" 
            value={inputs.carbon.socialCostOfCarbon} 
            onChange={(v) => updateCarbon('socialCostOfCarbon', v)} 
            unit="$"
            source="Ref: Rennert et al. 2022 / EPA"
        />
      </InputGroup>

      <InputGroup title="6. Other Costs" isOpen={openSection === 'other'} onToggle={() => toggle('other')}>
        <NumberField label="Annual Tourism Receipts (USD)" value={inputs.other.tourismReceipts} onChange={(v) => updateOther('tourismReceipts', v)} source={sources['tourismReceipts']} />
        <NumberField label="Tourism Loss Attributable" value={inputs.other.tourismLossPercentage * 100} onChange={(v) => updateOther('tourismLossPercentage', v/100)} unit="%" source={sources['tourismLossPercentage']} />
        <NumberField label="Cholera Response (USD)" value={inputs.other.choleraResponseCost} onChange={(v) => updateOther('choleraResponseCost', v)} source={sources['choleraResponseCost']} />
        <NumberField label="Funeral Cost (Per Death)" value={inputs.other.funeralCostPerDeath} onChange={(v) => updateOther('funeralCostPerDeath', v)} unit="$" source={sources['funeralCostPerDeath']} />
      </InputGroup>
    </div>
  );
};
