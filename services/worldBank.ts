
import { ModelInputs } from '../types';
import { SUPPORTED_COUNTRIES } from '../constants';

// World Bank Indicator Codes
const INDICATORS = {
  POPULATION: 'SP.POP.TOTL',
  GDP_PER_CAPITA: 'NY.GDP.PCAP.CD',
  OPEN_DEFECATION: 'SH.STA.ODEF.ZS', // People practicing open defecation (% of population)
  MORTALITY_U5: 'SH.DYN.MORT', // Mortality rate, under-5 (per 1,000 live births)
  TOURISM_RECEIPTS: 'ST.INT.RCPT.CD', // International tourism, receipts (current US$)
  BIRTH_RATE: 'SP.DYN.CBRT.IN', // Birth rate, crude (per 1,000 people)
  HEALTH_EXPENDITURE: 'SH.XPD.CHEX.PC.CD', // Current health expenditure per capita (current US$)
  DIARRHEA_PREVALENCE: 'SH.STA.DIAR.ZS', // Prevalence of diarrhea (% of children under 5)
  STUNTING: 'SH.STA.STNT.ZS', // Prevalence of stunting, height for age (% of children under 5)
  WASH_MORTALITY: 'SH.STA.WASH.P5', // Mortality rate attributed to unsafe water, sanitation and lack of hygiene (per 100,000 population)
  BASIC_SANITATION: 'SH.STA.BASS.ZS', // People using at least basic sanitation services (% of population)
};

interface WBResponseItem {
  date: string;
  value: number | null;
  indicator: { id: string; value: string };
  country: { id: string; value: string };
}

type WBResponse = [unknown, WBResponseItem[]];

// Helper to fetch most recent valid value from time series
const getLatestValue = (data: WBResponseItem[]): number | null => {
  if (!data || data.length === 0) return null;
  // Sort by date descending
  const sorted = data.sort((a, b) => parseInt(b.date) - parseInt(a.date));
  // Find first non-null
  const valid = sorted.find(item => item.value !== null);
  return valid ? valid.value : null;
};

// Fetch live exchange rates from open.er-api.com (Free, no key required)
const fetchLiveExchangeRate = async (currencyCode: string): Promise<number | null> => {
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
        const data = await response.json();
        if (data && data.rates && data.rates[currencyCode]) {
            return data.rates[currencyCode];
        }
        return null;
    } catch (error) {
        console.warn(`Failed to fetch live rate for ${currencyCode}`, error);
        return null;
    }
};

export const fetchCountryData = async (isoCode: string, currencyCode: string = 'USD') => {
  const baseUrl = 'https://api.worldbank.org/v2/country';
  const format = 'format=json';
  
  const fetchIndicator = async (indicator: string) => {
    try {
      const response = await fetch(`${baseUrl}/${isoCode}/indicator/${indicator}?${format}&per_page=10&date=2015:2023`);
      const data: WBResponse = await response.json();
      return getLatestValue(data[1]);
    } catch (error) {
      console.warn(`Failed to fetch ${indicator} for ${isoCode}`, error);
      return null;
    }
  };

  // Parallel fetch of World Bank Data and Live Exchange Rate
  const results = await Promise.all([
    fetchIndicator(INDICATORS.POPULATION),
    fetchIndicator(INDICATORS.GDP_PER_CAPITA),
    fetchIndicator(INDICATORS.OPEN_DEFECATION),
    fetchIndicator(INDICATORS.MORTALITY_U5),
    fetchIndicator(INDICATORS.TOURISM_RECEIPTS),
    fetchIndicator(INDICATORS.BIRTH_RATE),
    fetchIndicator(INDICATORS.HEALTH_EXPENDITURE),
    fetchIndicator(INDICATORS.DIARRHEA_PREVALENCE),
    fetchIndicator(INDICATORS.STUNTING),
    fetchIndicator(INDICATORS.WASH_MORTALITY),
    fetchLiveExchangeRate(currencyCode),
    fetchIndicator(INDICATORS.BASIC_SANITATION)
  ]);

  const [
      pop, 
      gdp, 
      od, 
      mort, 
      tourism, 
      birthRate, 
      healthExp, 
      diarrheaPrev, 
      stunting, 
      washMort, 
      liveRate,
      basicSanitation
  ] = results;

  return {
    population: pop,
    gdpPerCapita: gdp,
    exchangeRate: liveRate, // Prioritize live rate
    openDefecation: od,
    mortalityUnder5Rate: mort, 
    tourismReceipts: tourism,
    birthRate: birthRate, 
    healthExpenditure: healthExp,
    diarrheaPrevalence: diarrheaPrev,
    stuntingPrevalence: stunting,
    washMortality: washMort,
    basicSanitation: basicSanitation
  };
};

/**
 * Fetches data for ALL supported countries in batches to avoid rate limiting.
 * Used for the comparison tab.
 */
export const fetchAllLDCData = async (onProgress: (progress: number) => void) => {
  const allData: Record<string, any> = {};
  const batchSize = 3;
  
  // Fetch base rates once to avoid spamming the ER API
  let baseRates: Record<string, number> = {};
  try {
      const rateRes = await fetch(`https://open.er-api.com/v6/latest/USD`);
      const rateData = await rateRes.json();
      baseRates = rateData.rates || {};
  } catch (e) {
      console.warn("Could not fetch batch exchange rates");
  }
  
  for (let i = 0; i < SUPPORTED_COUNTRIES.length; i += batchSize) {
    const batch = SUPPORTED_COUNTRIES.slice(i, i + batchSize);
    
    // Execute batch
    await Promise.all(batch.map(async (country) => {
        try {
            // Re-use fetchCountryData logic but inject the already known rate
            const data = await fetchCountryData(country.code, country.currency);
            // If fetchCountryData's live fetch failed or we want to ensure consistency, use the batch rate
            if (baseRates[country.currency]) {
                data.exchangeRate = baseRates[country.currency];
            }
            allData[country.code] = data;
        } catch (e) {
            console.error(`Error batch fetching ${country.name}`);
            allData[country.code] = null;
        }
    }));

    // Update progress
    onProgress(Math.min(100, Math.round(((i + batchSize) / SUPPORTED_COUNTRIES.length) * 100)));
    
    // Small delay to be nice to the API
    if (i + batchSize < SUPPORTED_COUNTRIES.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return allData;
};
