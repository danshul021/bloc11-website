// office-compare.jsx — <OfficeCompare leftSrc rightSrc leftLabel rightLabel aspect>
// Two office photos stacked; a vertical line follows the cursor (or a dragging finger) across
// the picture, revealing the left office on one side of it and the right office on the other.
// Keyboard: focus it and use the arrow keys. Listeners are native so it works in any preview.
(() => {
  function OfficeCompare({ leftSrc, rightSrc, leftLabel = 'Indore', rightLabel = 'Bengaluru', leftAlt = '', rightAlt = '', aspect = '16 / 7' }) {
    const box = React.useRef(null);
    const [pos, setPos] = React.useState(50);          // shown position, %
    const s = React.useRef({ target: 50, cur: 50, raf: 0 }).current;

    React.useEffect(() => {
      const el = box.current;
      if (!el) return;
      const ease = () => {
        s.cur += (s.target - s.cur) * 0.22;              // quick, smooth follow
        if (Math.abs(s.target - s.cur) < 0.05) s.cur = s.target;
        setPos(s.cur);
        s.raf = s.cur === s.target ? 0 : requestAnimationFrame(ease);
      };
      const go = (pct) => { s.target = Math.max(0, Math.min(100, pct)); if (!s.raf) s.raf = requestAnimationFrame(ease); };
      const fromEvent = (e) => { const r = el.getBoundingClientRect(); if (r.width) go((e.clientX - r.left) / r.width * 100); };
      const onMove = (e) => fromEvent(e);
      const onDown = (e) => fromEvent(e);
      const onKey = (e) => {
        if (e.key === 'ArrowLeft') { go(s.target - 5); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { go(s.target + 5); e.preventDefault(); }
        else if (e.key === 'Home') { go(0); e.preventDefault(); }
        else if (e.key === 'End') { go(100); e.preventDefault(); }
      };
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('keydown', onKey);
      return () => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('keydown', onKey);
        if (s.raf) cancelAnimationFrame(s.raf);
      };
    }, []);

    const p = pos.toFixed(2);
    const label = { position: 'absolute', top: 20, padding: '8px 14px', background: '#ffffff', color: '#141414', fontFamily: "'Jost', system-ui, sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: '0.12em', transition: 'opacity .25s ease', pointerEvents: 'none' };
    const img = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', userSelect: 'none', pointerEvents: 'none' };
    return (
      <div ref={box} className="ocmp" tabIndex={0} role="slider" aria-label={`Compare the ${leftLabel} and ${rightLabel} offices`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos)} aria-valuetext={`${Math.round(pos)}% ${leftLabel}`}
        style={{ position: 'relative', width: '100%', aspectRatio: aspect, overflow: 'hidden', background: '#ECE8E1', cursor: 'ew-resize', touchAction: 'pan-y', outlineOffset: 3 }}>
        <img loading="lazy" decoding="async" src={rightSrc} alt={rightAlt} draggable={false} style={img} />
        <img loading="lazy" decoding="async" src={leftSrc} alt={leftAlt} draggable={false} style={{ ...img, clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
        <span style={{ ...label, left: 20, opacity: pos > 12 ? 1 : 0 }}>{leftLabel}</span>
        <span style={{ ...label, right: 20, opacity: pos < 88 ? 1 : 0 }}>{rightLabel}</span>
        {/* on phones the picture is taller, so both offices read clearly */}
        <style>{'@container page (max-width: 640px){.ocmp{aspect-ratio:4 / 3 !important}}'}</style>
        <div aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: 2, marginLeft: -1, background: '#ffffff', boxShadow: '0 0 0 1px rgba(0,0,0,0.12)', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 48, height: 48, marginLeft: -24, marginTop: -24, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.18)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="1.5"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6" /></svg>
          </div>
        </div>
      </div>
    );
  }
  window.OfficeCompare = OfficeCompare;
})();
