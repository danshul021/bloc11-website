// site.js — small page behaviours that don't need React:
// the home slideshow, the rolling numbers, the Work filters and the phone menu.
(function () {
  'use strict';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // ---- phone menu: close it after choosing a link ----
  document.querySelectorAll('.mnav').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target.closest('a')) d.removeAttribute('open'); });
    document.addEventListener('click', function (e) { if (d.open && !d.contains(e.target)) d.removeAttribute('open'); });
  });

  // ---- home: slideshow ----
  var heroImg = document.getElementById('hero-img');
  var dataEl = document.getElementById('hero-data');
  if (heroImg && dataEl) {
    var slides = [];
    try { slides = JSON.parse(dataEl.textContent); } catch (e) {}
    var kicker = document.getElementById('hero-kicker');
    var bars = document.getElementById('hero-bars');
    var count = document.getElementById('hero-count');
    var i = 0, timer = 0;
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    var preload = function (k) { var s = slides[k]; if (s) { var im = new Image(); im.src = s.src; } };
    var show = function (k) {
      if (!slides.length) return;
      i = (k + slides.length) % slides.length;
      var s = slides[i];
      heroImg.onerror = function () { heroImg.onerror = null; heroImg.src = s.raw; };
      heroImg.src = s.src; heroImg.alt = s.alt; heroImg.style.objectPosition = s.pos;
      if (kicker) kicker.textContent = s.caption;
      if (count) count.textContent = p2(i + 1) + ' / ' + p2(slides.length);
      if (bars) Array.prototype.forEach.call(bars.children, function (b, n) { b.style.opacity = n === i ? '1' : '0.35'; });
      preload((i + 1) % slides.length);
    };
    var restart = function () { clearInterval(timer); if (slides.length > 1) timer = setInterval(function () { show(i + 1); }, 5000); };
    document.querySelectorAll('[data-hero]').forEach(function (b) {
      b.addEventListener('click', function () { show(i + Number(b.getAttribute('data-hero'))); restart(); });
    });
    preload(1);
    restart();
  }

  // ---- home: the numbers roll in each time they come into view, and reset once they leave ----
  var stats = document.getElementById('stats');
  if (stats) {
    var rolls = Array.prototype.slice.call(stats.querySelectorAll('.droll'));
    var set = function (on) {
      rolls.forEach(function (el) {
        var d = Number(el.getAttribute('data-d')), di = Number(el.getAttribute('data-i')), si = Number(el.getAttribute('data-s'));
        el.style.transition = on && !reduce ? 'transform ' + (1.6 + di * 0.35) + 's cubic-bezier(.16,.8,.2,1) ' + (si * 0.15) + 's' : 'none';
        el.style.transform = on ? 'translateY(-' + (10 + d) + 'em)' : 'translateY(0em)';
      });
    };
    if (window.IntersectionObserver && !reduce) {
      // the page arrives showing the final numbers (for search engines and no-script visitors);
      // wind them back to zero straight away so they can roll up when they come into view
      set(false);
      void stats.offsetHeight;
      var rolled = false;
      var io = new IntersectionObserver(function (es) {
        var e = es[es.length - 1];
        if (e.isIntersecting && e.intersectionRatio >= 0.35) { if (rolled !== true) { rolled = true; void stats.offsetHeight; set(true); } }
        else if (!e.isIntersecting && rolled !== false) { rolled = false; set(false); }
      }, { threshold: [0, 0.35] });
      io.observe(stats);
    }

    // a quick scroll or a quick sideways move rolls the digits a little; springs bring them back
    if (!reduce) {
      var nudges = Array.prototype.slice.call(stats.querySelectorAll('.dnudge'));
      var items = nudges.map(function () { return { y: 0, vy: 0 }; });
      var raf = 0, lastT = 0, lastY = window.scrollY, lastX = null;
      var step = function (now) {
        var dt = Math.min(0.033, Math.max(0.001, (now - lastT) / 1000)); lastT = now;
        var moving = false;
        nudges.forEach(function (el, k) {
          var it = items[k], kS = 170, c = 15;
          it.vy += (-kS * it.y - c * it.vy) * dt;
          it.y += it.vy * dt;
          var lim = (el.parentElement ? el.parentElement.getBoundingClientRect().height : 60) * 0.55;
          it.y = Math.max(-lim, Math.min(lim, it.y));
          if (Math.abs(it.y) > 0.05 || Math.abs(it.vy) > 0.5) moving = true;
          el.style.transform = 'translate3d(0,' + it.y.toFixed(2) + 'px,0)';
        });
        raf = moving ? requestAnimationFrame(step) : 0;
      };
      var kick = function (amount) {
        nudges.forEach(function (el, k) { items[k].vy += amount * (1 + (k % 2) * 0.25 + Math.floor(k / 2) * 0.2); });
        if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(step); }
      };
      var near = function () { var r = stats.getBoundingClientRect(); return r.bottom > -200 && r.top < window.innerHeight + 200; };
      window.addEventListener('scroll', function () {
        var y = window.scrollY, d = y - lastY; lastY = y;
        if (Math.abs(d) > 2 && near()) kick(-Math.max(-60, Math.min(60, d)) * 4);
      }, { passive: true });
      var onMove = function (x) {
        if (lastX == null) { lastX = x; return; }
        var d = x - lastX; lastX = x;
        if (Math.abs(d) > 6 && near()) kick(Math.max(-60, Math.min(60, d)) * 3);
      };
      window.addEventListener('pointermove', function (e) { onMove(e.clientX); }, { passive: true });
      window.addEventListener('touchmove', function (e) { var t = e.touches && e.touches[0]; if (t) onMove(t.clientX); }, { passive: true });
    }
  }

  // ---- work: filters and list / grid view ----
  var filters = document.getElementById('work-filters');
  if (filters) {
    var state = { type: 'All', status: 'Any', view: 'list' };
    var list = document.getElementById('work-list'), grid = document.getElementById('work-grid'), empty = document.getElementById('work-empty');
    var apply = function () {
      var shown = 0;
      document.querySelectorAll('#work-list .lrow, #work-grid .card').forEach(function (el) {
        var ok = (state.type === 'All' || el.getAttribute('data-cat') === state.type) && (state.status === 'Any' || el.getAttribute('data-status') === state.status);
        el.hidden = !ok;
        if (ok && el.classList.contains('lrow')) shown++;
      });
      list.hidden = state.view !== 'list' || !shown;
      grid.hidden = state.view !== 'grid' || !shown;
      empty.hidden = !!shown;
      filters.querySelectorAll('button').forEach(function (b) {
        var on = (b.hasAttribute('data-type') && b.getAttribute('data-type') === state.type) ||
          (b.hasAttribute('data-status') && b.getAttribute('data-status') === state.status) ||
          (b.hasAttribute('data-view') && b.getAttribute('data-view') === state.view);
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    };
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-type')) state.type = b.getAttribute('data-type');
      if (b.hasAttribute('data-status')) state.status = b.getAttribute('data-status');
      if (b.hasAttribute('data-view')) state.view = b.getAttribute('data-view');
      apply();
    });
  }
})();
