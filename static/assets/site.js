// site.js — small page behaviours that don't need React:
// the home slideshow, the rolling numbers, the Work filters and the phone menu.
(function () {
  'use strict';
  // The rolling numbers play even when the computer asks for reduced motion, as in the design.
  var reduce = false;

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

  // ---- work: filters and list / grid / vault view ----
  var filters = document.getElementById('work-filters');
  if (filters) {
    var main = document.querySelector('main[data-view]');
    var params = new URLSearchParams(location.search);
    var state = { type: 'All', status: 'Any', view: (main && main.getAttribute('data-view')) || params.get('view') || 'list' };
    var list = document.getElementById('work-list'), grid = document.getElementById('work-grid'), empty = document.getElementById('work-empty');
    var vaultBox = document.getElementById('work-vault');
    var vault = vaultBox ? makeVault(vaultBox, function () { return state; }) : null;
    var apply = function () {
      var shown = 0;
      document.querySelectorAll('#work-list .lrow, #work-grid .card').forEach(function (el) {
        var ok = (state.type === 'All' || el.getAttribute('data-cat') === state.type) && (state.status === 'Any' || el.getAttribute('data-status') === state.status);
        el.hidden = !ok;
        if (ok && el.classList.contains('lrow')) shown++;
      });
      var isVault = state.view === 'vault' && vault;
      list.hidden = state.view !== 'list' || !shown;
      grid.hidden = state.view !== 'grid' || !shown;
      empty.hidden = !!shown || isVault;
      if (vaultBox) { vaultBox.hidden = !isVault; if (isVault) vault.render(); }
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
      if (b.hasAttribute('data-view')) {
        state.view = b.getAttribute('data-view');
        // the Vault has its own address (/work/vault/), so a search can be shared as a link
        try {
          var path = state.view === 'vault' ? '/work/vault/' : '/work/';
          if (location.pathname !== path) history.replaceState(null, '', path + (state.view === 'vault' && vault && vault.q() ? '?q=' + encodeURIComponent(vault.q()) : ''));
        } catch (err) {}
      }
      apply();
    });
    apply();
    if (state.view === 'vault' && vault && params.get('q')) vault.search(params.get('q'));
  }

  // ---- the Vault: collage of every project photo, searchable by its description and tags ----
  function makeVault(box, getState) {
    var items = [];
    try { items = JSON.parse(document.getElementById('vault-data').textContent); } catch (e) {}
    var gridEl = box.querySelector('#vgrid'), input = box.querySelector('#vq'), clear = box.querySelector('#vclear'), countEl = box.querySelector('#vcount');
    // words that mean the same thing when searching
    var GROUPS = [
      ['elevation', 'facade', 'façade', 'front', 'street front'], ['exterior', 'outside', 'outdoor'], ['interior', 'inside'],
      ['bedroom', 'bed room', 'master bedroom', 'guest room'], ['living', 'lounge', 'drawing room', 'family room', 'sitting'],
      ['kitchen', 'pantry'], ['bathroom', 'bath', 'toilet', 'washroom'], ['staircase', 'stair', 'stairs', 'steps'],
      ['dining', 'dinning'], ['residential', 'residence', 'home', 'house', 'villa', 'apartment'],
      ['commercial', 'office', 'workplace', 'showroom', 'retail'], ['hospitality', 'hotel', 'resort', 'restaurant', 'cafe'],
      ['jaali', 'jali', 'screen', 'perforated'], ['brick', 'terracotta'], ['dusk', 'night', 'evening'],
      ['landscape', 'garden', 'planting', 'plants', 'planters', 'trees'], ['render', 'visualisation', 'visualization', '3d'],
      ['courtyard', 'court', 'atrium'], ['terrace', 'balcony', 'deck'], ['detail', 'close up', 'closeup']
    ];
    var stem = function (w) { w = w.toLowerCase().trim(); if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y'; if (w.length > 4 && /(ss|us)$/.test(w)) return w; if (w.length > 3 && /s$/.test(w)) return w.slice(0, -1); return w; };
    var norm = function (t) { return ' ' + String(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').map(stem).join(' ') + ' '; };
    items.forEach(function (it) { it.hay = norm(it.t + ' ' + it.a); });
    var variants = function (word) {
      var w = stem(word), out = [w];
      GROUPS.forEach(function (g) { if (g.some(function (x) { return stem(x) === w || norm(x).trim() === w; })) g.forEach(function (x) { out.push(norm(x).trim()); }); });
      return out;
    };
    var query = '';
    var matches = function (it) {
      var st = getState();
      if (st.type !== 'All' && it.c !== st.type) return false;
      if (st.status !== 'Any' && it.st !== st.status) return false;
      if (!query) return true;
      // every word typed has to match (in any of its meanings)
      return norm(query).trim().split(' ').filter(Boolean).every(function (w) {
        return variants(w).some(function (v) { return it.hay.indexOf(' ' + v) !== -1; });
      });
    };
    var shown = [];
    var render = function () {
      shown = items.filter(matches);
      gridEl.innerHTML = shown.length ? shown.map(function (it, k) {
        return '<a class="vitem" href="' + it.f + '" data-k="' + k + '"><img src="' + it.s + '" width="' + it.w + '" height="' + it.h + '" loading="lazy" decoding="async" alt="' + esc(it.a) + '"><span class="vcap">' + esc(it.p) + '</span></a>';
      }).join('') : '<p class="vnone">No photos match “' + esc(query) + '” yet. Try another word, or clear the search.</p>';
      countEl.textContent = shown.length + (shown.length === 1 ? ' photo' : ' photos') + (query ? ' for “' + query + '”' : '');
      clear.hidden = !query;
      box.querySelectorAll('.vchip').forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-q') === query); });
    };
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var timer = 0;
    var search = function (q) {
      query = String(q || '').trim(); input.value = query; render(); box.scrollTop = 0;
      try { if (location.pathname === '/work/vault/') history.replaceState(null, '', '/work/vault/' + (query ? '?q=' + encodeURIComponent(query) : '')); } catch (e) {}
    };
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { search(input.value); input.focus(); }, 180); });
    clear.addEventListener('click', function () { search(''); input.focus(); });
    box.querySelectorAll('.vchip').forEach(function (c) { c.addEventListener('click', function () { search(query === c.getAttribute('data-q') ? '' : c.getAttribute('data-q')); }); });

    // big view of one photo
    var light = null, at = 0;
    var show = function (k) {
      at = (k + shown.length) % shown.length;
      var it = shown[at];
      if (!light) {
        light = document.createElement('div');
        light.className = 'vlight'; light.setAttribute('role', 'dialog'); light.setAttribute('aria-modal', 'true');
        light.innerHTML = '<button type="button" class="vx" aria-label="Close">×</button><button type="button" class="vp" aria-label="Previous photo">‹</button><img alt=""><div class="vinfo"></div><button type="button" class="vn" aria-label="Next photo">›</button>';
        document.body.appendChild(light);
        light.querySelector('.vx').addEventListener('click', hide);
        light.querySelector('.vp').addEventListener('click', function () { show(at - 1); });
        light.querySelector('.vn').addEventListener('click', function () { show(at + 1); });
        light.addEventListener('click', function (e) { if (e.target === light) hide(); });
        var sx = null;
        light.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
        light.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1)); });
      }
      var im = light.querySelector('img'); im.src = it.f; im.alt = it.a;
      light.querySelector('.vinfo').innerHTML = esc(it.a) + (it.u ? ' &nbsp;<a href="' + it.u + '">See the project →</a>' : '') +
        '<div class="vtags">' + esc(it.t.split(' | ').slice(0, 10).join(' · ')) + '</div>';
      light.hidden = false; document.documentElement.style.overflow = 'hidden';
      light.querySelector('.vx').focus();
    };
    var hide = function () { if (light) { light.hidden = true; document.documentElement.style.overflow = ''; } };
    document.addEventListener('keydown', function (e) {
      if (!light || light.hidden) return;
      if (e.key === 'Escape') hide(); else if (e.key === 'ArrowRight') show(at + 1); else if (e.key === 'ArrowLeft') show(at - 1);
    });
    gridEl.addEventListener('click', function (e) {
      var a = e.target.closest('.vitem'); if (!a) return;
      e.preventDefault();
      var k = a.hasAttribute('data-k') ? Number(a.getAttribute('data-k')) : shown.indexOf(items[Number(a.getAttribute('data-i'))]);
      show(Math.max(0, k));
    });
    return { render: render, search: search, q: function () { return query; } };
  }
})();
