import { ModelInputs, SimulationStats, CostBreakdown } from '../types';
import { calculateModelOutputs } from './calculations';
import { activeParams, copyInputs, drawFactor } from './uncertainty';

const emptyBreakdown = (): CostBreakdown => ({
  healthCare: 0,
  productivity: 0,
  mortality: 0,
  nutrition: 0,
  accessTime: 0,
  carbon: 0,
  choleraAndFunerals: 0,
  tourism: 0,
});

/**
 * Monte Carlo simulation. Each uncertain input is drawn independently from a triangular distribution over its
 * range (inputs.ranges), peaking at the current value. Ranges are WHO / WHO-CHOICE 95% intervals where available.
 * @param baseInputs The baseline model inputs
 * @param iterations Number of runs (default 500)
 */
export const runSimulation = (baseInputs: ModelInputs, iterations: number = 500): SimulationStats => {
  const results: number[] = [];
  const acc = emptyBreakdown();
  const params = activeParams(baseInputs);

  for (let i = 0; i < iterations; i++) {
    const sim = copyInputs(baseInputs);
    for (const p of params) {
      const range = baseInputs.ranges[p.key];
      p.apply(sim, drawFactor(range.low, range.high));
    }
    const outputs = calculateModelOutputs(sim);
    results.push(outputs.totalCostUSD);
    for (const key of Object.keys(acc) as (keyof CostBreakdown)[]) {
      acc[key] += outputs.costsUSD[key];
    }
  }

  results.sort((a, b) => a - b);
  const mean = results.reduce((a, b) => a + b, 0) / results.length;
  const variance = results.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / results.length;
  const meanBreakdown = Object.fromEntries(
    Object.entries(acc).map(([k, v]) => [k, v / iterations])
  ) as unknown as CostBreakdown;

  return {
    mean,
    meanBreakdown,
    median: results[Math.floor(results.length / 2)],
    p5: results[Math.floor(results.length * 0.05)],
    p95: results[Math.floor(results.length * 0.95)],
    stdDev: Math.sqrt(variance),
    iterations,
    distribution: results,
  };
};
