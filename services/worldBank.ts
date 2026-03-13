import { SUPPORTED_COUNTRIES } from '../constants';
import { CountryApiData, CountryIndicatorValue, DataSourceInfo } from '../types';

interface IndicatorDefinition {
  code: string;
  label: string;
  link: string;
}

// World Bank indicator codes used by the model.
const INDICATORS = {
  POPULATION: {
    code: 'SP.POP.TOTL',
    label: 'Population, total',
    link: 'https://data.worldbank.org/indicator/SP.POP.TOTL',
  },
  GDP_PER_CAPITA: {
    code: 'NY.GDP.PCAP.CD',
    label: 'GDP per capita (current US$)',
    link: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.CD',
  },
  OPEN_DEFECATION: {
    code: 'SH.STA.ODEF.ZS',
    label: 'People practicing open defecation (% of population)',
    link: 'https://data.worldbank.org/indicator/SH.STA.ODEF.ZS',
  },
  MORTALITY_U5: {
    code: 'SH.DYN.MORT',
    label: 'Mortality rate, under-5 (per 1,000 live births)',
    link: 'https://data.worldbank.org/indicator/SH.DYN.MORT',
  },
  TOURISM_RECEIPTS: {
    code: 'ST.INT.RCPT.CD',
    label: 'International tourism, receipts (current US$)',
    link: 'https://data.worldbank.org/indicator/ST.INT.RCPT.CD',
  },
  BIRTH_RATE: {
    code: 'SP.DYN.CBRT.IN',
    label: 'Birth rate, crude (per 1,000 people)',
    link: 'https://data.worldbank.org/indicator/SP.DYN.CBRT.IN',
  },
  HEALTH_EXPENDITURE: {
    code: 'SH.XPD.CHEX.PC.CD',
    label: 'Current health expenditure per capita (current US$)',
    link: 'https://data.worldbank.org/indicator/SH.XPD.CHEX.PC.CD',
  },
  DIARRHEA_PREVALENCE: {
    code: 'SH.STA.DIAR.ZS',
    label: 'Prevalence of diarrhea (% of children under 5)',
    link: 'https://data.worldbank.org/indicator/SH.STA.DIAR.ZS',
  },
  STUNTING: {
    code: 'SH.STA.STNT.ZS',
    label: 'Prevalence of stunting, height for age (% of children under 5)',
    link: 'https://data.worldbank.org/indicator/SH.STA.STNT.ZS',
  },
  WASH_MORTALITY: {
    code: 'SH.STA.WASH.P5',
    label: 'Mortality rate attributed to unsafe WASH (per 100,000 population)',
    link: 'https://data.worldbank.org/indicator/SH.STA.WASH.P5',
  },
  BASIC_SANITATION: {
    code: 'SH.STA.BASS.ZS',
    label: 'People using at least basic sanitation services (% of population)',
    link: 'https://data.worldbank.org/indicator/SH.STA.BASS.ZS',
  },
} as const satisfies Record<string, IndicatorDefinition>;

interface WBResponseItem {
  date: string;
  value: number | null;
}

type WBResponse = [unknown, WBResponseItem[]];

interface IndicatorSeriesPoint {
  year: number;
  value: number;
}

interface IndicatorSeriesResult {
  key: keyof CountryApiData['fields'];
  definition: IndicatorDefinition;
  series: IndicatorSeriesPoint[];
}

const CURRENT_YEAR = new Date().getFullYear();
const FIRST_YEAR = 2015;
const LAST_REQUEST_YEAR = CURRENT_YEAR - 1;

const buildApiSource = (
  definition: IndicatorDefinition,
  requestedYear: number,
  actualYear: number | undefined,
  fallbackDirection?: 'earlier' | 'later'
): DataSourceInfo => {
  const fallbackUsed = actualYear !== undefined && actualYear !== requestedYear;
  const yearNote = actualYear === undefined
    ? 'No value returned in the requested range.'
    : fallbackUsed
      ? `Requested ${requestedYear}, used ${actualYear}.`
      : `Matched aligned year ${requestedYear}.`;

  return {
    label: fallbackUsed
      ? `World Bank ${actualYear} fallback`
      : actualYear !== undefined
        ? `World Bank ${actualYear}`
        : 'World Bank unavailable',
    kind: 'api',
    sourceName: 'World Bank Open Data',
    indicatorCode: definition.code,
    requestedYear,
    actualYear,
    fallbackUsed,
    fallbackDirection,
    tone: actualYear === undefined ? 'danger' : fallbackUsed ? 'warning' : 'success',
    notes: `${definition.label}. ${yearNote}`,
    link: definition.link,
  };
};

const buildExchangeRateSource = (currencyCode: string): DataSourceInfo => ({
  label: `Live FX ${CURRENT_YEAR}`,
  kind: 'live',
  sourceName: 'open.er-api.com',
  requestedYear: CURRENT_YEAR,
  actualYear: CURRENT_YEAR,
  fallbackUsed: false,
  tone: 'neutral',
  notes: `Live USD/${currencyCode} market exchange rate fetched at export/runtime.`,
});

const buildMissingExchangeRateSource = (): DataSourceInfo => ({
  label: 'FX unavailable',
  kind: 'live',
  sourceName: 'open.er-api.com',
  requestedYear: CURRENT_YEAR,
  actualYear: undefined,
  fallbackUsed: false,
  tone: 'danger',
  notes: 'Live exchange rate request failed.',
});

const getAvailableYears = (series: IndicatorSeriesPoint[]) => new Set(series.map((point) => point.year));

const selectAlignedYear = (seriesResults: IndicatorSeriesResult[]) => {
  const populated = seriesResults.filter((result) => result.series.length > 0);
  const allYears = Array.from(new Set(populated.flatMap((result) => result.series.map((point) => point.year))))
    .sort((a, b) => b - a);

  if (populated.length === 0 || allYears.length === 0) {
    return {
      analysisYear: LAST_REQUEST_YEAR,
      alignmentStrategy: 'best-coverage-year' as const,
    };
  }

  const yearSets = populated.map((result) => getAvailableYears(result.series));
  const commonYears = allYears.filter((year) => yearSets.every((set) => set.has(year)));

  if (commonYears.length > 0) {
    return {
      analysisYear: commonYears[0],
      alignmentStrategy: 'latest-common-year' as const,
    };
  }

  const coverage = allYears.map((year) => ({
    year,
    matches: yearSets.filter((set) => set.has(year)).length,
  }));

  coverage.sort((a, b) => {
    if (b.matches !== a.matches) return b.matches - a.matches;
    return b.year - a.year;
  });

  return {
    analysisYear: coverage[0].year,
    alignmentStrategy: 'best-coverage-year' as const,
  };
};

const selectValueForYear = (
  definition: IndicatorDefinition,
  requestedYear: number,
  series: IndicatorSeriesPoint[]
): CountryIndicatorValue => {
  if (series.length === 0) {
    return {
      value: null,
      source: buildApiSource(definition, requestedYear, undefined),
    };
  }

  const exact = series.find((point) => point.year === requestedYear);
  if (exact) {
    return {
      value: exact.value,
      source: buildApiSource(definition, requestedYear, exact.year),
    };
  }

  const earlier = series
    .filter((point) => point.year < requestedYear)
    .sort((a, b) => b.year - a.year)[0];

  if (earlier) {
    return {
      value: earlier.value,
      source: buildApiSource(definition, requestedYear, earlier.year, 'earlier'),
    };
  }

  const later = series
    .filter((point) => point.year > requestedYear)
    .sort((a, b) => a.year - b.year)[0];

  return {
    value: later?.value ?? null,
    source: buildApiSource(definition, requestedYear, later?.year, later ? 'later' : undefined),
  };
};

const fetchIndicatorSeries = async (
  isoCode: string,
  key: keyof CountryApiData['fields'],
  definition: IndicatorDefinition
): Promise<IndicatorSeriesResult> => {
  const baseUrl = 'https://api.worldbank.org/v2/country';
  const format = 'format=json';

  try {
    const response = await fetch(
      `${baseUrl}/${isoCode}/indicator/${definition.code}?${format}&per_page=80&date=${FIRST_YEAR}:${LAST_REQUEST_YEAR}`
    );
    const data: WBResponse = await response.json();
    const series = (data[1] || [])
      .filter((item) => item.value !== null)
      .map((item) => ({
        year: Number.parseInt(item.date, 10),
        value: item.value as number,
      }))
      .filter((item) => Number.isFinite(item.year))
      .sort((a, b) => b.year - a.year);

    return { key, definition, series };
  } catch (error) {
    console.warn(`Failed to fetch ${definition.code} for ${isoCode}`, error);
    return { key, definition, series: [] };
  }
};

// Fetch live exchange rates from open.er-api.com (free, no key required).
const fetchLiveExchangeRate = async (currencyCode: string): Promise<CountryIndicatorValue> => {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();
    if (data?.rates?.[currencyCode]) {
      return {
        value: data.rates[currencyCode],
        source: buildExchangeRateSource(currencyCode),
      };
    }

    return {
      value: null,
      source: buildMissingExchangeRateSource(),
    };
  } catch (error) {
    console.warn(`Failed to fetch live rate for ${currencyCode}`, error);
    return {
      value: null,
      source: buildMissingExchangeRateSource(),
    };
  }
};

export const fetchCountryData = async (isoCode: string, currencyCode: string = 'USD'): Promise<CountryApiData> => {
  const indicatorResults = await Promise.all([
    fetchIndicatorSeries(isoCode, 'population', INDICATORS.POPULATION),
    fetchIndicatorSeries(isoCode, 'gdpPerCapita', INDICATORS.GDP_PER_CAPITA),
    fetchIndicatorSeries(isoCode, 'openDefecation', INDICATORS.OPEN_DEFECATION),
    fetchIndicatorSeries(isoCode, 'mortalityUnder5Rate', INDICATORS.MORTALITY_U5),
    fetchIndicatorSeries(isoCode, 'tourismReceipts', INDICATORS.TOURISM_RECEIPTS),
    fetchIndicatorSeries(isoCode, 'birthRate', INDICATORS.BIRTH_RATE),
    fetchIndicatorSeries(isoCode, 'healthExpenditure', INDICATORS.HEALTH_EXPENDITURE),
    fetchIndicatorSeries(isoCode, 'diarrheaPrevalence', INDICATORS.DIARRHEA_PREVALENCE),
    fetchIndicatorSeries(isoCode, 'stuntingPrevalence', INDICATORS.STUNTING),
    fetchIndicatorSeries(isoCode, 'washMortality', INDICATORS.WASH_MORTALITY),
    fetchIndicatorSeries(isoCode, 'basicSanitation', INDICATORS.BASIC_SANITATION),
  ]);

  const exchangeRate = await fetchLiveExchangeRate(currencyCode);
  const { analysisYear, alignmentStrategy } = selectAlignedYear(indicatorResults);

  const fieldEntries = indicatorResults.map((result) => [
    result.key,
    selectValueForYear(result.definition, analysisYear, result.series),
  ]) as [keyof CountryApiData['fields'], CountryIndicatorValue][];

  const fields = Object.fromEntries(fieldEntries) as Omit<CountryApiData['fields'], 'exchangeRate'>;
  const fallbackFields = fieldEntries
    .filter(([, value]) => value.source.fallbackUsed)
    .map(([key]) => key);

  return {
    analysisYear,
    alignmentStrategy,
    fallbackFields,
    fields: {
      ...fields,
      exchangeRate,
    },
  };
};

/**
 * Fetches data for all supported countries in batches to avoid rate limiting.
 * Used for the comparison tab.
 */
export const fetchAllLDCData = async (onProgress: (progress: number) => void) => {
  const allData: Record<string, CountryApiData | null> = {};
  const batchSize = 3;

  let baseRates: Record<string, number> = {};
  try {
    const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
    const rateData = await rateRes.json();
    baseRates = rateData.rates || {};
  } catch (error) {
    console.warn('Could not fetch batch exchange rates', error);
  }

  for (let i = 0; i < SUPPORTED_COUNTRIES.length; i += batchSize) {
    const batch = SUPPORTED_COUNTRIES.slice(i, i + batchSize);

    await Promise.all(batch.map(async (country) => {
      try {
        const data = await fetchCountryData(country.code, country.currency);

        if (baseRates[country.currency]) {
          data.fields.exchangeRate = {
            value: baseRates[country.currency],
            source: buildExchangeRateSource(country.currency),
          };
        }

        allData[country.code] = data;
      } catch (error) {
        console.error(`Error batch fetching ${country.name}`, error);
        allData[country.code] = null;
      }
    }));

    onProgress(Math.min(100, Math.round(((i + batchSize) / SUPPORTED_COUNTRIES.length) * 100)));

    if (i + batchSize < SUPPORTED_COUNTRIES.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return allData;
};
