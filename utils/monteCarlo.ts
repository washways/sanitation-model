
import { ModelInputs, SimulationStats, CostBreakdown } from '../types';
import { calculateModelOutputs } from './calculations';

// Helper to get random number in range [min, max]
const randomRange = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

// Helper to vary a value by a percentage (e.g., 0.2 for +/- 20%)
const vary = (value: number, percent: number) => {
  const min = value * (1 - percent);
  const max = value * (1 + percent);
  return randomRange(min, max);
};

// Clamp helper
const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

/**
 * Runs a Monte Carlo simulation for the given inputs.
 * @param baseInputs The baseline model inputs
 * @param iterations Number of runs (default 500)
 */
export const runSimulation = (baseInputs: ModelInputs, iterations: number = 500): SimulationStats => {
  const results: number[] = [];
  
  // Accumulators for mean breakdown
  const accBreakdown: CostBreakdown = {
    healthCare: 0,
    productivity: 0,
    mortality: 0,
    nutrition: 0,
    accessTime: 0,
    carbon: 0,
    choleraAndFunerals: 0,
    tourism: 0
  };

  for (let i = 0; i < iterations; i++) {
    // deep copy to avoid mutating base
    const simInputs: ModelInputs = JSON.parse(JSON.stringify(baseInputs)); 

    // --- APPLY UNCERTAINTY TO ALL VARIABLES ---
    
    // 1. MACRO VARIABLES
    simInputs.macro.gdpPerCapita = vary(baseInputs.macro.gdpPerCapita, 0.05); // +/- 5%
    simInputs.macro.exchangeRate = vary(baseInputs.macro.exchangeRate, 0.05); // +/- 5%
    simInputs.macro.hourlyWage = vary(baseInputs.macro.hourlyWage, 0.20); // +/- 20%
    
    if (simInputs.macro.mortalityMethod === 'vsl') {
       simInputs.macro.vslMultiplier = vary(baseInputs.macro.vslMultiplier, 0.25); // +/- 25%
    } else {
       simInputs.macro.discountRate = clamp(vary(baseInputs.macro.discountRate, 0.20), 0.01, 0.20);
    }

    // 2. HEALTH & DEMOGRAPHICS
    simInputs.health.population = vary(baseInputs.health.population, 0.02); // +/- 2%
    
    simInputs.health.diarrheaIncidenceUnder5 = vary(baseInputs.health.diarrheaIncidenceUnder5, 0.25); // +/- 25%
    simInputs.health.diarrheaIncidenceOver5 = vary(baseInputs.health.diarrheaIncidenceOver5, 0.25);
    simInputs.health.diarrheaDeathsUnder5 = vary(baseInputs.health.diarrheaDeathsUnder5, 0.20);
    simInputs.health.diarrheaDeathsOver5 = vary(baseInputs.health.diarrheaDeathsOver5, 0.20);
    
    simInputs.health.attributionToSanitation = clamp(vary(baseInputs.health.attributionToSanitation, 0.10), 0.1, 1.0);

    // 3. HEALTH COSTS
    simInputs.health.treatmentSeekingRate = clamp(vary(baseInputs.health.treatmentSeekingRate, 0.15), 0.0, 1.0);
    simInputs.health.costOutpatient = vary(baseInputs.health.costOutpatient, 0.30); // +/- 30%
    simInputs.health.costInpatient = vary(baseInputs.health.costInpatient, 0.30);

    // 4. NUTRITION
    simInputs.nutrition.stuntingPrevalence = clamp(vary(baseInputs.nutrition.stuntingPrevalence, 0.10), 0.0, 1.0);
    simInputs.nutrition.attributionStunting = clamp(vary(baseInputs.nutrition.attributionStunting, 0.30), 0.0, 1.0);
    simInputs.nutrition.wageLossPercent = clamp(vary(baseInputs.nutrition.wageLossPercent, 0.20), 0.0, 1.0);

    // 5. ACCESS TIME
    simInputs.access.openDefecationPrevalence = clamp(vary(baseInputs.access.openDefecationPrevalence, 0.10), 0.0, 1.0);
    simInputs.access.dailyTimeForOD = vary(baseInputs.access.dailyTimeForOD, 0.25);

    // 6. CARBON
    simInputs.carbon.percentWithPoorSanitation = clamp(vary(baseInputs.carbon.percentWithPoorSanitation, 0.10), 0.0, 1.0);
    simInputs.carbon.emissionFactor = vary(baseInputs.carbon.emissionFactor, 0.30); // High uncertainty
    simInputs.carbon.socialCostOfCarbon = vary(baseInputs.carbon.socialCostOfCarbon, 0.40); // High uncertainty on carbon price

    // 7. OTHER COSTS
    simInputs.other.choleraResponseCost = vary(baseInputs.other.choleraResponseCost, 0.50); // +/- 50%
    simInputs.other.funeralCostPerDeath = vary(baseInputs.other.funeralCostPerDeath, 0.20);
    simInputs.other.tourismReceipts = vary(baseInputs.other.tourismReceipts, 0.10);
    simInputs.other.tourismLossPercentage = clamp(vary(baseInputs.other.tourismLossPercentage, 0.40), 0.0, 1.0);

    // Run Model
    const outputs = calculateModelOutputs(simInputs);
    results.push(outputs.totalCostUSD);
    
    // Accumulate components
    accBreakdown.healthCare += outputs.costsUSD.healthCare;
    accBreakdown.productivity += outputs.costsUSD.productivity;
    accBreakdown.mortality += outputs.costsUSD.mortality;
    accBreakdown.nutrition += outputs.costsUSD.nutrition;
    accBreakdown.accessTime += outputs.costsUSD.accessTime;
    accBreakdown.carbon += outputs.costsUSD.carbon;
    accBreakdown.choleraAndFunerals += outputs.costsUSD.choleraAndFunerals;
    accBreakdown.tourism += outputs.costsUSD.tourism;
  }

  // --- CALCULATE STATS ---
  results.sort((a, b) => a - b);
  
  const sum = results.reduce((a, b) => a + b, 0);
  const mean = sum / results.length;
  
  const variance = results.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / results.length;
  const stdDev = Math.sqrt(variance);

  const meanBreakdown: CostBreakdown = {
      healthCare: accBreakdown.healthCare / iterations,
      productivity: accBreakdown.productivity / iterations,
      mortality: accBreakdown.mortality / iterations,
      nutrition: accBreakdown.nutrition / iterations,
      accessTime: accBreakdown.accessTime / iterations,
      carbon: accBreakdown.carbon / iterations,
      choleraAndFunerals: accBreakdown.choleraAndFunerals / iterations,
      tourism: accBreakdown.tourism / iterations
  };

  return {
    mean,
    meanBreakdown,
    median: results[Math.floor(results.length / 2)],
    p5: results[Math.floor(results.length * 0.05)],
    p95: results[Math.floor(results.length * 0.95)],
    stdDev,
    iterations,
    distribution: results 
  };
};