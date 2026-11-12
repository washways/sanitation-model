import React, { useEffect } from 'react';

interface SplashScreenProps {
  onStart: () => void;
}

/**
 * Layout guarantees the "Launch Model" button is always on screen:
 * - The overlay is exactly one viewport tall (100dvh, so mobile browser bars are accounted for).
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
    <div className="fixed inset-0 h-[100dvh] bg-brand-dark z-50 flex items-center justify-center p-0 md:p-4">
      <div className="w-full h-full md:h-auto md:max-h-full md:max-w-5xl bg-white md:rounded-3xl md:shadow-2xl md:border md:border-slate-700 overflow-hidden flex flex-col">

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col md:flex-row">

          {/* Left Visual Side */}
          <div className="w-full md:w-5/12 bg-gradient-to-br from-brand-primary to-blue-600 p-6 md:p-10 flex flex-col justify-between text-white relative shrink-0 overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Sanitation Impact Modeler</h1>
              <div className="h-1.5 w-16 md:w-24 bg-brand-accent mb-6 md:mb-8"></div>
              <p className="text-blue-50 text-lg md:text-xl font-medium leading-relaxed opacity-90">
                Quantifying the hidden economic burden of poor sanitation on health, productivity, and human potential.
              </p>
            </div>

            <div className="relative z-10 mt-8 md:mt-12 space-y-4 md:space-y-6 hidden sm:block">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-base md:text-lg border border-white/30">1</div>
                <span className="font-semibold text-base md:text-lg">Select Country</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-base md:text-lg border border-white/30">2</div>
                <span className="font-semibold text-base md:text-lg">Adjust Inputs</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-base md:text-lg border border-white/30">3</div>
                <span className="font-semibold text-base md:text-lg">Analyze Costs</span>
              </div>
            </div>

            {/* Abstract blobs - Hidden on mobile to save space/visual noise */}
            <div className="hidden md:block absolute -bottom-32 -right-32 w-80 h-80 bg-brand-dark rounded-full mix-blend-multiply opacity-50 blur-3xl"></div>
            <div className="hidden md:block absolute top-0 -left-10 w-40 h-40 bg-white rounded-full mix-blend-overlay opacity-20 blur-2xl"></div>
          </div>

          {/* Right Content Side */}
          <div className="w-full md:w-7/12 p-6 md:p-12 bg-white text-slate-800 flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-4 md:mb-6">About This Tool</h2>
            <p className="text-slate-600 mb-6 md:mb-8 text-base md:text-lg leading-relaxed">
              Poor sanitation is not just a health crisis; it is an economic one. This tool uses a
              <strong> bottom-up "Cost of Illness" & "Human Capital" approach</strong> to estimate the financial losses
              incurred by a country due to inadequate sanitation facilities and hygiene practices.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="bg-blue-50 p-4 md:p-5 rounded-xl border border-blue-100">
                <h3 className="font-bold text-brand-primary mb-1 md:mb-2 flex items-center gap-2 text-sm md:text-base">
                  Health & Mortality
                </h3>
                <p className="text-xs md:text-sm text-slate-600">
                  Treatment costs for disease and value of premature deaths (Human Capital or VSL).
                </p>
              </div>
              <div className="bg-amber-50 p-4 md:p-5 rounded-xl border border-amber-100">
                <h3 className="font-bold text-brand-accent mb-1 md:mb-2 flex items-center gap-2 text-amber-600 text-sm md:text-base">
                  Access Time
                </h3>
                <p className="text-xs md:text-sm text-slate-600">
                  Productive time lost searching for open defecation sites.
                </p>
              </div>
              <div className="bg-green-50 p-4 md:p-5 rounded-xl border border-green-100">
                <h3 className="font-bold text-green-600 mb-1 md:mb-2 flex items-center gap-2 text-sm md:text-base">
                  Stunting
                </h3>
                <p className="text-xs md:text-sm text-slate-600">
                  Future wage losses due to childhood stunting and cognitive delay.
                </p>
              </div>
              <div className="bg-slate-100 p-4 md:p-5 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-1 md:mb-2 flex items-center gap-2 text-sm md:text-base">
                  Uncertainty
                </h3>
                <p className="text-xs md:text-sm text-slate-600">
                  Monte Carlo simulations provide robust confidence intervals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pinned footer - always visible regardless of screen height */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 md:px-8 md:py-4 flex flex-col-reverse md:flex-row items-center gap-2 md:gap-6">
          <p className="text-[10px] md:text-xs text-center md:text-left text-slate-400 font-medium md:flex-1">
            Modeled after World Bank WSP methodologies. Data sourced live from World Bank Open Data API.
          </p>
          <button
            onClick={onStart}
            autoFocus
            className="w-full md:w-auto md:px-10 bg-brand-primary hover:bg-sky-500 text-white font-bold text-lg py-3 md:py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
          >
            Launch Model
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
