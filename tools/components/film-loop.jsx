// film-loop.jsx — <FilmLoop src poster label> a silent film that loops on its own.
// Plays by itself on a loop (muted, inline) and keeps looping; a small pause / play button sits
// in the corner. It rests while scrolled off screen and carries on when it comes back, unless
// the visitor paused it.
(() => {
  function FilmLoop({ src, poster, label = 'Film' }) {
    const v = React.useRef(null), btn = React.useRef(null), box = React.useRef(null);
    const [playing, setPlaying] = React.useState(false);
    const st = React.useRef({ user: null, seen: false }).current;   // user: true/false once they press the button

    React.useEffect(() => {
      const el = v.current, b = btn.current, wrap = box.current;
      if (!el || !b || !wrap) return;
      el.muted = true; el.defaultMuted = true; el.playsInline = true;
      const sync = () => {
        const want = st.seen && st.user !== false;
        if (want && el.paused) { const p = el.play(); if (p && p.catch) p.catch(() => {}); }
        if (!want && !el.paused) el.pause();
      };
      const onPlay = () => setPlaying(true), onPause = () => setPlaying(false);
      el.addEventListener('play', onPlay); el.addEventListener('pause', onPause);
      const click = () => { st.user = el.paused; sync(); };
      b.addEventListener('click', click);
      let io = null;
      st.seen = true; sync();                                         // start straight away
      if (window.IntersectionObserver) {
        io = new IntersectionObserver((es) => { st.seen = es.some((e) => e.isIntersecting); sync(); }, { threshold: 0 });
        io.observe(wrap);
      }
      // some browsers refuse autoplay until the page is touched; try again then
      const nudge = (e) => { if (e && e.target && e.target.nodeType === 1 && b.contains(e.target)) return; sync(); };
      window.addEventListener('pointerdown', nudge, { once: true });
      el.addEventListener('canplay', nudge);
      return () => {
        if (io) io.disconnect();
        el.removeEventListener('play', onPlay); el.removeEventListener('pause', onPause);
        el.removeEventListener('canplay', nudge); window.removeEventListener('pointerdown', nudge);
        b.removeEventListener('click', click);
      };
    }, [src]);

    return (
      <div ref={box} style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#FFFFFF', overflow: 'hidden' }}>
        <video ref={v} src={src} poster={poster} muted autoPlay loop playsInline preload="auto" aria-label={label}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <button ref={btn} type="button" aria-label={playing ? 'Pause film' : 'Play film'}
          style={{ position: 'absolute', right: 14, bottom: 14, width: 44, height: 44, border: '1px solid rgba(20,20,20,0.25)', borderRadius: 0, background: 'rgba(255,255,255,0.85)', color: '#141414', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          {playing
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5l12 7-12 7z" /></svg>}
        </button>
      </div>
    );
  }
  window.FilmLoop = FilmLoop;
})();
