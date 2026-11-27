import React, { useMemo } from 'react';
import { ModelInputs } from '../types';
import { runBenefitCost } from '../utils/benefitCost';
import { formatCurrency, formatNumber } from '../utils/calculations';

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-lg border border-line p-3">
    <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
    <p className="font-bold text-brand-dark text-lg">{value}</p>
    {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
  </div>
);

/** Cost of giving everyone at least basic sanitation against the yearly losses avoided. */
export const BenefitCostPanel: React.FC<{ inputs: ModelInputs }> = ({ inputs }) => {
  const r = useMemo(() => runBenefitCost(inputs), [inputs]);
  const people = r.peopleUrban + r.peopleRural;

  return (
    <div className="bg-white p-6 rounded-xl border border-line">
      <h3 className="font-bold text-brand-dark">Benefit-cost: reaching basic sanitation for everyone</h3>
      <p className="text-xs text-slate-500 mt-1 mb-4">
        {formatNumber(people / 1e6)} million people without at least basic sanitation ({formatNumber(r.peopleUrban / 1e6)}m urban, {formatNumber(r.peopleRural / 1e6)}m rural).
        Yearly cost = building cost spread over the toilet's life at the {formatNumber(inputs.macro.discountRate * 100)}% discount rate, plus upkeep. Yearly benefit = the losses in the total above, once everyone is reached.
      </p>
      <p className="text-xs text-slate-500 mb-4">
        Default costs: World Bank estimates for this country (Hutton &amp; Varughese 2016): US${formatNumber(inputs.investment.capitalCostUrban)} per person in towns and US${formatNumber(inputs.investment.capitalCostRural)} in rural areas, including promotion and supervision. People who already have an unimproved latrine ({formatNumber(inputs.investment.upgradeShareRural * 100)}% of those without basic in rural areas) only need a slab, about US${inputs.investment.upgradeCostPerPerson.toFixed(2)} per person. Replace these under Inputs → 5. Benefit-Cost if you have national costs.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Benefit-cost ratio" value={`${r.ratio.toFixed(1)} : 1`} sub="yearly benefit ÷ yearly cost" />
        <Stat
          label="Payback"
          value={r.paybackYears === null ? 'Never' : r.paybackWithinLife ? `${formatNumber(r.paybackYears)} years` : 'Not within life'}
          sub={r.paybackYears !== null && !r.paybackWithinLife
            ? `${formatNumber(r.paybackYears)} years, longer than the average ${formatNumber(r.averageLifespan)}-year life`
            : 'upfront cost ÷ (benefit − upkeep), undiscounted'}
        />
        <Stat label="Upfront investment" value={formatCurrency(r.upfrontUSD)} sub="building + programme delivery" />
        <Stat label="Yearly cost / benefit" value={`${formatCurrency(r.annualCostUSD)} / ${formatCurrency(r.annualBenefitUSD)}`} />
      </div>
      <p className="text-[11px] text-slate-400 mt-4">
        Assumes everyone is reached and every loss in the total is avoided; health losses are measured against WHO's stricter reference, so the benefit is somewhat overstated. Costs of reaching people are often higher for the last, hardest-to-reach households.
      </p>
    </div>
  );
};
