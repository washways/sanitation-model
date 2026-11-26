import { ModelInputs } from '../types';
import { calculateModelOutputs } from './calculations';

/**
 * Benefit-cost comparison: the yearly cost of giving everyone at least basic sanitation (capital spread over the
 * facility's life at the discount rate, plus programme delivery and upkeep) against the yearly losses avoided
 * (the headline total). Steady state: assumes everyone has been reached and all losses in the total are avoided.
 */
export interface BenefitCostResult {
  peopleUrban: number;
  peopleRural: number;
  upfrontUSD: number; // capital + programme delivery, paid once
  annualCostUSD: number; // annualised capital + yearly upkeep
  annualUpkeepUSD: number;
  annualBenefitUSD: number;
  ratio: number; // benefit ÷ cost
  paybackYears: number | null; // upfront ÷ (benefit − upkeep); null if benefits never cover upkeep
  averageLifespan: number; // people-weighted
  paybackWithinLife: boolean;
}

/** Capital recovery factor: turns an upfront cost into an equal yearly amount over its life. */
const capitalRecovery = (rate: number, years: number) =>
  rate === 0 ? 1 / years : rate / (1 - Math.pow(1 + rate, -years));

export const runBenefitCost = (inputs: ModelInputs): BenefitCostResult => {
  const { investment: inv, health, access, macro } = inputs;
  const peopleUrban = health.population * access.urbanShare * inv.withoutBasicUrban;
  const peopleRural = health.population * (1 - access.urbanShare) * inv.withoutBasicRural;

  const upfrontUrban = peopleUrban * inv.capitalCostUrban * (1 + inv.programmeShare);
  const upfrontRural = peopleRural * inv.capitalCostRural * (1 + inv.programmeShare);
  const annualUpkeepUSD = (peopleUrban * inv.capitalCostUrban + peopleRural * inv.capitalCostRural) * inv.upkeepShare;
  const annualCostUSD =
    upfrontUrban * capitalRecovery(macro.discountRate, Math.max(1, inv.lifespanUrban)) +
    upfrontRural * capitalRecovery(macro.discountRate, Math.max(1, inv.lifespanRural)) +
    annualUpkeepUSD;

  const annualBenefitUSD = calculateModelOutputs(inputs).totalCostUSD;
  const upfrontUSD = upfrontUrban + upfrontRural;
  const net = annualBenefitUSD - annualUpkeepUSD;
  const paybackYears = net > 0 ? upfrontUSD / net : null;
  const people = peopleUrban + peopleRural;
  const averageLifespan = people > 0 ? (peopleUrban * inv.lifespanUrban + peopleRural * inv.lifespanRural) / people : inv.lifespanRural;

  return {
    peopleUrban,
    peopleRural,
    upfrontUSD,
    annualCostUSD,
    annualUpkeepUSD,
    annualBenefitUSD,
    ratio: annualCostUSD > 0 ? annualBenefitUSD / annualCostUSD : 0,
    paybackYears,
    averageLifespan,
    paybackWithinLife: paybackYears !== null && paybackYears <= averageLifespan,
  };
};
