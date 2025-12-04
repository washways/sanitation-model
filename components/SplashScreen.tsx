import React from 'react';

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 bg-brand-dark z-50 overflow-y-auto">
      <div className="min-h-full w-full flex flex-col items-center justify-center p-0 md:p-4">
        <div className="w-full md:max-w-5xl bg-white md:bg-slate-800 md:rounded-3xl md:shadow-2xl md:border md:border-slate-700 overflow-hidden flex flex-col md:flex-row shadow-none min-h-screen md:min-h-0">
          
          {/* Left Visual Side */}
          <div className="w-full md:w-5/12 bg-gradient-to-br from-brand-primary to-blue-600 p-8 md:p-10 flex flex-col justify-between text-white relative shrink-0">
            <div className="relative z-10">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Sanitation Impact Modeler</h1>
              <div className="h-1.5 w-16 md:w-24 bg-brand-accent mb-6 md:mb-8"></div>
              <p className="text-blue-50 text-lg md:text-xl font-medium leading-relaxed opacity-90">
                Quantifying the hidden economic burden of poor sanitation on health, productivity, and human potential.
              </p>
            </div>
            
            <div className="relative z-10 mt-8 md:mt-16 space-y-4 md:space-y-6 hidden sm:block">
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
          <div className="w-full md:w-7/12 p-6 md:p-12 bg-white text-slate-800 flex flex-col justify-center grow">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-4 md:mb-6 mt-4 md:mt-0">About This Tool</h2>
            <p className="text-slate-600 mb-6 md:mb-8 text-base md:text-lg leading-relaxed">
              Poor sanitation is not just a health crisis; it is an economic one. This tool uses a 
              <strong> bottom-up "Cost of Illness" & "Human Capital" approach</strong> to estimate the financial losses 
              incurred by a country due to inadequate sanitation facilities and hygiene practices.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8 md:mb-10">
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

            <button 
              onClick={onStart}
              className="w-full bg-brand-primary hover:bg-sky-500 text-white font-bold text-lg md:text-xl py-4 md:py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 mb-6 md:mb-0"
            >
              Launch Model
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
            
            <p className="text-[10px] md:text-xs text-center text-slate-400 mt-2 md:mt-6 font-medium pb-4 md:pb-0">
              Modeled after World Bank WSP methodologies. Data sourced live from World Bank Open Data API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};