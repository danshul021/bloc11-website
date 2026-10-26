// ps-kit.jsx — lightweight player for the five Bloc 11 process-symbol animations.
// Replaces the full composition stage (playback bar, tweaks panel) with a tiny
// timeline context so each symbol can play inline on the homepage.
(() => {
  const Easing = {
    linear: (t) => t,
    easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
    easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  };
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const Ctx = React.createContext({ T: 0, CUES: {} });
  window.Easing = Easing;
  window.clamp = clamp;
  window.__PSCtx = Ctx;
  window.useComposition = () => React.useContext(Ctx);
})();

// Shared helpers for the five process-symbol animations (from symbol-kit.jsx).
const SK = (() => {
  const backOut = (k) => (t) => { const c = k + 1; return 1 + c * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2); };
  const MOTION = { travel: Easing.easeInOutCubic, settle: backOut(0.9), calm: Easing.easeInOutSine };
  const INK = '#2e2c28';
  const lerp = (a, b, p) => a + (b - a) * p;
  const mix = (a, b, p) => Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], p)) : lerp(a, b, p);
  function track(T, stops, settle = true) {
    if (T <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      const [t1, v1, e] = stops[i], [t0, v0] = stops[i - 1];
      if (T < t1) {
        const ease = e === 'settle' && !settle ? MOTION.travel : MOTION[e || 'travel'];
        return mix(v0, v1, ease(clamp((T - t0) / Math.max(1e-6, t1 - t0), 0, 1)));
      }
    }
    return stops[stops.length - 1][1];
  }
  const shift = (stops, dt) => stops.map(([t, v, e]) => [t === 0 ? 0 : t + dt, v, e]);
  const pt = (cx, cy, r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  function arcPath(cx, cy, R, r, a0, a1) {
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    const [x0, y0] = pt(cx, cy, R, a0), [x1, y1] = pt(cx, cy, R, a1);
    if (r <= 0) return `M${cx} ${cy}L${x0} ${y0}A${R} ${R} 0 ${large} 1 ${x1} ${y1}Z`;
    const [x2, y2] = pt(cx, cy, r, a1), [x3, y3] = pt(cx, cy, r, a0);
    return `M${x0} ${y0}A${R} ${R} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${r} ${r} 0 ${large} 0 ${x3} ${y3}Z`;
  }
  function strokeArc(cx, cy, r, a0, a1) {
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1);
    return `M${x0} ${y0}A${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  }
  function lineAt([x1, y1, x2, y2], rot = 0, scale = 1, dx = 0, dy = 0) {
    const mx = (x1 + x2) / 2 + dx, my = (y1 + y2) / 2 + dy;
    const hl = Math.hypot(x2 - x1, y2 - y1) / 2 * scale;
    const a = Math.atan2(y2 - y1, x2 - x1) + rot * Math.PI / 180;
    return [mx - hl * Math.cos(a), my - hl * Math.sin(a), mx + hl * Math.cos(a), my + hl * Math.sin(a)];
  }
  function Ln({ p, dash, w }) {
    return <line x1={p[0]} y1={p[1]} x2={p[2]} y2={p[3]} stroke={INK} strokeWidth={w || (dash ? 2 : 2.6)} strokeDasharray={dash ? '7 8' : undefined} />;
  }
  function WashDefs() {
    return (
      <defs>
        <filter id="wash" x="0" y="0" width="1080" height="1080" filterUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.013" numOctaves="4" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0 0 0 -0.33" result="a" />
          <feComposite in="a" in2="SourceAlpha" operator="in" result="m" />
          <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="m" /></feMerge>
        </filter>
      </defs>
    );
  }
  const cam = (T, a, b, amt = 0.05) => (T <= a || T >= b) ? 1 : 1 + amt * Math.sin(Math.PI * MOTION.calm((T - a) / (b - a)));
  function Frame({ paper, scale, children }) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: paper, overflow: 'hidden' }}>
        <svg width="1080" height="1080" viewBox="0 0 1080 1080" style={{ position: 'absolute', inset: 0, transform: `scale(${scale || 1})`, transformOrigin: '540px 540px' }}>
          <WashDefs />
          {children}
        </svg>
      </div>
    );
  }
  // inline use: each symbol file registers its bare animation piece
  const makeFilm = (Piece) => Piece;
  return { MOTION, INK, track, shift, arcPath, strokeArc, lineAt, Ln, cam, Frame, makeFilm, mix };
})();
window.SK = SK;
