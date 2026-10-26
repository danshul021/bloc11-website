// ticker.jsx — <Ticker messages speed> black-and-white pixel notice board.
// The text scrolls right-to-left forever (JS-driven, so it runs in every preview),
// pauses while the pointer is over it, and never widens the page: the track is
// absolutely positioned inside a fixed-height window.
(() => {
  function Ticker({ messages = [], speed = 70, height = 64, fontSize = 28 }) {
    const win = React.useRef(null);
    const set = React.useRef(null);
    const track = React.useRef(null);
    const st = React.useRef({ x: 0, w: 0, last: 0, raf: 0, paused: false }).current;
    const list = (Array.isArray(messages) ? messages : [String(messages)]).filter(Boolean);

    React.useEffect(() => {
      const el = win.current;
      if (!el) return;
      const reduce = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
      const measure = () => { st.w = set.current ? set.current.getBoundingClientRect().width : 0; };
      measure();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
      const ro = window.ResizeObserver ? new ResizeObserver(measure) : null;
      if (ro && set.current) ro.observe(set.current);
      const tick = (now) => {
        const dt = Math.min(0.05, Math.max(0, (now - st.last) / 1000));
        st.last = now;
        if (!st.paused && st.w > 0) {
          st.x -= speed * (reduce ? 0.5 : 1) * dt;   // slower, never frozen, when the computer asks for less motion
          if (st.x <= -st.w) st.x += st.w;
          if (track.current) track.current.style.transform = `translate3d(${st.x.toFixed(2)}px,0,0)`;
        }
        st.raf = requestAnimationFrame(tick);
      };
      st.last = performance.now();
      st.raf = requestAnimationFrame(tick);
      const on = () => { st.paused = true; }, off = () => { st.paused = false; };
      el.addEventListener('pointerenter', on); el.addEventListener('pointerleave', off);
      return () => {
        cancelAnimationFrame(st.raf);
        if (ro) ro.disconnect();
        el.removeEventListener('pointerenter', on); el.removeEventListener('pointerleave', off);
      };
    }, [speed, list.join('|')]);

    const msg = { flex: '0 0 auto', paddingLeft: 36, paddingRight: 36, fontFamily: "'Silkscreen','DotGothic16',ui-monospace,monospace", fontSize, lineHeight: 1, letterSpacing: '0.05em', color: '#FFFFFF', whiteSpace: 'nowrap', WebkitFontSmoothing: 'none' };
    const one = (key) => (
      <div ref={key === 'a' ? set : null} key={key} style={{ display: 'flex', flex: '0 0 auto' }}>
        {list.map((m, i) => <span key={i} style={msg}>{m} ■</span>)}
      </div>
    );
    return (
      <div ref={win} role="marquee" aria-label={'Notice board. ' + list.join('. ')}
        style={{ boxSizing: 'border-box', width: '100%', minWidth: 0, border: '1px solid #0E0E0E', padding: 8, background: '#FFFFFF' }}>
        <div style={{ position: 'relative', overflow: 'hidden', height, background: '#0E0E0E' }}>
          <div ref={track} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', willChange: 'transform' }}>
            {one('a')}{one('b')}{one('c')}
          </div>
          {/* square pixel grid over the letters */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(to right,#0E0E0E 1px,transparent 1px),linear-gradient(to bottom,#0E0E0E 1px,transparent 1px)', backgroundSize: '4px 4px' }} />
        </div>
      </div>
    );
  }
  window.Ticker = Ticker;
})();
