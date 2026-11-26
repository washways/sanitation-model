import React, { useEffect } from 'react';

interface SplashScreenProps {
  onStart: () => void;
}

const FEATURES: [string, string][] = [
  ['Health & mortality', 'WHO country estimates of illness and deaths from inadequate sanitation, with treatment costs and the value of lives lost.'],
  ['Access time', 'Productive time lost walking to open defecation sites, urban and rural.'],
  ['Shown separately', 'Stunting, tourism and carbon, which have weaker evidence, can be added to the total.'],
  ['Uncertainty', 'A range and a chart of which assumptions drive the result, not just one number.'],
];

const STEPS = ['Select a country', 'Adjust the inputs', 'Read the costs'];

/**
 * Layout guarantees the "Launch Model" button is always on screen:
 * - The overlay is exactly one viewport tall (100dvh, so mobile browser bars are accounted for)
 *   and pads its bottom by --bottom-inset, the height of the WASHways consent banner while it
 *   is showing (see utils/useBottomOverlayInset.ts).
 * - The card is capped at the overlay height (max-h-full).
 * - Only the card body scrolls (flex-1 min-h-0 overflow-y-auto); the footer holding the
 *   button is a non-shrinking sibling, so it can never be pushed off screen.
 * - Enter / Escape also dismiss the splash as a keyboard fallback.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') onStart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] bg-page flex items-center justify-center p-0 pb-[var(--bottom-inset,0px)] sm:p-4 sm:pb-[max(var(--bottom-inset,0px),1rem)]">
      <div className="w-full h-full sm:h-auto sm:max-h-full sm:max-w-4xl bg-white sm:rounded-xl sm:border sm:border-line overflow-hidden flex flex-col">

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col md:flex-row">

          {/* Left: title */}
          <div className="md:w-5/12 shrink-0 bg-navy text-white px-5 py-6 md:p-8 flex flex-col">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.09em] text-navy-sub">washways · sanitation economics</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold leading-tight tracking-tight">Sanitation Impact Modeler</h1>
            <p className="mt-3 text-sm md:text-base text-[#d5dde0] leading-relaxed">
              Puts a money value on the hidden cost of poor sanitation: health, productivity and human potential.
            </p>
            <ol className="mt-6 md:mt-auto md:pt-8 space-y-2 text-sm hidden sm:block">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="w-6 h-6 shrink-0 rounded-full border border-[#56666d] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="font-semibold">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Right: about */}
          <div className="md:w-7/12 px-5 py-6 md:p-8 text-slate-800">
            <h2 className="text-lg md:text-xl font-bold text-slate-900">About this tool</h2>
            <p className="mt-2 text-sm md:text-[15px] text-slate-600 leading-relaxed">
              Poor sanitation is an economic problem as well as a health one. This tool uses a bottom-up
              <strong className="text-slate-800"> cost-of-illness and human-capital approach</strong> to estimate what a country
              loses each year to inadequate sanitation and hygiene.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FEATURES.map(([title, body]) => (
                <div key={title} className="p-3 rounded-lg border border-line">
                  <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                  <p className="mt-0.5 text-xs text-slate-600 leading-snug">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pinned footer - always visible regardless of screen height */}
        <div className="shrink-0 border-t border-line bg-white px-4 py-3 md:px-6 flex flex-col-reverse sm:flex-row items-center gap-2 sm:gap-4">
          <p className="text-[11px] text-center sm:text-left text-slate-500 sm:flex-1">
            Modelled on World Bank WSP methods. Data from the World Bank Open Data API.
          </p>
          <button
            onClick={onStart}
            autoFocus
            className="w-full sm:w-auto sm:px-6 bg-brand-primary hover:bg-sky-600 text-white font-semibold text-base py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            Launch model
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
