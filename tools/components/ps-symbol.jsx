// ps-symbol.jsx — <ProcessSymbol kind playing size> plays one process animation inline.
// Still on the opening mark until the pointer is over its step (or `playing` is set);
// while hovered it loops; when the pointer leaves it finishes back to the mark and stops.
// Hover is detected with native listeners on the nearest [data-ps-hover] ancestor
// (falling back to the parent element), so it works wherever CSS :hover works.
(() => {
  const scenes = (list) => {
    const cues = {}; let t = 0;
    list.forEach(([name, dur]) => { if (!(name in cues)) cues[name] = t; t += dur; });
    return { cues, total: t, start: list[0][1] };
  };
  const DEFS = {
    question: { film: 'QuestionFilm', ...scenes([['Rest', 1.2], ['Doubt', 2.4], ['Probe', 3.4], ['Resolve', 3], ['Hold', 1]]) },
    decode: { film: 'DecodeFilm', ...scenes([['Rest', 1.5], ['Disassemble', 2.5], ['Rearrange', 3], ['Reform', 3], ['Settle', 1]]) },
    experiment: { film: 'ExperimentFilm', ...scenes([['Rest', 1.2], ['Hypothesis', 2.4], ['Trials', 4.4], ['Converge', 2.6], ['Hold', 1]]) },
    refine: { film: 'RefineFilm', ...scenes([['Rest', 1.2], ['Loosen', 2.2], ['Iterate', 4.6], ['Lock', 2], ['Hold', 1]]) },
    realise: { film: 'RealiseFilm', ...scenes([['Rest', 1.2], ['Recede', 2.2], ['Ground', 1.2], ['Rise', 4.2], ['Hold', 1.2]]) },
  };

  function ProcessSymbol({ kind = 'question', playing = false, size = 128, texture = true, paper = '#ffffff' }) {
    const def = DEFS[kind] || DEFS.question;
    const px = Number(size) || 128;
    const [T, setT] = React.useState(0);
    const [hot, setHot] = React.useState(false);
    const box = React.useRef(null);
    const s = React.useRef({ T: 0, active: false, last: 0, raf: 0 }).current;
    const active = !!playing || hot;
    s.active = active;

    // native detection on the surrounding step: a mouse or pen hovering it, keyboard focus,
    // or 'ps:on' / 'ps:off' events sent by the process panel (image hover, phone scrolling, taps).
    // Touch pointer events are ignored here: on phones the panel decides which step plays.
    React.useEffect(() => {
      const el = box.current;
      if (!el) return;
      const host = (el.closest && el.closest('[data-ps-hover]')) || el.parentElement || el;
      const isMouse = (e) => !e.pointerType || e.pointerType === 'mouse' || e.pointerType === 'pen';
      const enter = (e) => { if (isMouse(e)) setHot(true); };
      const leave = (e) => { if (isMouse(e)) setHot(false); };
      const fin = () => { let v = false; try { v = host.matches(':focus-visible'); } catch (e) {} if (v) setHot(true); };
      const fout = () => setHot(false);
      const on = () => setHot(true), off = () => setHot(false);
      const L = [['pointerenter', enter], ['pointerleave', leave], ['focusin', fin], ['focusout', fout], ['ps:on', on], ['ps:off', off]];
      L.forEach(([t, f]) => host.addEventListener(t, f));
      return () => L.forEach(([t, f]) => host.removeEventListener(t, f));
    }, []);

    // animation clock
    React.useEffect(() => {
      if (!active || s.raf) return;
      if (s.T === 0) s.T = Math.max(0, def.start - 0.15); // skip the still opening beat
      s.last = performance.now();
      const tick = (now) => {
        const dt = Math.min(0.05, Math.max(0, (now - s.last) / 1000));
        s.last = now;
        let t = s.T + dt * (s.active ? 1 : 1.8); // finish faster once the pointer leaves
        if (t >= def.total) {
          if (s.active) t = def.start + (t - def.total);
          else { s.T = 0; s.raf = 0; setT(0); return; }
        }
        s.T = t; setT(t);
        s.raf = requestAnimationFrame(tick);
      };
      s.raf = requestAnimationFrame(tick);
    }, [active]);
    React.useEffect(() => () => { if (s.raf) cancelAnimationFrame(s.raf); s.raf = 0; }, []);

    const Piece = window[def.film];
    const Ctx = window.__PSCtx;
    return (
      <div ref={box} className="psym" aria-hidden="true" style={{ position: 'relative', width: px, height: px, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1080, transform: `scale(${px / 1080})`, transformOrigin: '0 0' }}>
          {Piece && Ctx ? (
            <Ctx.Provider value={{ T, CUES: def.cues }}>
              <Piece settle={true} texture={texture} paper={paper} />
            </Ctx.Provider>
          ) : null}
        </div>
      </div>
    );
  }
  window.ProcessSymbol = ProcessSymbol;
})();
