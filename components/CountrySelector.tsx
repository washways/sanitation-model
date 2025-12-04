import React from 'react';
import { SUPPORTED_COUNTRIES } from '../constants';

interface CountrySelectorProps {
  selectedCode: string;
  onSelect: (code: string) => void;
  isLoading: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({ selectedCode, onSelect, isLoading }) => {
  return (
    <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-300 shadow-sm transition-colors hover:border-brand-primary/50">
      <div className="relative group">
        <select
          value={selectedCode}
          onChange={(e) => onSelect(e.target.value)}
          disabled={isLoading}
          className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-sm font-bold text-slate-700 focus:outline-none disabled:opacity-50 cursor-pointer w-full group-hover:text-brand-primary transition-colors"
        >
          {SUPPORTED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} className="text-slate-900 bg-white">
              {c.name}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-brand-primary transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {isLoading && (
        <div className="pr-2">
            <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};