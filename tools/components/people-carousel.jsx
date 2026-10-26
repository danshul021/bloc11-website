// people-carousel.jsx — <PeopleCarousel people> endless portrait carousel for the Office page.
// Runs the full width of the screen and loops forever (the list repeats after itself).
// The centre portrait is the "current" one: name, designation and qualifications under it;
// neighbours show name + designation, faded. Advances every few seconds, pauses on hover,
// previous / next buttons and arrow keys. Entries with no img show an empty portrait frame.
(() => {
  const mod = (a, n) => ((a % n) + n) % n;

  function Silhouette({ size }) {
    return (
      <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 48 48" aria-hidden="true" style={{ opacity: 0.35 }}>
        <circle cx="24" cy="17" r="9" fill="none" stroke="#6B6760" strokeWidth="1.5" />
        <path d="M8 44c1.5-9 8-14 16-14s14.5 5 16 14" fill="none" stroke="#6B6760" strokeWidth="1.5" />
      </svg>
    );
  }

  function PeopleCarousel({ people = [], interval = 4200 }) {
    const n = people.length;
    const box = React.useRef(null), prev = React.useRef(null), next = React.useRef(null);
    const [pos, setPos] = React.useState(0);          // unbounded: the loop never "rewinds"
    const [w, setW] = React.useState(1440);
    const st = React.useRef({ pos: 0, paused: false, t: 0 }).current;

    React.useEffect(() => {
      const el = box.current;
      if (!el || !n) return;
      const go = (d) => { st.pos += d; setPos(st.pos); };
      const measure = () => setW(el.getBoundingClientRect().width || 1440);
      measure();
      const ro = window.ResizeObserver ? new ResizeObserver(measure) : null;
      if (ro) ro.observe(el);
      window.addEventListener('resize', measure);
      const reduce = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
      st.t = setInterval(() => { if (!st.paused && !reduce) go(1); }, interval);
      const p = () => go(-1), q = () => go(1);
      const key = (e) => { if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); } if (e.key === 'ArrowRight') { go(1); e.preventDefault(); } };
      const on = () => { st.paused = true; }, off = () => { st.paused = false; };
      // swipe left / right with a finger
      const sd = (e) => { if (e.pointerType === 'touch') { st.sx = e.clientX; st.sy = e.clientY; st.paused = true; } };
      const su = (e) => {
        if (e.pointerType !== 'touch' || st.sx == null) return;
        const dx = e.clientX - st.sx, dy = e.clientY - st.sy;
        st.sx = null; st.paused = false;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      };
      el.addEventListener('pointerdown', sd); el.addEventListener('pointerup', su); el.addEventListener('pointercancel', su);
      prev.current && prev.current.addEventListener('click', p);
      next.current && next.current.addEventListener('click', q);
      el.addEventListener('keydown', key);
      el.addEventListener('pointerenter', on); el.addEventListener('pointerleave', off);
      el.addEventListener('focusin', on); el.addEventListener('focusout', off);
      return () => {
        clearInterval(st.t); if (ro) ro.disconnect(); window.removeEventListener('resize', measure);
        prev.current && prev.current.removeEventListener('click', p);
        next.current && next.current.removeEventListener('click', q);
        el.removeEventListener('keydown', key);
        el.removeEventListener('pointerenter', on); el.removeEventListener('pointerleave', off);
        el.removeEventListener('focusin', on); el.removeEventListener('focusout', off);
        el.removeEventListener('pointerdown', sd); el.removeEventListener('pointerup', su); el.removeEventListener('pointercancel', su);
      };
    }, [n, interval]);

    if (!n) return null;
    const narrow = w < 600;                                      // phones: one big portrait, neighbours peek in at the edges
    const card = narrow ? Math.min(230, w * 0.56) : Math.max(130, Math.min(200, w * 0.13));   // portrait size
    const gap = narrow ? w * 0.1 : Math.max(28, card * 0.3);
    const step = card + gap;
    const label = 128;                                           // name + designation (+ qualifications for the centre one)
    const reach = Math.ceil(w / 2 / step) + 2;                   // enough slides to fill the screen both sides
    const cur = people[mod(pos, n)];
    const slides = [];
    for (let v = pos - reach; v <= pos + reach; v++) slides.push(v);
    const btn = { width: 44, height: 44, border: '1px solid #0E0E0E', background: '#FFFFFF', color: '#0E0E0E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0, padding: 0 };

    return (
      // breaks out of the page column to span the whole screen width
      <div ref={box} tabIndex={0} role="region" aria-roledescription="carousel" aria-label="Our people"
        style={{ position: 'relative', width: '100cqw', marginLeft: 'calc(50% - 50cqw)', outlineOffset: -4, touchAction: 'pan-y' }}>
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', height: card + label + 8 }}>
          {slides.map((v) => {
            const p = people[mod(v, n)];
            const d = v - pos;
            const on = d === 0;
            const x = w / 2 - card / 2 + d * step;
            return (
              <div key={v} aria-hidden={on ? undefined : 'true'}
                style={{ position: 'absolute', top: 4, left: 0, width: card, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, transform: `translateX(${x.toFixed(1)}px)`, opacity: on ? 1 : Math.abs(d) === 1 ? 0.55 : 0.3, transition: 'transform .8s cubic-bezier(.65,0,.25,1), opacity .6s ease' }}>
                <div style={{ width: card, height: card, overflow: 'hidden', background: '#ECE8E1', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: on ? 'scale(1)' : 'scale(.86)', transformOrigin: '50% 100%', filter: on ? 'none' : 'grayscale(1)', transition: 'transform .8s cubic-bezier(.65,0,.25,1)' }}>
                  {p.img ? <img loading="lazy" decoding="async" src={p.img} alt={on ? `Portrait of ${p.name}` : ''} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <Silhouette size={card} />}
                </div>
                <span style={{ opacity: narrow && !on ? 0 : 1, fontSize: on ? 18 : 16, fontWeight: 500, letterSpacing: '-0.015em', lineHeight: 1.2, whiteSpace: 'nowrap', transition: 'font-size .4s ease' }}>{p.name}</span>
                <span style={{ opacity: narrow && !on ? 0 : 1, fontSize: 12, letterSpacing: '0.1em', color: on ? '#A5532F' : '#6B6760', marginTop: -6, whiteSpace: 'nowrap' }}>{p.role}</span>
                {on && p.edu ? <span key={'e' + v} style={{ fontSize: 12, letterSpacing: '0.1em', lineHeight: 1.7, color: '#3A3733', marginTop: -6, whiteSpace: 'pre-line', width: Math.min(Math.max(card, 320), w - 32), animation: 'pcIn .5s ease .15s both' }}>{p.edu}</span> : null}
              </div>
            );
          })}
        </div>
        <div aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{cur.name}, {cur.role}{cur.edu ? ', ' + cur.edu.replace(/\n/g, ', ') : ''}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 4 }}>
          <button ref={prev} type="button" aria-label="Previous person" style={btn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
          <button ref={next} type="button" aria-label="Next person" style={btn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button>
        </div>
        <style>{'@keyframes pcIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'}</style>
      </div>
    );
  }
  window.PeopleCarousel = PeopleCarousel;
})();
