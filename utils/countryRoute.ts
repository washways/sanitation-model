import { SUPPORTED_COUNTRIES } from '../constants';

// Shareable country links: https://washways.org/sanitation-model/<slug>, e.g. /kiribati, /dem-rep-congo.
// vite.config.ts writes a page for every slug at build time, so links work on GitHub Pages.

export const countrySlug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const COUNTRY_ROUTES = SUPPORTED_COUNTRIES.map((c) => ({ ...c, slug: countrySlug(c.name) }));

// Accepts the slug or the two-letter code (e.g. /kiribati or /ki), with or without the base path.
export const countryCodeFromPath = (pathname: string, base: string): string | null => {
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const segment = decodeURIComponent(rest.split('/').filter(Boolean)[0] || '').toLowerCase();
  if (!segment) return null;
  const match = COUNTRY_ROUTES.find((c) => c.slug === segment || c.code.toLowerCase() === segment);
  return match ? match.code : null;
};

export const countryPath = (code: string, base: string): string => {
  const match = COUNTRY_ROUTES.find((c) => c.code === code);
  return match ? `${base}${match.slug}` : base;
};
