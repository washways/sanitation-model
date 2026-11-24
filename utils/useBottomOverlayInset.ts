import { useEffect } from 'react';

/**
 * The shared WASHways analytics script (washways.org/assets/js/washways-analytics.js) injects a
 * fixed consent banner at the bottom of the page, outside #root, with no id or class. It would
 * otherwise cover the splash screen's Launch button and the bottom of the app.
 *
 * This hook measures any fixed element outside #root that sits along the bottom edge and
 * publishes its height as the CSS variable --bottom-inset on <html>, so layouts can pad for it.
 * It returns to 0px as soon as the banner is dismissed.
 */
export const useBottomOverlayInset = () => {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const vh = window.innerHeight;
      let inset = 0;
      for (const el of Array.from(document.body.children)) {
        if (el.id === 'root' || el.tagName === 'SCRIPT') continue;
        const candidates = [el, ...Array.from(el.querySelectorAll('*'))].slice(0, 50);
        for (const node of candidates) {
          if (getComputedStyle(node).position !== 'fixed') continue;
          const r = node.getBoundingClientRect();
          // Only overlays that hug the bottom edge and are not full-screen.
          if (r.height > 0 && r.height < vh * 0.6 && r.bottom > vh - 48) {
            inset = Math.max(inset, vh - r.top);
          }
        }
      }
      root.style.setProperty('--bottom-inset', inset > 0 ? `${Math.ceil(inset + 8)}px` : '0px');
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
    window.addEventListener('resize', schedule);
    schedule();
    // The banner script loads async; re-check shortly after start-up as well.
    const late = window.setTimeout(schedule, 1500);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.clearTimeout(late);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
};
