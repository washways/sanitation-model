import React, { useEffect, useMemo } from 'react';
import changelogSource from '../CHANGELOG.md?raw';

export const APP_VERSION = __APP_VERSION__;

interface Release {
  heading: string;
  items: string[];
}

// CHANGELOG.md is the single source: "## vX.Y.Z — date" headings followed by "- " bullets.
const parseChangelog = (md: string): Release[] => {
  const releases: Release[] = [];
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('## ')) releases.push({ heading: line.slice(3), items: [] });
    else if (line.startsWith('- ') && releases.length) releases[releases.length - 1].items.push(line.slice(2));
  }
  return releases;
};

export const ChangelogDialog = ({ onClose }: { onClose: () => void }) => {
  const releases = useMemo(() => parseChangelog(changelogSource), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/35 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Changelog"
        onClick={e => e.stopPropagation()}
        className="bg-white border border-slate-300 shadow-2xl rounded-lg w-[min(94vw,44rem)] max-h-[86vh] overflow-hidden flex flex-col"
      >
        <div className="px-4 py-3 border-b border-line flex items-center gap-3">
          <div>
            <h2 className="font-bold text-slate-900">What changed</h2>
            <p className="text-xs text-slate-500">You are using v{APP_VERSION}.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3 space-y-4 text-sm text-slate-700">
          {releases.map(r => (
            <section key={r.heading}>
              <h3 className="font-semibold text-slate-900">{r.heading}</h3>
              <ul className="mt-1 list-disc pl-5 space-y-1">
                {r.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
