import { ModelInputs } from '../types';

/**
 * Shareable scenarios: inputs the user changed are written to the link as query parameters, e.g.
 * /sanitation-model/malawi?access.dailyTimeForODRural=0.25&macro.mortalityMethod=vsl
 * Only values that differ from the country's estimated inputs are written. Uncertainty ranges are not.
 */
type Section = Exclude<keyof ModelInputs, 'ranges'>;
const SECTIONS: Section[] = ['macro', 'health', 'nutrition', 'access', 'carbon', 'other', 'investment'];

const same = (a: unknown, b: unknown) =>
  typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= Math.abs(b) * 1e-9 : a === b;

export const scenarioQuery = (inputs: ModelInputs, baseline: ModelInputs): string => {
  const params = new URLSearchParams();
  for (const section of SECTIONS) {
    const current = inputs[section] as unknown as Record<string, unknown>;
    const base = baseline[section] as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(current)) {
      if (!same(value, base[key])) {
        params.set(`${section}.${key}`, typeof value === 'number' ? String(Number(value.toPrecision(8))) : String(value));
      }
    }
  }
  const text = params.toString();
  return text ? `?${text}` : '';
};

/** Applies query parameters to estimated inputs. Unknown keys and values of the wrong type are ignored. */
export const applyScenario = (inputs: ModelInputs, search: string): { inputs: ModelInputs; changed: number } => {
  const params = new URLSearchParams(search);
  const next: ModelInputs = { ...inputs };
  let changed = 0;
  params.forEach((raw, name) => {
    const [section, key] = name.split('.') as [Section, string];
    if (!SECTIONS.includes(section) || !key) return;
    const target = { ...(next[section] as unknown as Record<string, unknown>) };
    if (!(key in target)) return;
    const original = target[key];
    let value: unknown;
    if (typeof original === 'number') {
      const n = Number.parseFloat(raw);
      if (!Number.isFinite(n)) return;
      value = n;
    } else if (typeof original === 'boolean') {
      value = raw === 'true';
    } else {
      value = raw;
    }
    target[key] = value;
    (next as unknown as Record<string, unknown>)[section] = target;
    changed++;
  });
  return { inputs: next, changed };
};
