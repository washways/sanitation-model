
import React, { useState, useEffect } from 'react';
import { ModelInputs, MacroInputs, HealthInputs, NutritionInputs, AccessTimeInputs, OtherCostsInputs, CarbonInputs, DataSourceInfo, DataSourceMap } from '../types';
import { EMISSION_PRESETS } from '../constants';
import { getSourceToneClasses, getSourceTooltip, getSourceYearLabel } from '../utils/dataSources';

interface InputPanelProps {
  inputs: ModelInputs;
  sources?: DataSourceMap;
  onUpdate: (newInputs: ModelInputs) => void;
}

const InputGroup = ({ title, children, isOpen, onToggle }: { title: string, children?: React.ReactNode, isOpen: boolean, onToggle: () => void }) => (
  <div className="border border-slate-200 rounded-lg mb-4 overflow-hidden bg-white transition-all duration-200">
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

const SourceBadge = ({ source }: { source?: DataSourceInfo }) => {
    if (!source) return null;

    const colorClass = getSourceToneClasses(source);
    const tooltip = getSourceTooltip(source);
    const yearLabel = getSourceYearLabel(source);

    const icon = source.tone === 'success' ? (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ) : (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    return (
        <div
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border mt-1.5 w-fit ${colorClass}`}
            title={tooltip}
        >
            {icon}
            <span className="truncate max-w-[180px]">{source.label}</span>
            {yearLabel && (
                <span className="font-bold whitespace-nowrap">
                    {yearLabel}
                </span>
            )}
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
    source?: DataSourceInfo;
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
            {source && <SourceBadge source={source} />}
        </div>
    );
};

interface SelectFieldProps {
    label: string;
    value: string;
    options: {label: string; value: string}[];
    onChange: (val: string) => void;
    source?: DataSourceInfo;
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
        {source && <SourceBadge source={source} />}
    </div>
);

const IncludeToggle = ({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) => (
  <div className="md:col-span-2 bg-slate-50 p-3 rounded border border-line text-xs text-slate-600 leading-relaxed">
    {children}
    <label className="flex items-center gap-2 mt-2 font-semibold text-slate-700 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-brand-primary" />
      Include in the total
    </label>
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
  const updateNutrition = (key: keyof NutritionInputs, val: number | boolean) => {
    onUpdate({ ...inputs, nutrition: { ...inputs.nutrition, [key]: val } });
  };
  const updateAccess = (key: keyof AccessTimeInputs, val: number) => {
    onUpdate({ ...inputs, access: { ...inputs.access, [key]: val } });
  };
  const minutes = (hours: number) => Math.round(hours * 60 * 10) / 10;
  const updateCarbon = (key: keyof CarbonInputs, val: number | string | boolean) => {
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
  const updateOther = (key: keyof OtherCostsInputs, val: number | boolean) => {
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
                
                <NumberField
                    label="Discount Rate"
                    value={inputs.macro.discountRate * 100}
                    onChange={(v) => updateMacro('discountRate', v / 100)}
                    step={0.1}
                    unit="%"
                    source={sources['discountRate']}
                />
                <NumberField
                    label="VSL Income Elasticity"
                    value={inputs.macro.vslIncomeElasticity}
                    onChange={(v) => updateMacro('vslIncomeElasticity', v)}
                    step={0.1}
                    source={sources['vslIncomeElasticity']}
                />
                <NumberField
                    label="US GDP Per Capita (USD)"
                    value={inputs.macro.usGdpPerCapita}
                    onChange={(v) => updateMacro('usGdpPerCapita', v)}
                    source={sources['usGdpPerCapita']}
                />
            </div>
            <div className="mt-3 bg-slate-50 text-slate-600 text-xs p-3 rounded border border-slate-200">
                <strong>Human capital</strong> (default) values each death at the output lost over the rest of the person's working life (ages 15–64), discounted, so it depends on age at death. <strong>Value of statistical life</strong> is what people would pay to reduce their risk of dying (Robinson et al. 2019). The results show both.
            </div>
        </div>
      </InputGroup>

      <InputGroup title="2. Health (Diarrhoea)" isOpen={openSection === 'health'} onToggle={() => toggle('health')}>
        <NumberField label="Total Population" value={inputs.health.population} onChange={(v) => updateHealth('population', v)} source={sources['population']} />
        <NumberField label="Population Under 5" value={inputs.health.under5Share * 100} onChange={(v) => updateHealth('under5Share', v / 100)} step={0.1} unit="%" source={sources['under5Share']} />
        <NumberField label="Population Aged 5–14" value={inputs.health.children5to14Share * 100} onChange={(v) => updateHealth('children5to14Share', v / 100)} step={0.1} unit="%" source={sources['children5to14Share']} />
        <NumberField
            label="Share Caused by Unsafe Sanitation"
            value={inputs.health.attributionToSanitation * 100} 
            onChange={(v) => updateHealth('attributionToSanitation', v / 100)} 
            step={1} 
            unit="%" 
            source={sources['attributionToSanitation']}
        />
        
        <div className="md:col-span-2 grid grid-cols-2 gap-4 border p-3 rounded bg-slate-50/50">
            <h4 className="col-span-2 text-xs font-bold text-slate-400 uppercase">Under 5 Years</h4>
            <NumberField label="Incidence (Cases/Year)" value={inputs.health.diarrheaIncidenceUnder5} onChange={(v) => updateHealth('diarrheaIncidenceUnder5', v)} step={0.1} source={sources['diarrheaIncidenceUnder5']} />
            <NumberField label="All Diarrhoea Deaths / Year" value={inputs.health.diarrheaDeathsUnder5} onChange={(v) => updateHealth('diarrheaDeathsUnder5', v)} source={sources['diarrheaDeathsUnder5']} />
        </div>
        
        <div className="md:col-span-2 grid grid-cols-2 gap-4 border p-3 rounded bg-slate-50/50">
             <h4 className="col-span-2 text-xs font-bold text-slate-400 uppercase">Over 5 Years</h4>
            <NumberField label="Incidence (Cases/Year)" value={inputs.health.diarrheaIncidenceOver5} onChange={(v) => updateHealth('diarrheaIncidenceOver5', v)} step={0.1} source={sources['diarrheaIncidenceOver5']} />
            <NumberField label="All Diarrhoea Deaths / Year" value={inputs.health.diarrheaDeathsOver5} onChange={(v) => updateHealth('diarrheaDeathsOver5', v)} source={sources['diarrheaDeathsOver5']} />
            <NumberField label="Average Age at Death" value={inputs.health.ageAtDeathOver5} onChange={(v) => updateHealth('ageAtDeathOver5', v)} unit="yrs" source={sources['ageAtDeathOver5']} />
        </div>

        <NumberField label="Treatment Seeking Rate" value={inputs.health.treatmentSeekingRate * 100} onChange={(v) => updateHealth('treatmentSeekingRate', v/100)} unit="%" source={sources['treatmentSeekingRate']} />
        <NumberField label="Outpatient Case (USD)" value={inputs.health.costOutpatient} onChange={(v) => updateHealth('costOutpatient', v)} step={0.1} unit="$" source={sources['costOutpatient']} />
        <NumberField label="Hospital Admission (USD)" value={inputs.health.costInpatient} onChange={(v) => updateHealth('costInpatient', v)} step={0.1} unit="$" source={sources['costInpatient']} />
      </InputGroup>

      <InputGroup title="3. Access Time (Open Defecation)" isOpen={openSection === 'access'} onToggle={() => toggle('access')}>
        <NumberField label="Urban Population" value={inputs.access.urbanShare * 100} onChange={(v) => updateAccess('urbanShare', v / 100)} step={0.1} unit="%" source={sources['urbanShare']} />
        <div />
        <NumberField label="Open Defecation, Urban" value={inputs.access.openDefecationUrban * 100} onChange={(v) => updateAccess('openDefecationUrban', v / 100)} step={0.1} unit="%" source={sources['openDefecationUrban']} />
        <NumberField label="Open Defecation, Rural" value={inputs.access.openDefecationRural * 100} onChange={(v) => updateAccess('openDefecationRural', v / 100)} step={0.1} unit="%" source={sources['openDefecationRural']} />
        <NumberField label="Extra Minutes / Day, Urban" value={minutes(inputs.access.dailyTimeForODUrban)} onChange={(v) => updateAccess('dailyTimeForODUrban', v / 60)} step={1} unit="min" source={sources['dailyTimeForODUrban']} />
        <NumberField label="Extra Minutes / Day, Rural" value={minutes(inputs.access.dailyTimeForODRural)} onChange={(v) => updateAccess('dailyTimeForODRural', v / 60)} step={1} unit="min" source={sources['dailyTimeForODRural']} />
        <NumberField label="Value of Time, Adults 15+" value={inputs.access.valueOfTimeAdult * 100} onChange={(v) => updateAccess('valueOfTimeAdult', v / 100)} unit="% wage" source={sources['valueOfTimeAdult']} />
        <NumberField label="Value of Time, Children 5–14" value={inputs.access.valueOfTimeChild * 100} onChange={(v) => updateAccess('valueOfTimeChild', v / 100)} unit="% wage" source={sources['valueOfTimeChild']} />
      </InputGroup>

      <InputGroup title="4. Cholera and Funerals" isOpen={openSection === 'other'} onToggle={() => toggle('other')}>
        <NumberField label="Cholera Cases / Year" value={inputs.other.choleraCasesPerYear} onChange={(v) => updateOther('choleraCasesPerYear', v)} source={sources['choleraCasesPerYear']} />
        <NumberField label="Cost per Cholera Case (USD)" value={inputs.other.choleraCostPerCase} onChange={(v) => updateOther('choleraCostPerCase', v)} step={0.1} unit="$" source={sources['choleraCostPerCase']} />
        <NumberField label="Funeral Cost (Per Death)" value={inputs.other.funeralCostPerDeath} onChange={(v) => updateOther('funeralCostPerDeath', v)} unit="$" source={sources['funeralCostPerDeath']} />
      </InputGroup>

      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-6 mb-2">Shown separately (not in the total unless included)</p>

      <InputGroup title="5. Stunting" isOpen={openSection === 'stunting'} onToggle={() => toggle('stunting')}>
        <IncludeToggle checked={!!inputs.nutrition.includeInTotal} onChange={(v) => updateNutrition('includeInTotal', v)}>
          Lost future earnings of children stunted because of poor sanitation. <strong>Not in the total by default:</strong> large trials (WASH Benefits in Bangladesh and Kenya, SHINE in Zimbabwe) found household water, sanitation and hygiene did not improve child growth, so the 16% share is an upper bound.
        </IncludeToggle>
        <NumberField label="Stunting Prevalence (U5)" value={inputs.nutrition.stuntingPrevalence * 100} onChange={(v) => updateNutrition('stuntingPrevalence', v/100)} unit="%" source={sources['stuntingPrevalence']} />
        <NumberField label="Share Caused by Unsafe Sanitation" value={inputs.nutrition.attributionStunting * 100} onChange={(v) => updateNutrition('attributionStunting', v/100)} unit="%" source={sources['attributionStunting']} />
        <NumberField label="Future Wage Penalty" value={inputs.nutrition.wageLossPercent * 100} onChange={(v) => updateNutrition('wageLossPercent', v/100)} unit="%" source={sources['wageLossPercent']} />
        <NumberField label="Real Wage Growth / Year" value={inputs.nutrition.realWageGrowth * 100} onChange={(v) => updateNutrition('realWageGrowth', v/100)} step={0.1} unit="%" source={sources['realWageGrowth']} />
      </InputGroup>

      <InputGroup title="6. Tourism" isOpen={openSection === 'tourism'} onToggle={() => toggle('tourism')}>
        <IncludeToggle checked={!!inputs.other.includeTourismInTotal} onChange={(v) => updateOther('includeTourismInTotal', v)}>
          Tourism income lost because of poor sanitation. <strong>Not in the total by default:</strong> there is no published estimate of the share lost.
        </IncludeToggle>
        <NumberField label="Annual Tourism Receipts (USD)" value={inputs.other.tourismReceipts} onChange={(v) => updateOther('tourismReceipts', v)} source={sources['tourismReceipts']} />
        <NumberField label="Tourism Loss Attributable" value={inputs.other.tourismLossPercentage * 100} onChange={(v) => updateOther('tourismLossPercentage', v/100)} unit="%" source={sources['tourismLossPercentage']} />
      </InputGroup>

      <InputGroup title="7. Carbon (GHG) Emissions" isOpen={openSection === 'carbon'} onToggle={() => toggle('carbon')}>
         <IncludeToggle checked={!!inputs.carbon.includeInTotal} onChange={(v) => updateCarbon('includeInTotal', v)}>
            Methane from pit latrines and septic tanks, valued at the social cost of carbon. <strong>Not in the total by default</strong>, for three reasons:
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>Basic pit latrines emit as much methane as unimproved ones (open defecation emits little), so better basic sanitation does not remove these emissions; only treatment does.</li>
              <li>The social cost of carbon is damage to the whole world, not a cost to this country's economy.</li>
              <li>It is valued at a global price (US$100/t) while health losses are valued at local incomes, so it looks large next to them in low-income countries.</li>
            </ul>
         </IncludeToggle>
         <NumberField
            label="Pop. Without Basic Sanitation"
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
            source={{
                label: inputs.carbon.emissionFactorSource === 'IPCC' ? 'Ref: IPCC 2019 Refinement' : inputs.carbon.emissionFactorSource === 'SCARE' ? 'Ref: SCARE Tool (Univ. of Leeds)' : 'Custom Estimate',
                kind: inputs.carbon.emissionFactorSource === 'Custom' ? 'user' : 'assumption',
                tone: 'neutral',
            }}
        />
         <NumberField 
            label="Social Cost of Carbon (USD/t)" 
            value={inputs.carbon.socialCostOfCarbon} 
            onChange={(v) => updateCarbon('socialCostOfCarbon', v)} 
            unit="$"
            source={{ label: 'Ref: Rennert et al. 2022 / EPA', kind: 'assumption', tone: 'neutral' }}
        />
      </InputGroup>
    </div>
  );
};
