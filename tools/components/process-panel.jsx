// process-panel.jsx — <ProcessPanel panels> the large image that goes with the five process steps.
//
// Wide screens, with a mouse: until someone points at it, the steps play by themselves 01 → 05
// while the section is on screen. Then pointing at a step (or at the image itself) shows that step's image
// in its tinted version, then fades the original colours in, evenly across the picture, for as long as
// the pointer stays, until the picture is fully coloured. Leaving fades it back to the tint.
//
// Phones (the page sets --reel:1 on .proc): the five steps play in one place like a short film —
// each step's big symbol animates, its words run across the width below it, and the picture
// under them fades into
// colour; then the next step takes over, 01 → 05, and round again. Progress bars run above
// the film. Tap to skip ahead. It pauses while the section is off screen.
//
// Tablets without a mouse: the step you scroll to — or tap — becomes the current one.
// Native listeners on the .pstep[data-step] items, so it works in any preview mode.
(() => {
  const DUR = [9.8, 9.5, 10.4, 9.8, 8.8];            // ≈ one loop of each step's symbol animation
  const smooth = (t) => t * t * (3 - 2 * t);
  const mq = (q) => { try { return window.matchMedia(q); } catch (e) { return { matches: false, addEventListener() {}, removeEventListener() {} }; } };

  function ProcessPanel({ panels = [] }) {
    const box = React.useRef(null);
    const [active, setActive] = React.useState(0);
    const [p, setP] = React.useState(0);
    const [reel, setReel] = React.useState(false);
    const st = React.useRef({ onStep: false, onPanel: false, p: 0, active: 0, raf: 0, last: 0, touch: false, reel: false, auto: false, hovered: false, seen: false, live: -1, sraf: 0 }).current;

    React.useEffect(() => {
      const panel = box.current;
      if (!panel) return;
      const steps = Array.from(document.querySelectorAll('.pstep[data-step]'));
      const proc = steps[0] ? steps[0].parentElement : null;
      const wrap = panel.closest('.pwrap') || panel.parentElement;
      const n = steps.length || panels.length || 1;
      const noHover = mq('(hover: none)');
      st.touch = noHover.matches;

      const send = (el, on) => { if (el) el.dispatchEvent(new Event(on ? 'ps:on' : 'ps:off')); };
      const select = (k) => {
        if (st.active !== k) { steps[st.active] && steps[st.active].classList.remove('is-hot'); st.active = k; st.p = 0; setActive(k); setP(0); }
      };
      // make step k the one that plays (-1: none)
      const play = (k) => {
        if (st.live === k) return;
        if (st.live >= 0 && steps[st.live]) { send(steps[st.live], false); steps[st.live].classList.remove('is-hot', 'is-live'); }
        st.live = k;
        if (k < 0) { st.onStep = false; kick(); return; }
        select(k);
        steps[k].classList.add('is-hot', 'is-live');
        send(steps[k], true);
        st.onStep = true; kick();
      };

      const tick = (now) => {
        const dt = Math.min(0.05, Math.max(0, (now - st.last) / 1000));
        st.last = now;
        const film = st.reel || st.auto;
        const running = film ? st.seen : (st.onStep || st.onPanel);
        let q = film && !running ? st.p : st.p + (running ? dt / (DUR[st.active] || 10) : -dt / 0.4);
        if (film && running && q >= 1) {            // film: hand over to the next step
          const nx = (st.active + 1) % n;
          play(nx); q = 0;
        }
        q = Math.max(0, Math.min(1, q));
        st.p = q; setP(q);
        st.raf = (running && (film || q < 1)) || (!running && !film && q > 0) ? requestAnimationFrame(tick) : 0;
      };
      function kick() { if (!st.raf) { st.last = performance.now(); st.raf = requestAnimationFrame(tick); } }

      // ---- which mode? ----
      const setMode = () => {
        const on = !!proc && getComputedStyle(proc).getPropertyValue('--reel').trim() === '1';
        st.touch = noHover.matches;
        if (on === st.reel) return;
        st.reel = on; setReel(on);
        play(-1);
        steps.forEach((el) => el.classList.remove('is-hot', 'is-live'));
        if (on) { st.auto = false; play(st.active); } else startAuto();
        st.p = 0; setP(0); kick();
      };

      // ---- computers: the steps play by themselves (01 → 05, round again) while the section is
      // on screen, until the visitor first points at a step or the picture; then hover takes over ----
      const startAuto = () => {
        if (st.reel || st.touch || st.hovered || st.auto) return;
        st.auto = true; st.p = 0; setP(0); play(st.active); kick();
      };
      const stopAuto = () => {
        st.hovered = true;
        if (!st.auto) return;
        st.auto = false; play(-1);
        steps.forEach((el) => el.classList.remove('is-hot', 'is-live'));
      };

      // ---- tablets without a mouse: the current step follows scrolling ----
      const pick = () => {
        st.sraf = 0;
        if (st.reel || !st.touch || !wrap) return;
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const wr = wrap.getBoundingClientRect();
        if (wr.bottom < vh * 0.25 || wr.top > vh * 0.75) { play(-1); return; }
        const line = vh * 0.4;
        let best = 0, bd = Infinity;
        steps.forEach((el, k) => {
          const r = el.getBoundingClientRect();
          const d = r.top <= line && r.bottom >= line ? 0 : Math.min(Math.abs(r.top - line), Math.abs(r.bottom - line));
          if (d < bd) { bd = d; best = k; }
        });
        play(best);
      };
      const onScroll = () => { if (!st.sraf) st.sraf = requestAnimationFrame(pick); };

      const offs = [];
      const listen = (el, type, fn, opt) => { el.addEventListener(type, fn, opt); offs.push(() => el.removeEventListener(type, fn, opt)); };
      const isMouse = (e) => !e.pointerType || e.pointerType === 'mouse' || e.pointerType === 'pen';

      steps.forEach((el) => {
        const k = Math.max(0, Number(el.getAttribute('data-step')) - 1);
        listen(el, 'pointerenter', (e) => { if (st.reel || st.touch || !isMouse(e)) return; stopAuto(); select(k); st.onStep = true; kick(); });
        listen(el, 'pointerleave', (e) => { if (st.reel || st.touch || !isMouse(e)) return; st.onStep = false; kick(); });
        listen(el, 'focusin', () => { let v = false; try { v = el.matches(':focus-visible'); } catch (e) {} if (!v || st.reel) return; if (st.touch) { play(k); return; } stopAuto(); select(k); st.onStep = true; kick(); });
        listen(el, 'focusout', () => { if (!st.touch && !st.reel) { st.onStep = false; kick(); } });
        listen(el, 'click', () => { if (st.touch && !st.reel) play(k); });
      });
      // film: a tap anywhere on it skips to the next step
      if (wrap) listen(wrap, 'click', () => { if (!st.reel) return; play((st.active + 1) % n); st.p = 0; setP(0); kick(); });
      listen(panel, 'pointerenter', (e) => { if (st.reel || st.touch || !isMouse(e)) return; stopAuto(); st.onPanel = true; steps[st.active] && steps[st.active].classList.add('is-hot'); send(steps[st.active], true); kick(); });
      listen(panel, 'pointerleave', (e) => { if (st.reel || st.touch || !isMouse(e)) return; st.onPanel = false; steps[st.active] && steps[st.active].classList.remove('is-hot'); send(steps[st.active], false); kick(); });

      listen(window, 'scroll', onScroll, { passive: true });
      listen(window, 'resize', () => { setMode(); onScroll(); });
      const ro = window.ResizeObserver && wrap ? new ResizeObserver(() => setMode()) : null;
      if (ro) { ro.observe(wrap); offs.push(() => ro.disconnect()); }
      // the film only runs while it is on screen
      if (window.IntersectionObserver && wrap) {
        const io = new IntersectionObserver((es) => { st.seen = es.some((e) => e.isIntersecting); if (st.seen) kick(); }, { threshold: 0.25 });
        io.observe(wrap); offs.push(() => io.disconnect());
      } else st.seen = true;
      const onMode = () => { setMode(); if (st.touch) { st.auto = false; onScroll(); } else if (!st.reel) { play(-1); startAuto(); } };
      noHover.addEventListener && noHover.addEventListener('change', onMode);
      offs.push(() => noHover.removeEventListener && noHover.removeEventListener('change', onMode));
      setMode();
      startAuto();
      if (st.touch) onScroll();

      return () => { offs.forEach((f) => f()); if (st.raf) cancelAnimationFrame(st.raf); if (st.sraf) cancelAnimationFrame(st.sraf); st.raf = 0; st.sraf = 0; };
    }, [panels.length]);

    const fill = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
    return (
      <React.Fragment>
        {reel ? (
          // film progress: one bar per step, the current one filling up
          <div className="pbars" aria-hidden="true" style={{ display: 'flex', gap: 4, paddingTop: 4, pointerEvents: 'none' }}>
            {panels.map((pn, k) => (
              <span key={k} style={{ flex: 1, height: 3, background: 'rgba(20,20,20,0.14)', overflow: 'hidden', borderRadius: 2 }}>
                <span style={{ display: 'block', height: '100%', width: (k < active ? 100 : k === active ? p * 100 : 0).toFixed(2) + '%', background: k === active ? (pn.accent || '#141414') : '#141414', opacity: k < active ? 0.55 : 1 }} />
              </span>
            ))}
          </div>
        ) : null}
      <div ref={box} className="ppanel" style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#ffffff', border: '1px solid #ECE8E1', boxSizing: 'border-box' }}>
        {panels.map((pn, k) => {
          const on = k === active;
          // the original colours fade in evenly over the whole picture
          const bloom = { opacity: on ? smooth(p) : 0 };
          return (
            <figure key={k} style={{ position: 'absolute', inset: 0, margin: 0, background: '#ffffff', opacity: on ? 1 : 0, transform: on ? 'none' : 'scale(1.03)', transition: 'opacity .5s ease, transform 1s cubic-bezier(.2,.8,.2,1)', pointerEvents: on ? 'auto' : 'none' }}>
              {pn.tone ? <img loading="lazy" decoding="async" src={pn.tone} alt={pn.alt || ''} style={fill} /> : null}
              {pn.orig ? <img loading="lazy" decoding="async" src={pn.orig} alt="" aria-hidden="true" style={{ ...fill, ...bloom }} /> : null}
              {pn.wall ? (
                <div style={{ position: 'absolute', left: pn.wall.left, top: pn.wall.top, width: pn.wall.width, height: pn.wall.height }}>
                  <img loading="lazy" decoding="async" src={pn.wall.tone} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
                  <img loading="lazy" decoding="async" src={pn.wall.orig} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', ...bloom }} />
                  <img loading="lazy" decoding="async" src={pn.wall.edges} alt="" className={on ? 'pedges run' : 'pedges'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
                </div>
              ) : null}
              <figcaption className="pcap" style={{ position: 'absolute', left: 0, bottom: 0, display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'baseline', padding: '14px 20px', background: '#ffffff', fontSize: 14, color: '#3A3733' }}>
                <span style={{ fontSize: 12, letterSpacing: '0.12em', color: '#141414' }}>{pn.no}</span>
                <span style={{ fontWeight: 500, color: pn.accent }}>{pn.title}</span>
                <span className="pcap-text">{pn.caption}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
      </React.Fragment>
    );
  }
  window.ProcessPanel = ProcessPanel;
})();
