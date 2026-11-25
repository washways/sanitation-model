import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { COUNTRY_ROUTES } from './utils/countryRoute';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

const BASE = '/sanitation-model/';
const SITE = 'https://washways.org';

// GitHub Pages has no server-side routing, so write a copy of index.html for every country
// (dist/kiribati/index.html …). Each copy gets its own title, canonical and og:url so shared
// links preview with the country name. 404.html is a fallback for anything else.
const countryPages = (): Plugin => ({
  name: 'country-pages',
  apply: 'build',
  closeBundle() {
    const outDir = resolve(__dirname, 'dist');
    const html = readFileSync(resolve(outDir, 'index.html'), 'utf-8');
    for (const c of COUNTRY_ROUTES) {
      const title = `${c.name}: cost of poor sanitation | Sanitation Impact Modeler`;
      const url = `${SITE}${BASE}${c.slug}`;
      const page = html
        .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
        .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${title}"`)
        .replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${title}"`)
        .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${url}"`)
        .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${url}"`);
      mkdirSync(resolve(outDir, c.slug), { recursive: true });
      writeFileSync(resolve(outDir, c.slug, 'index.html'), page);
    }
    writeFileSync(resolve(outDir, '404.html'), html);
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), countryPages()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  base: BASE,
})
