import { SUPPORTED_COUNTRIES } from '../constants';
import { CountryApiData, CountryIndicatorValue, DataSourceInfo, YearExplanation } from '../types';

interface IndicatorDefinition {
  code: string;
  label: string;
  shortLabel: string;
  link: string;
}

// World Bank indicator codes used by the model.
const INDICATORS = {
  POPULATION: {
    code: 'SP.POP.TOTL',
    label: 'Population, total',
    shortLabel: 'Population',
    link: 'https://data.worldbank.org/indicator/SP.POP.TOTL',
  },
  GDP_PER_CAPITA: {
    code: 'NY.GDP.PCAP.CD',
    label: 'GDP per capita (current US$)',
    shortLabel: 'GDP per capita',
    link: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.CD',
  },
  OPEN_DEFECATION: {
    // SH.STA.ODEF.ZS no longer exists in the API; ODFC is the current JMP series.
    code: 'SH.STA.ODFC.ZS',
    label: 'People practicing open defecation (% of population)',
    shortLabel: 'Open defecation',
    link: 'https://data.worldbank.org/indicator/SH.STA.ODFC.ZS',
  },
  MORTALITY_U5: {
    code: 'SH.DYN.MORT',
    label: 'Mortality rate, under-5 (per 1,000 live births)',
    shortLabel: 'Under-5 mortality',
    link: 'https://data.worldbank.org/indicator/SH.DYN.MORT',
  },
  TOURISM_RECEIPTS: {
    code: 'ST.INT.RCPT.CD',
    label: 'International tourism, receipts (current US$)',
    shortLabel: 'Tourism receipts',
    link: 'https://data.worldbank.org/indicator/ST.INT.RCPT.CD',
  },
  BIRTH_RATE: {
    code: 'SP.DYN.CBRT.IN',
    label: 'Birth rate, crude (per 1,000 people)',
    shortLabel: 'Birth rate',
    link: 'https://data.worldbank.org/indicator/SP.DYN.CBRT.IN',
  },
  HEALTH_EXPENDITURE: {
    code: 'SH.XPD.CHEX.PC.CD',
    label: 'Current health expenditure per capita (current US$)',
    shortLabel: 'Health spending per person',
    link: 'https://data.worldbank.org/indicator/SH.XPD.CHEX.PC.CD',
  },
  STUNTING: {
    code: 'SH.STA.STNT.ZS',
    label: 'Prevalence of stunting, height for age (% of children under 5)',
    shortLabel: 'Stunting (under-5)',
    link: 'https://data.worldbank.org/indicator/SH.STA.STNT.ZS',
  },
  WASH_MORTALITY: {
    code: 'SH.STA.WASH.P5',
    label: 'Mortality rate attributed to unsafe WASH (per 100,000 population)',
    shortLabel: 'Deaths from unsafe WASH',
    link: 'https://data.worldbank.org/indicator/SH.STA.WASH.P5',
  },
  BASIC_SANITATION: {
    code: 'SH.STA.BASS.ZS',
    label: 'People using at least basic sanitation services (% of population)',
    shortLabel: 'Basic sanitation coverage',
    link: 'https://data.worldbank.org/indicator/SH.STA.BASS.ZS',
  },
  URBAN_SHARE: {
    code: 'SP.URB.TOTL.IN.ZS',
    label: 'Urban population (% of total population)',
    shortLabel: 'Urban population',
    link: 'https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS',
  },
  OD_URBAN: {
    code: 'SH.STA.ODFC.UR.ZS',
    label: 'People practicing open defecation, urban (% of urban population)',
    shortLabel: 'Open defecation (urban)',
    link: 'https://data.worldbank.org/indicator/SH.STA.ODFC.UR.ZS',
  },
  OD_RURAL: {
    code: 'SH.STA.ODFC.RU.ZS',
    label: 'People practicing open defecation, rural (% of rural population)',
    shortLabel: 'Open defecation (rural)',
    link: 'https://data.worldbank.org/indicator/SH.STA.ODFC.RU.ZS',
  },
  BASIC_URBAN: {
    code: 'SH.STA.BASS.UR.ZS',
    label: 'People using at least basic sanitation services, urban (% of urban population)',
    shortLabel: 'Basic sanitation (urban)',
    link: 'https://data.worldbank.org/indicator/SH.STA.BASS.UR.ZS',
  },
  BASIC_RURAL: {
    code: 'SH.STA.BASS.RU.ZS',
    label: 'People using at least basic sanitation services, rural (% of rural population)',
    shortLabel: 'Basic sanitation (rural)',
    link: 'https://data.worldbank.org/indicator/SH.STA.BASS.RU.ZS',
  },
  CHILDREN_0_14: {
    code: 'SP.POP.0014.TO.ZS',
    label: 'Population ages 0-14 (% of total population)',
    shortLabel: 'Children 0-14',
    link: 'https://data.worldbank.org/indicator/SP.POP.0014.TO.ZS',
  },
  OFFICIAL_FX: {
    code: 'PA.NUS.FCRF',
    label: 'Official exchange rate (LCU per US$, period average)',
    shortLabel: 'Exchange rate',
    link: 'https://data.worldbank.org/indicator/PA.NUS.FCRF',
  },
} as const satisfies Record<string, IndicatorDefinition>;

// Fields fetched from the World Bank, in one request per country.
const FIELD_INDICATORS: [keyof CountryApiData['fields'], IndicatorDefinition][] = [
  ['population', INDICATORS.POPULATION],
  ['gdpPerCapita', INDICATORS.GDP_PER_CAPITA],
  ['openDefecation', INDICATORS.OPEN_DEFECATION],
  ['mortalityUnder5Rate', INDICATORS.MORTALITY_U5],
  ['tourismReceipts', INDICATORS.TOURISM_RECEIPTS],
  ['birthRate', INDICATORS.BIRTH_RATE],
  ['healthExpenditure', INDICATORS.HEALTH_EXPENDITURE],
  ['stuntingPrevalence', INDICATORS.STUNTING],
  ['washMortality', INDICATORS.WASH_MORTALITY],
  ['basicSanitation', INDICATORS.BASIC_SANITATION],
  ['urbanShare', INDICATORS.URBAN_SHARE],
  ['openDefecationUrban', INDICATORS.OD_URBAN],
  ['openDefecationRural', INDICATORS.OD_RURAL],
  ['basicSanitationUrban', INDICATORS.BASIC_URBAN],
  ['basicSanitationRural', INDICATORS.BASIC_RURAL],
  ['children0to14Share', INDICATORS.CHILDREN_0_14],
  ['exchangeRate', INDICATORS.OFFICIAL_FX],
];

interface WBResponseItem {
  indicator?: { id: string };
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

const buildExchangeRateSource = (currencyCode: string, reason: string): DataSourceInfo => ({
  label: `Live FX ${CURRENT_YEAR}`,
  kind: 'live',
  sourceName: 'open.er-api.com',
  requestedYear: CURRENT_YEAR,
  actualYear: CURRENT_YEAR,
  fallbackUsed: true,
  tone: 'warning',
  notes: `Today's USD/${currencyCode} market rate. ${reason} Costs are in analysis-year US dollars, so the local-currency figure mixes years.`,
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

/**
 * Indicators that set the analysis year. These are annual national series that the World Bank
 * updates every year. Survey-based or modelled series (stunting, diarrhoea, open defecation,
 * WASH-attributed deaths) and tourism are published irregularly, so letting them choose the year
 * would drag the whole analysis back (e.g. Malawi's WASH-mortality series only has 2019).
 * Those inputs use their most recent value up to the analysis year and are flagged as older.
 */
const CORE_KEYS: ReadonlyArray<keyof CountryApiData['fields']> = [
  'population',
  'gdpPerCapita',
  'healthExpenditure',
  'mortalityUnder5Rate',
  'birthRate',
  'basicSanitation',
];

export const YEAR_RULE =
  'The analysis year is the most recent year for which all core annual indicators (population, GDP per capita, health spending per person, under-5 mortality, birth rate and basic sanitation coverage) have World Bank data. Survey-based and irregular inputs use their most recent value up to that year.';

const latestYear = (series: IndicatorSeriesPoint[]) => (series.length ? Math.max(...series.map((p) => p.year)) : null);

const explainYear = (seriesResults: IndicatorSeriesResult[], analysisYear: number): YearExplanation => {
  const isCore = (r: IndicatorSeriesResult) => CORE_KEYS.includes(r.key);
  const core = seriesResults.filter(isCore).map((r) => ({ label: r.definition.shortLabel, latestYear: latestYear(r.series) }));
  const limiting = core.filter((c) => c.latestYear === analysisYear).map((c) => c.label);
  const olderOrMissing = seriesResults
    .filter((r) => !isCore(r))
    .map((r) => {
      const used = r.series.filter((p) => p.year <= analysisYear).sort((a, b) => b.year - a.year)[0]
        ?? r.series.slice().sort((a, b) => a.year - b.year)[0];
      return { label: r.definition.shortLabel, latestYear: latestYear(r.series), usedYear: used?.year ?? null };
    })
    .filter((r) => r.usedYear !== analysisYear);
  return { rule: YEAR_RULE, core, limiting, olderOrMissing };
};

const selectAlignedYear = (allResults: IndicatorSeriesResult[]) => {
  const seriesResults = allResults.filter((result) => CORE_KEYS.includes(result.key));
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

/**
 * All indicators for one country in a single request (source=2 is World Development Indicators).
 * Falls back to one request per indicator if the combined request fails.
 */
const fetchAllSeries = async (isoCode: string): Promise<IndicatorSeriesResult[]> => {
  const codes = FIELD_INDICATORS.map(([, d]) => d.code).join(';');
  const url = `https://api.worldbank.org/v2/country/${isoCode}/indicator/${codes}?source=2&format=json&per_page=2000&date=${FIRST_YEAR}:${LAST_REQUEST_YEAR}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url);
      const data: WBResponse = await response.json();
      const rows = data[1];
      if (!Array.isArray(rows)) throw new Error('No rows');
      return FIELD_INDICATORS.map(([key, definition]) => ({
        key,
        definition,
        series: rows
          .filter((r) => r.indicator?.id === definition.code && r.value !== null)
          .map((r) => ({ year: Number.parseInt(r.date, 10), value: r.value as number }))
          .filter((p) => Number.isFinite(p.year))
          .sort((a, b) => b.year - a.year),
      }));
    } catch (error) {
      console.warn(`Combined World Bank request failed for ${isoCode} (attempt ${attempt + 1})`, error);
    }
  }
  return Promise.all(FIELD_INDICATORS.map(([key, definition]) => fetchIndicatorSeries(isoCode, key, definition)));
};

// Today's market rates from open.er-api.com (free, no key). Only used when the official rate for the
// analysis year is missing or belongs to an older currency.
let liveRatesPromise: Promise<Record<string, number>> | null = null;
const fetchLiveRates = () => {
  if (!liveRatesPromise) {
    liveRatesPromise = fetch('https://open.er-api.com/v6/latest/USD')
      .then((r) => r.json())
      .then((d) => d?.rates || {})
      .catch((error) => {
        console.warn('Could not fetch live exchange rates', error);
        liveRatesPromise = null;
        return {};
      });
  }
  return liveRatesPromise;
};

/**
 * The official exchange rate for the analysis year matches the analysis-year US$ costs. Today's rate is used
 * only if there is no official rate, or if it is out of line with today's rate by more than 10× (the currency
 * was redenominated, e.g. Sierra Leone 2022, Zimbabwe 2024).
 */
const chooseExchangeRate = async (official: CountryIndicatorValue, currencyCode: string): Promise<CountryIndicatorValue> => {
  if (currencyCode === 'USD') {
    return { value: 1, source: { label: 'US dollar', kind: 'api', tone: 'success', notes: 'The country uses the US dollar.' } };
  }
  const live = (await fetchLiveRates())[currencyCode];
  if (official.value && (!live || (official.value / live < 10 && live / official.value < 10))) {
    return official;
  }
  if (live) {
    const reason = official.value
      ? `The World Bank official rate (${official.value.toFixed(2)}) is for an older currency unit, so today's rate is used.`
      : 'No World Bank official rate is available for the analysis year.';
    return { value: live, source: buildExchangeRateSource(currencyCode, reason) };
  }
  return { value: null, source: buildMissingExchangeRateSource() };
};

// US GDP per person (for the VSL transfer) and the US GDP deflator (to inflate WHO-CHOICE 2010 costs).
let usSeriesPromise: Promise<{ gdp: IndicatorSeriesPoint[]; deflator: IndicatorSeriesPoint[] }> | null = null;
const fetchUsSeries = () => {
  if (!usSeriesPromise) {
    usSeriesPromise = fetch(`https://api.worldbank.org/v2/country/US/indicator/NY.GDP.PCAP.CD;NY.GDP.DEFL.ZS?source=2&format=json&per_page=200&date=2010:${LAST_REQUEST_YEAR}`)
      .then((r) => r.json())
      .then((data: WBResponse) => {
        const rows = data[1] || [];
        const series = (code: string) => rows
          .filter((r) => r.indicator?.id === code && r.value !== null)
          .map((r) => ({ year: Number.parseInt(r.date, 10), value: r.value as number }));
        return { gdp: series('NY.GDP.PCAP.CD'), deflator: series('NY.GDP.DEFL.ZS') };
      })
      .catch((error) => {
        console.warn('Could not fetch US reference series', error);
        usSeriesPromise = null;
        return { gdp: [], deflator: [] };
      });
  }
  return usSeriesPromise;
};

const valueAtOrBefore = (series: IndicatorSeriesPoint[], year: number) =>
  series.filter((p) => p.year <= year).sort((a, b) => b.year - a.year)[0]?.value ?? null;

export const fetchCountryData = async (isoCode: string, currencyCode: string = 'USD'): Promise<CountryApiData> => {
  const [indicatorResults, us] = await Promise.all([fetchAllSeries(isoCode), fetchUsSeries()]);
  const { analysisYear, alignmentStrategy } = selectAlignedYear(indicatorResults);

  const fieldEntries = indicatorResults.map((result) => [
    result.key,
    selectValueForYear(result.definition, analysisYear, result.series),
  ]) as [keyof CountryApiData['fields'], CountryIndicatorValue][];

  const fields = Object.fromEntries(fieldEntries) as CountryApiData['fields'];
  fields.exchangeRate = await chooseExchangeRate(fields.exchangeRate, currencyCode);
  const fallbackFields = fieldEntries
    .filter(([, value]) => value.source.fallbackUsed)
    .map(([key]) => key);

  const deflatorNow = valueAtOrBefore(us.deflator, analysisYear);
  const deflator2010 = us.deflator.find((p) => p.year === 2010)?.value ?? null;
  const deflator2015 = us.deflator.find((p) => p.year === 2015)?.value ?? null;

  return {
    analysisYear,
    alignmentStrategy,
    fallbackFields,
    yearExplanation: explainYear(indicatorResults, analysisYear),
    fields,
    usGdpPerCapita: valueAtOrBefore(us.gdp, analysisYear),
    usDeflatorRatio: deflatorNow && deflator2010 ? deflatorNow / deflator2010 : null,
    usDeflatorSince2015: deflatorNow && deflator2015 ? deflatorNow / deflator2015 : null,
  };
};

/**
 * Fetches data for all supported countries in batches to avoid rate limiting.
 * Used for the comparison tab.
 */
export const fetchAllLDCData = async (onProgress: (progress: number) => void) => {
  const allData: Record<string, CountryApiData | null> = {};
  const batchSize = 3;

  for (let i = 0; i < SUPPORTED_COUNTRIES.length; i += batchSize) {
    const batch = SUPPORTED_COUNTRIES.slice(i, i + batchSize);

    await Promise.all(batch.map(async (country) => {
      try {
        allData[country.code] = await fetchCountryData(country.code, country.currency);
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
