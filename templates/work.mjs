// Work index and project pages
import { esc, rich, paras, pad, img, has, cdn, imageSize, altOf, SITE_URL, page, mnav, footer, MNAV_CSS } from './lib.mjs';

const BASE_CSS = `
body{margin:0;background:#FFFFFF}
a{color:#0E0E0E;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
a:hover{color:#6B6A67}
.plain{text-decoration:none}
.nav a{text-decoration:none}.nav a[aria-current]{text-decoration:underline}
:focus-visible{outline:2px solid #0E0E0E;outline-offset:2px}
${MNAV_CSS}
`;

const WORK_CSS = BASE_CSS + `
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;box-sizing:border-box;padding:0 18px;border:1px solid #BDB7AE;border-radius:999px;background:transparent;color:#0E0E0E;font-family:'Jost',sans-serif;font-weight:400;font-size:14px;letter-spacing:0.04em;text-decoration:none;white-space:nowrap;cursor:pointer;transition:background .15s ease,color .15s ease,border-color .15s ease}
.btn:hover{border-color:#0E0E0E}
.btn.on{background:#0E0E0E;color:#FFFFFF;border-color:#0E0E0E}
/* ---- the top of the Work page: quiet tabs for the type, a slim row for status and view ---- */
.wf{display:flex;flex-direction:column;border-bottom:1px solid #0E0E0E}
.wtabs{display:flex;gap:30px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid #E6E5E2;white-space:nowrap}
.wtabs::-webkit-scrollbar{display:none}
.wtab{flex:0 0 auto;border:0;background:none;padding:0 0 13px;margin-bottom:-1px;border-bottom:2px solid transparent;font:400 16px 'Jost',sans-serif;letter-spacing:.01em;color:#6B6A67;cursor:pointer;transition:color .2s,border-color .2s}
.wtab:hover{color:#0E0E0E}
.wtab.on{color:#0E0E0E;font-weight:500;border-bottom-color:#A5532F}
.wbar{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 0}
.wstatus select{-webkit-appearance:none;appearance:none;border:0;border-radius:0;background:transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%236B6A67' stroke-width='1.3'/%3E%3C/svg%3E") no-repeat right center;padding:8px 20px 8px 0;font:400 14px 'Jost',sans-serif;letter-spacing:.02em;color:#0E0E0E;cursor:pointer}
.wseg{display:inline-flex;border:1px solid #CFCAC2;border-radius:999px;padding:3px;gap:2px}
.wseg button{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;border-radius:999px;padding:8px 16px;min-height:0;font:400 14px 'Jost',sans-serif;color:#0E0E0E;cursor:pointer;transition:background .2s,color .2s}
.wseg button:hover{background:#F3F1EE}
.wseg button.on{background:#0E0E0E;color:#FFFFFF}
.wseg .vault-btn{color:#A5532F;font-weight:500;padding:8px 15px 8px 12px}
.wseg .vault-btn.on{background:#A5532F;color:#FFFFFF}
@container page (min-width: 900px){
.wf{flex-direction:row;justify-content:space-between;align-items:flex-end;gap:32px}
.wtabs{border-bottom:0;min-width:0}
.wtab{padding-bottom:16px}
.wbar{padding:0 0 10px;gap:28px}
}
@container page (max-width: 560px){
.wtabs{gap:22px}.wtab{font-size:15px;padding-bottom:12px}
.wbar{padding:12px 0}
.wstatus select{font-size:13px}
.wseg button{padding:7px 12px;font-size:13px}.wseg .vault-btn{padding:7px 12px 7px 10px}
.wseg .vdial{width:15px;height:15px}
}
/* the Vault button: terracotta, with a little safe-dial that ticks round like a combination lock */
.vault-btn{gap:8px;padding:0 18px 0 13px;border-color:#A5532F;color:#A5532F;font-weight:500;transition:transform .25s cubic-bezier(.3,1.6,.5,1),background .2s,color .2s}
.vault-btn:hover{border-color:#A5532F;background:#FBF1EB;transform:rotate(-3deg) scale(1.05)}
.vault-btn.on{background:#A5532F;color:#FFFFFF;border-color:#A5532F;transform:none}
.vdial{width:19px;height:19px;flex:0 0 auto;stroke:currentColor;stroke-width:1.2;stroke-linecap:round;animation:vdial 5.5s cubic-bezier(.7,0,.25,1) infinite}
.vdial .vdot{fill:currentColor;stroke:none}
.vault-btn:hover .vdial{animation:vspin .7s cubic-bezier(.5,0,.3,1) infinite}
@keyframes vdial{0%,8%{transform:rotate(0)}24%,34%{transform:rotate(140deg)}50%,60%{transform:rotate(-70deg)}78%,90%{transform:rotate(230deg)}100%{transform:rotate(360deg)}}
@keyframes vspin{to{transform:rotate(360deg)}}
.row-link{text-decoration:none}
.row-link:hover{color:#0E0E0E}
.row-link:hover .rt,.card:hover .rt{color:#A5532F}
.card{text-decoration:none;color:#0E0E0E}
.card:hover{color:#0E0E0E}
.card img{transition:transform .6s ease}
a.card:hover img{transform:scale(1.03)}
.lmeta{display:none}
[hidden]{display:none !important}
/* ---- phones: the list becomes picture + name + one line of details ---- */
@container page (max-width: 640px){
.lwrap{min-width:0 !important}
.lhead{display:none !important}
.lrow{grid-template-columns:112px minmax(0,1fr) !important;column-gap:16px !important;row-gap:2px !important}
.lrow>.lno{grid-column:2;grid-row:1}
.lrow>img{grid-column:1;grid-row:1 / span 3;width:112px !important;height:84px !important}
.lrow>.rt{grid-column:2;grid-row:2;font-size:20px !important}
.lrow>.lcol{display:none}
.lrow>.lmeta{display:block;grid-column:2;grid-row:3;font-size:13px;color:#6B6A67}
}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:48px 24px}
/* ---- Vault: a scrolling collage of every photo, searchable by its tags ---- */
.vbox{position:relative;border:1px solid #E6E5E2;background:#FFFFFF;margin-top:-16px}
.vhead{position:relative;z-index:3;background:rgba(255,255,255,.94);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);padding:16px 16px 12px;border-bottom:1px solid #EEEDEA;display:flex;flex-direction:column;gap:12px}
.vsearch{display:flex;align-items:center;gap:12px;border:1px solid #0E0E0E;border-radius:999px;padding:0 8px 0 18px;min-height:48px;background:#FFFFFF}
.vsearch input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:400 16px/1.4 'Jost',system-ui,sans-serif;color:#0E0E0E}
.vsearch input::placeholder{color:#8A8680}
.vsearch input::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none;display:none}
.vsearch button{border:0;background:transparent;font:inherit;font-size:13px;color:#6B6A67;cursor:pointer;padding:8px 10px}
.vchips{display:flex;gap:8px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding-bottom:2px;max-height:0;opacity:0;margin-top:-12px;transition:max-height .3s ease,opacity .25s ease,margin .3s ease}
/* the quick-search words appear only while someone is searching; otherwise the photos read like a magazine */
.vbox.searching .vchips{max-height:56px;opacity:1;margin-top:0}
.vchips::-webkit-scrollbar{display:none}
.vchip{flex:0 0 auto;border:1px solid #D6D2CB;border-radius:999px;background:#FFFFFF;padding:7px 14px;font:400 13px 'Jost',sans-serif;letter-spacing:.03em;color:#0E0E0E;cursor:pointer}
.vchip:hover{border-color:#0E0E0E}.vchip.on{background:#0E0E0E;color:#FFFFFF;border-color:#0E0E0E}
.vcount{font-size:12px;letter-spacing:.12em;color:#6B6A67}
/* the collage runs sideways like a magazine strip: two or three rows of photos at their own shape */
.vgrid{display:flex;flex-direction:column;gap:10px;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;padding:12px;scrollbar-width:thin;--rh:clamp(180px,calc((100vh - 230px) / 3),340px)}
.vrow{display:flex;gap:10px;height:var(--rh);width:max-content}
.vrow .vitem{flex:0 0 auto;height:100%;width:auto;margin:0}
.vrow .vitem img{height:100%;width:100%;object-fit:cover}
@container page (max-width: 640px){
/* phones: edge to edge, two rows of big photos */
.vbox{margin-left:calc(-1 * clamp(16px, 4cqw, 56px));margin-right:calc(-1 * clamp(16px, 4cqw, 56px));border-left:0;border-right:0}
.vgrid{gap:6px;padding:6px 0 6px 6px;--rh:calc((100svh - 150px) / 2)}
.vrow{gap:6px}
.vhead{padding:14px 16px 10px}
}
.vgwrap{position:relative}
.vnav{position:absolute;top:50%;z-index:2;width:44px;height:44px;margin-top:-22px;border:0;border-radius:50%;background:rgba(255,255,255,.92);color:#0E0E0E;box-shadow:0 2px 12px rgba(0,0,0,.18);font:400 20px/44px 'Jost',sans-serif;cursor:pointer;transition:opacity .2s}
.vnav[disabled]{opacity:0;pointer-events:none}.vnav.prev{left:10px}.vnav.next{right:10px}
@media (pointer: coarse){.vnav{display:none}}
.vitem{display:block;width:100%;break-inside:avoid;margin:0 0 10px;padding:0;border:0;background:#F3F3F1;cursor:zoom-in;position:relative;overflow:hidden}
@container page (max-width: 640px){.vitem{margin-bottom:6px}}

.vitem img{display:block;width:100%;height:auto;transition:transform .6s ease,opacity .3s ease}
.vitem:hover img{transform:scale(1.03)}
.vitem .vcap{position:absolute;left:0;right:0;bottom:0;padding:22px 12px 10px;background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.55));color:#FFFFFF;font-size:13px;letter-spacing:.02em;text-align:left;opacity:0;transition:opacity .25s ease}
.vitem:hover .vcap,.vitem:focus-visible .vcap{opacity:1}
.vnone{padding:48px 16px;text-align:center;color:#6B6A67;font-size:16px}
.vlight{font-family:'Jost',system-ui,sans-serif;font-weight:300;position:fixed;inset:0;z-index:100;background:rgba(14,14,14,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 16px 24px;box-sizing:border-box}
.vlight img{max-width:100%;max-height:calc(100vh - 170px);object-fit:contain;display:block}
.vlight .vinfo{max-width:900px;margin-top:16px;color:#E8E5E0;text-align:center;font-size:15px;line-height:1.5}
.vlight .vinfo a{color:#FFFFFF}
.vlight .vtags{margin-top:8px;font-size:12px;letter-spacing:.08em;color:#9C978F}
.vlight .vx,.vlight .vp,.vlight .vn{position:absolute;border:0;background:transparent;color:#FFFFFF;cursor:pointer;width:48px;height:48px;font-size:28px;line-height:1}
.vlight .vx{top:10px;right:10px}.vlight .vp{left:6px;top:50%}.vlight .vn{right:6px;top:50%}
`;

const PROJECT_CSS = BASE_CSS + `
@container page (max-width: 640px){.facts{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:16px 24px !important;width:100%}}
.next{text-decoration:none}
.next:hover{color:#0E0E0E}
.next:hover .next-title{text-decoration:underline;text-underline-offset:3px}
`;

 // every photo from every project shown on the site, in a mixed order (round-robin across projects)
export function vaultData(projects) {
  const lists = projects.map((p) => (Array.isArray(p.photos) ? p.photos : [])
    .filter((ph) => ph && typeof ph === 'object' && ph.vault !== false && has(ph.src))
    .map((ph) => ({ ph, p })));
  const out = [];
  for (let k = 0; lists.some((l) => l.length > k); k++) lists.forEach((l) => { if (l[k]) out.push(l[k]); });
  const items = out.map(({ ph, p }, i) => {
    const [w, h] = imageSize(ph.src);
    return {
      i, s: cdn(ph.src, 800), m: cdn(ph.src, 1200), l: cdn(ph.src, 1600), f: cdn(ph.src, 2000), raw: ph.src, w, h,
      a: ph.alt || p.title, p: p.title, u: projectHref(p),
      t: [...(ph.tags || []), p.title, p.type, p.category, p.location].filter(Boolean).join(' | ').toLowerCase(),
      c: p.category || '', st: p.status || '',
    };
  });
  // quick-search chips: the useful words that actually occur, most common first
  const PREF = ['bedroom', 'living room', 'kitchen', 'dining', 'bathroom', 'staircase', 'interior', 'exterior', 'elevation', 'facade', 'brick jaali', 'courtyard', 'landscape', 'detail', 'dusk', 'render'];
  const count = new Map();
  items.forEach((it) => new Set(it.t.split(' | ')).forEach((t) => count.set(t, (count.get(t) || 0) + 1)));
  const chips = PREF.filter((t) => count.get(t)).slice(0, 12);
  return { items, chips };
}

const CATEGORY_ORDER = ['Residential', 'Commercial', 'Hospitality', 'Institutional', 'Interiors', 'Planning', 'Installations'];

function header(site, { workCurrent }) {
  return `  <header style="border-bottom: 1px solid #E2DED7">
    <div style="max-width: 1440px; margin: 0 auto; box-sizing: border-box; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px 24px; padding: 28px clamp(16px, 4cqw, 56px)">
      <a href="/" class="plain" aria-label="${esc(site.firm_name)} — home" style="display: block; line-height: 0">
        <img src="/images/logo-dark.png" alt="${esc(site.firm_name)}" style="height: 42px; width: auto">
      </a>
      <nav class="nav mainnav" aria-label="Main" style="display: flex; gap: 32px; font-size: 13px; font-weight: 600; letter-spacing: 0.2em">
        <a href="/work/"${workCurrent ? ' aria-current="page"' : ''} style="padding: 12px 0">Work</a>
        <a href="/studio/" style="padding: 12px 0">Studio</a>
        <a href="/#contact" style="padding: 12px 0">Contact</a>
      </nav>
      ${mnav([['/work/', 'Work'], ['/studio/', 'Studio'], ['/#contact', 'Contact']], '#0E0E0E')}
    </div>
  </header>`;
}

const statusColor = (s) => (s === 'Ongoing' ? '#A5532F' : '#0E0E0E');
export const projectHref = (p) => (p.has_page ? `/work/${p.slug}/` : '');

export function renderWork({ site, work, projects, vault, view = 'list' }) {
  const cats = [...new Set(projects.map((p) => p.category).filter(Boolean))]
    .sort((a, b) => (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99));
  const statuses = [...new Set(projects.map((p) => p.status).filter(Boolean))];
  const btn = (attr, val, label, on) => `<button type="button" class="btn${on ? ' on' : ''}" ${attr}="${esc(val)}" aria-pressed="${on}">${esc(label)}</button>`;
  const GRID = 'display: grid; grid-template-columns: 56px 160px minmax(0, 3fr) minmax(0, 1.3fr) minmax(0, 1.3fr) minmax(0, 1fr); gap: 24px; align-items: center';

  const row = (p, k) => {
    const href = projectHref(p), tag = href ? 'a' : 'div';
    const attrs = `data-cat="${esc(p.category)}" data-status="${esc(p.status)}"`;
    return `            <${tag}${href ? ` href="${href}"` : ''} class="row-link lrow" ${attrs} style="${GRID}; padding: 14px 0; border-bottom: 1px solid #E6E5E2; font-size: 15px">
              <span class="lno" style="font-size: 12px; letter-spacing: 0.12em; color: #6B6A67">${pad(k + 1, 3)}</span>
              <img ${img(coverFor(p), { widths: [320, 640], sizes: '160px' })} loading="lazy" decoding="async" alt="" style="width: 160px; height: 120px; object-fit: cover; display: block; background: #F3F3F1">
              <span class="rt" style="font-size: 24px; font-weight: 500; letter-spacing: -0.025em">${esc(p.title)}</span>
              <span class="lcol">${esc(p.type)}</span>
              <span class="lcol">${esc(p.location)}</span>
              <span class="lcol" style="color: ${statusColor(p.status)}">${esc(p.status)}</span>
              <span class="lmeta">${[p.type, p.location].filter(Boolean).map((v) => esc(v) + ' · ').join('')}<span style="color: ${statusColor(p.status)}">${esc(p.status)}</span></span>
            </${tag}>`;
  };
  const card = (p, k) => {
    const href = projectHref(p), tag = href ? 'a' : 'div';
    return `          <${tag}${href ? ` href="${href}"` : ''} class="card" data-cat="${esc(p.category)}" data-status="${esc(p.status)}" style="display: flex; flex-direction: column; gap: 14px">
            <span style="display: block; overflow: hidden; background: #F3F3F1">
              <img ${img(coverFor(p), { widths: [640, 1000], sizes: '(max-width: 700px) 100vw, 33vw' })} loading="lazy" decoding="async" alt="${esc(altOf(coverFor(p), '') || p.title)}" style="width: 100%; aspect-ratio: 8 / 5; object-fit: cover; display: block">
            </span>
            <span style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px">
              <span class="rt" style="font-size: 22px; font-weight: 500; letter-spacing: -0.02em">${esc(p.title)}</span>
              <span style="font-size: 12px; letter-spacing: 0.12em; color: #6B6A67">${pad(k + 1, 3)}</span>
            </span>
            <span style="font-size: 14px; color: #6B6A67">${[p.type, p.location].filter(Boolean).map((v) => esc(v) + ' · ').join('')}<span style="color: ${statusColor(p.status)}">${esc(p.status)}</span></span>
          </${tag}>`;
  };

  const body = `
${header(site, { workCurrent: true })}

  <main style="max-width: 1440px; margin: 0 auto; box-sizing: border-box; padding: clamp(56px, 7cqw, 104px) clamp(16px, 4cqw, 56px) clamp(80px, 9cqw, 140px); display: flex; flex-direction: column; gap: 40px">

    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 32px">
      <div style="display: flex; flex-direction: column; gap: 20px">
        <div style="font-size: 13px; letter-spacing: 0.32em; color: #A5532F">Index · ${projects.length} projects</div>
        <h1 style="margin: 0; font-size: clamp(40px, 5.2cqw, 64px); font-weight: 500; letter-spacing: -0.04em; line-height: 0.94">Work</h1>
      </div>
      <p style="margin: 0; max-width: 46ch; font-size: 17px; line-height: 1.6; color: #3D3C3A">${rich(work.intro)}</p>
    </div>

    <div id="work-filters" class="wf">
      <div class="wtabs" role="group" aria-label="Filter by type">
        ${['All', ...cats].map((c, k) => `<button type="button" class="wtab${k ? '' : ' on'}" data-type="${esc(c)}" aria-pressed="${!k}">${esc(c)}</button>`).join('\n        ')}
      </div>
      <div class="wbar">
        <label class="wstatus"><select id="wstatus" aria-label="Filter by status">
          <option value="Any">Any status</option>
          ${statuses.map((st) => `<option value="${esc(st)}">${esc(st)}</option>`).join('\n          ')}
        </select></label>
        <div class="wseg" role="group" aria-label="View">
          <button type="button" class="on" data-view="list" aria-pressed="true">List</button>
          <button type="button" data-view="grid" aria-pressed="false">Grid</button>
          <button type="button" class="vault-btn" data-view="vault" aria-pressed="false"><svg class="vdial" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.6" fill="none"/><g><line x1="10" y1="1.6" x2="10" y2="3.6" transform="rotate(0 10 10)"/><line x1="10" y1="1.6" x2="10" y2="2.8" transform="rotate(30 10 10)"/><line x1="10" y1="1.6" x2="10" y2="2.8" transform="rotate(60 10 10)"/><line x1="10" y1="1.6" x2="10" y2="3.6" transform="rotate(90 10 10)"/><line x1="10" y1="1.6" x2="10" y2="2.8" transform="rotate(120 10 10)"/><line x1="10" y1="1.6" x2="10" y2="2.8" transform="rotate(150 10 10)"/><line x1="10" y1="1.6" x2="10" y2="3.6" transform="rotate(180 10 10)"/><line x1="10" y1="1.6" x2="10" y2="2.8" transform="rotate(210 10 10)"/><line x1="10" y1="1.6" x2="10" y2="2.8" transform="rotate(240 10 10)"/><line x1="10" y1="1.6" x2="10" y2="3.6" transform="rotate(270 10 10)"/><line x1="10" y1="1.6" x2="10" y2="2.8" transform="rotate(300 10 10)"/><line x1="10" y1="1.6" x2="10" y2="2.8" transform="rotate(330 10 10)"/></g><circle cx="10" cy="10" r="4.2" fill="none"/><line x1="10" y1="10" x2="10" y2="5.8" stroke-width="1.6"/><circle cx="10" cy="10" r="1.1" class="vdot"/></svg><span>Vault</span></button>
        </div>
      </div>
    </div>

    <div id="work-list" style="overflow-x: auto; margin-top: -40px">
      <div class="lwrap" style="min-width: 760px">
        <div class="lhead" style="${GRID}; padding: 20px 0 12px; border-bottom: 1px solid #E6E5E2; font-size: 12px; letter-spacing: 0.12em; color: #6B6A67">
          <span>No.</span><span></span><span>Project</span><span>Type</span><span>Location</span><span>Status</span>
        </div>
${projects.map(row).join('\n')}
      </div>
    </div>

    <div id="work-grid" class="cards" hidden>
${projects.map(card).join('\n')}
    </div>

    <section id="work-vault" class="vbox" hidden aria-label="Vault — all project photos">
      <div class="vhead">
        <label class="vsearch"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0E0E0E" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path></svg>
          <input id="vq" type="search" placeholder="Search photos — bedrooms, elevations, brick jaali, Indore…" autocomplete="off" aria-label="Search photos">
          <button type="button" id="vclear" hidden>Clear</button>
        </label>
        <div class="vchips" role="group" aria-label="Quick searches">${vault.chips.map((c) => `<button type="button" class="vchip" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div>
        <div class="vcount" id="vcount" aria-live="polite"></div>
      </div>
      <div class="vgwrap"><button type="button" class="vnav prev" aria-label="Scroll the photos left" disabled>←</button><button type="button" class="vnav next" aria-label="Scroll the photos right">→</button>
      <div class="vgrid" id="vgrid">
${vault.items.slice(0, 40).map((v) => `        <a class="vitem" href="${esc(v.f)}" data-i="${v.i}"><img src="${esc(v.s)}" width="${v.w}" height="${v.h}" loading="lazy" decoding="async" alt="${esc(v.a)}" onerror="this.onerror=null;this.src=${esc(JSON.stringify(v.raw))}"><span class="vcap">${esc(v.p)}</span></a>`).join('\n')}
      </div></div>
      <script type="application/json" id="vault-data">${JSON.stringify(vault.items).replace(/</g, '\\u003c')}</script>
    </section>

    <p id="work-empty" hidden style="margin: 0; font-size: 16px; color: #6B6A67">No projects match these filters.</p>
  </main>

${footer(site, { emblemHref: '/', emblemLabel: 'Bloc 11 — back to the home page', contactHref: '/#contact' })}`;

  const isVault = view === 'vault';
  return page({
    title: isVault ? `Vault — photos of our architecture and interiors — ${site.firm_name}` : `Work — ${site.firm_name}`,
    description: isVault ? `Browse and search ${vault.items.length} photos of homes, interiors, facades and spaces designed by ${site.firm_name} in Indore and Bengaluru.` : (work.intro || site.seo_description),
    path: isVault ? '/work/vault/' : '/work/',
    css: WORK_CSS,
    body: body.replace('<main ', `<main data-view="${isVault ? 'vault' : 'list'}" `),
    image: vault.items[0] ? vault.items[0].raw : undefined,
  });
}

// ---------- one project ----------
const PIC = 'object-fit: cover; display: block; background: #F3F3F1';

function block(b) {
  const one = (i, extra, sizes) => `<img ${img(i.image, { sizes })} loading="lazy" decoding="async" alt="${esc(altOf(i.image, i.alt))}" style="${extra}; ${PIC}">`;
  switch (b.type) {
    case 'full':
      return has(b.image) ? `    ${one(b, 'width: 100%; aspect-ratio: 16 / 9', '100vw')}` : '';
    case 'pair':
      return `    <div style="display: flex; flex-wrap: wrap; gap: 28px">
      ${(b.images || []).filter((i) => has(i.image)).map((i) => one(i, 'flex: 1 1 320px; min-width: 0; aspect-ratio: 4 / 5', '(max-width: 700px) 100vw, 50vw')).join('\n      ')}
    </div>`;
    case 'trio':
      return `    <div style="display: flex; flex-wrap: wrap; gap: 28px">
      ${(b.images || []).filter((i) => has(i.image)).map((i) => one(i, 'flex: 1 1 260px; min-width: 0; aspect-ratio: 3 / 4', '(max-width: 900px) 100vw, 33vw')).join('\n      ')}
    </div>`;
    case 'image_text':
      return `    <div style="display: flex; flex-wrap: wrap; gap: 28px 56px; align-items: flex-end; padding-top: clamp(24px, 4cqw, 64px)">
      ${has(b.image) ? one(b, 'flex: 2 1 560px; min-width: 0; aspect-ratio: 3 / 2', '(max-width: 900px) 100vw, 66vw') : ''}
      <p style="flex: 1 1 260px; margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: #3D3C3A; max-width: 60ch">${rich(b.text)}</p>
    </div>`;
    case 'text':
      return `    <div style="display: flex; flex-wrap: wrap; gap: 32px 72px; padding: clamp(24px, 4cqw, 56px) 0">
      <h2 style="flex: 1 1 220px; margin: 0; font-size: clamp(22px, 2cqw, 28px); line-height: 1.1; font-weight: 500; letter-spacing: -0.025em">${esc(b.heading || '')}</h2>
      <div style="flex: 3 1 560px; display: flex; flex-direction: column; gap: 16px; max-width: 40em">${paras(b.text).map((p) => `<p style="margin: 0; font-size: 17px; line-height: 1.6; color: #3D3C3A">${rich(p)}</p>`).join('')}</div>
    </div>`;
    default:
      return '';
  }
}

function projectLD(site, p) {
  const photos = (Array.isArray(p.photos) ? p.photos : []).filter((ph) => ph && ph.src && has(ph.src));
  const ld = {
    '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.title,
    url: `${SITE_URL}/work/${p.slug}/`, description: (p.about || '').split(/\n/)[0] || undefined,
    genre: 'Architecture', locationCreated: p.location ? { '@type': 'Place', name: p.location } : undefined,
    creator: { '@type': 'Organization', name: site.firm_name, url: SITE_URL },
    image: photos.map((ph) => ({ '@type': 'ImageObject', contentUrl: SITE_URL + ph.src, description: ph.alt, keywords: (ph.tags || []).join(', ') })),
  };
  return `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
}

// ---- covers: the list picture and the big picture on a project page must suit their wide frames ----
// A picture chosen in the admin is used when it is sharp enough and wide; otherwise the project's best
// photo is used: wide, at least 1000 px, an outside view first (except interiors projects), Drive order next.
const sizeOf = (src) => (has(src) ? imageSize(src) : [0, 0]);
const fits = (src) => { const [w, h] = sizeOf(src); return w >= 1000 && w >= h * 1.1; };
export function bestPhoto(p) {
  const photos = (Array.isArray(p.photos) ? p.photos : []).filter((ph) => ph && has(ph.src));
  const scored = photos.map((ph, k) => {
    const [w, h] = sizeOf(ph.src), tags = (ph.tags || []).join(' | ').toLowerCase();
    let s = 0;
    if (w >= h * 1.2) s += 100; else if (w >= h) s += 40;
    if (w >= 1600) s += 40; else if (w >= 1000) s += 20;
    if (p.category !== 'Interiors') {
      if (/\b(exterior|facade|elevation)\b/.test(tags)) s += 30;
      if (/\b(entrance|dusk|courtyard)\b/.test(tags)) s += 10;
      if (/\binterior\b/.test(tags)) s -= 10;
    }
    if (/\b(plan|section|model|sketch|detail)\b/.test(tags)) s -= 25;
    return { src: ph.src, s: s - k * 0.5 };
  }).sort((a, b) => b.s - a.s);
  return scored[0] ? scored[0].src : '';
}
export const coverFor = (p, key = 'thumbnail') =>
  (fits(p[key]) ? p[key] : fits(p.thumbnail) ? p.thumbnail : fits(p.hero_image) ? p.hero_image : bestPhoto(p) || (has(p[key]) ? p[key] : p.thumbnail));

// A project switched to "own page" without a layout gets one from its Drive photos:
// wide photos full width, upright photos side by side in twos and threes (as on Shantiniketan's page).
function autoBlocks(p, hero) {
  const list = (Array.isArray(p.photos) ? p.photos : []).filter((ph) => ph && ph.src && ph.src !== hero && has(ph.src) && sizeOf(ph.src)[0] >= 800)
    .map((ph) => { const [w, h] = imageSize(ph.src); return { image: ph.src, alt: ph.alt || '', tall: h > w * 1.05 }; });
  const out = [];
  for (let k = 0; k < list.length;) {
    if (!list[k].tall) { out.push({ type: 'full', image: list[k].image, alt: list[k].alt }); k++; continue; }
    let n = 0; while (k + n < list.length && list[k + n].tall && n < 3) n++;
    if (n === 1) {                                   // a single upright photo: pair it with the next one, if any
      if (k + 1 < list.length) { out.push({ type: 'pair', images: [list[k], list[k + 1]] }); k += 2; }
      else { out.push({ type: 'pair', images: [list[k]] }); k++; }
      continue;
    }
    out.push({ type: n === 3 ? 'trio' : 'pair', images: list.slice(k, k + n) }); k += n;
  }
  return out;
}

export function renderProject({ site, project: p, index, next, nextIndex }) {
  const hero = coverFor(p, 'hero_image');
  const blocks = (p.blocks || []).length ? p.blocks : autoBlocks(p, hero);
  const facts = [['Type', p.type], ['Location', p.location], ['Year', p.year], ['Status', p.status]].filter(([, v]) => v);
  const nextHref = next ? projectHref(next) || '/work/' : '/work/';
  const body = `
${header(site, { workCurrent: true })}

  <main style="max-width: 1440px; margin: 0 auto; box-sizing: border-box; padding: 0 clamp(16px, 4cqw, 56px); display: flex; flex-direction: column; gap: 28px">

    <div style="padding: clamp(56px, 7cqw, 104px) 0 24px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 32px; border-bottom: 1px solid #0E0E0E">
      <div style="display: flex; flex-direction: column; gap: 20px">
        <div style="font-size: 13px; letter-spacing: 0.32em; color: #A5532F"><a href="/work/" style="color: #A5532F">Work</a> / ${pad(index + 1, 3)}</div>
        <h1 style="margin: 0; font-size: clamp(40px, 5.2cqw, 64px); font-weight: 500; letter-spacing: -0.04em; line-height: 0.94">${esc(p.title)}</h1>
      </div>
      <dl class="facts" style="margin: 0; display: grid; grid-template-columns: repeat(${Math.max(1, facts.length)}, minmax(0, 1fr)); gap: 8px 40px; min-width: min(100%, ${facts.length * 130}px)">
        ${facts.map(([k, v]) => `<div><dt style="font-size: 12px; letter-spacing: 0.12em; color: #6B6A67; margin-bottom: 6px">${k}</dt><dd style="margin: 0; font-size: 15px">${esc(v)}</dd></div>`).join('\n        ')}
      </dl>
    </div>

    ${hero ? `<img ${img(hero)} alt="${esc(altOf(hero, p.hero_alt))}" fetchpriority="high" style="width: 100%; aspect-ratio: 16 / 9; ${PIC}">` : ''}

    ${p.about ? `<div style="display: flex; flex-wrap: wrap; gap: 32px 72px; padding: clamp(40px, 5cqw, 80px) 0">
      <h2 style="flex: 1 1 220px; margin: 0; font-size: clamp(26px, 2.4cqw, 32px); line-height: 1.05; font-weight: 500; letter-spacing: -0.03em">About the project</h2>
      <div style="flex: 3 1 560px; display: flex; flex-direction: column; gap: 18px; max-width: 34em">${paras(p.about).map((t) => `<p style="margin: 0; font-size: clamp(20px, 2cqw, 26px); line-height: 1.45; font-weight: 300; letter-spacing: -0.01em">${rich(t)}</p>`).join('')}</div>
    </div>` : ''}

${blocks.map(block).filter(Boolean).join('\n\n')}

    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 24px; padding: clamp(48px, 6cqw, 88px) 0; border-top: 1px solid #0E0E0E; margin-top: clamp(40px, 5cqw, 80px)">
      <a href="/work/" style="font-size: 15px; font-weight: 400; padding: 12px 0">← All work</a>
      ${next ? `<a href="${nextHref}" class="next" style="display: flex; align-items: center; gap: 24px">
        <span style="display: flex; flex-direction: column; gap: 8px; text-align: right">
          <span style="font-size: 12px; letter-spacing: 0.12em; color: #6B6A67">Next · ${pad(nextIndex + 1, 3)}</span>
          <span class="next-title" style="font-size: clamp(26px, 2.6cqw, 36px); font-weight: 500; letter-spacing: -0.03em">${esc(next.title)}</span>
        </span>
        <img ${img(coverFor(next), { widths: [320], sizes: '160px' })} loading="lazy" decoding="async" alt="" style="width: 160px; height: 120px; ${PIC}">
      </a>` : ''}
    </div>
  </main>

${footer(site, { emblemHref: '/', emblemLabel: 'Bloc 11 — back to the home page', contactHref: '/#contact' })}
  ${projectLD(site, p)}`;

  return page({
    title: `${p.title}${p.location ? ', ' + p.location : ''} — ${site.firm_name}`,
    description: (p.about || '').split(/\n/)[0] || site.seo_description,
    path: `/work/${p.slug}/`,
    css: PROJECT_CSS,
    body,
    image: hero || undefined,
  });
}
