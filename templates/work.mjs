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
.vbox{position:relative;height:min(86vh,1000px);overflow:auto;overscroll-behavior:contain;border:1px solid #E6E5E2;background:#FFFFFF;margin-top:-16px}
.vhead{position:sticky;top:0;z-index:3;background:rgba(255,255,255,.94);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);padding:16px 16px 12px;border-bottom:1px solid #EEEDEA;display:flex;flex-direction:column;gap:12px}
.vsearch{display:flex;align-items:center;gap:12px;border:1px solid #0E0E0E;border-radius:999px;padding:0 8px 0 18px;min-height:48px;background:#FFFFFF}
.vsearch input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:400 16px/1.4 'Jost',system-ui,sans-serif;color:#0E0E0E}
.vsearch input::placeholder{color:#8A8680}
.vsearch input::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none;display:none}
.vsearch button{border:0;background:transparent;font:inherit;font-size:13px;color:#6B6A67;cursor:pointer;padding:8px 10px}
.vchips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.vchips::-webkit-scrollbar{display:none}
.vchip{flex:0 0 auto;border:1px solid #D6D2CB;border-radius:999px;background:#FFFFFF;padding:7px 14px;font:400 13px 'Jost',sans-serif;letter-spacing:.03em;color:#0E0E0E;cursor:pointer}
.vchip:hover{border-color:#0E0E0E}.vchip.on{background:#0E0E0E;color:#FFFFFF;border-color:#0E0E0E}
.vcount{font-size:12px;letter-spacing:.12em;color:#6B6A67}
.vgrid{column-width:260px;column-gap:10px;padding:12px}
@container page (max-width: 640px){.vgrid{column-width:150px;column-gap:6px;padding:6px}.vbox{height:80vh}}
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
      i, s: cdn(ph.src, 800), f: cdn(ph.src, 2000), raw: ph.src, w, h,
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
              <img ${img(p.thumbnail, { widths: [320, 640], sizes: '160px' })} loading="lazy" decoding="async" alt="" style="width: 160px; height: 120px; object-fit: cover; display: block; background: #F3F3F1">
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
              <img ${img(p.thumbnail, { widths: [640, 1000], sizes: '(max-width: 700px) 100vw, 33vw' })} loading="lazy" decoding="async" alt="${esc(altOf(p.thumbnail, '') || p.title)}" style="width: 100%; aspect-ratio: 8 / 5; object-fit: cover; display: block">
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

    <div id="work-filters" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; padding-bottom: 20px; border-bottom: 1px solid #0E0E0E">
      <div role="group" aria-label="Filter by type" style="display: flex; flex-wrap: wrap; gap: 8px">
        ${[btn('data-type', 'All', 'All', true), ...cats.map((c) => btn('data-type', c, c, false))].join('\n        ')}
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px 24px">
        <div role="group" aria-label="Filter by status" style="display: flex; flex-wrap: wrap; gap: 8px">
          ${[btn('data-status', 'Any', 'Any status', true), ...statuses.map((s) => btn('data-status', s, s, false))].join('\n          ')}
        </div>
        <div role="group" aria-label="View" style="display: flex; gap: 8px">
          ${btn('data-view', 'list', 'List', true)}
          ${btn('data-view', 'grid', 'Grid', false)}
          ${btn('data-view', 'vault', 'Vault', false)}
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
      <div class="vgrid" id="vgrid">
${vault.items.slice(0, 40).map((v) => `        <a class="vitem" href="${esc(v.f)}" data-i="${v.i}"><img src="${esc(v.s)}" width="${v.w}" height="${v.h}" loading="lazy" decoding="async" alt="${esc(v.a)}" onerror="this.onerror=null;this.src=${esc(JSON.stringify(v.raw))}"><span class="vcap">${esc(v.p)}</span></a>`).join('\n')}
      </div>
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

export function renderProject({ site, project: p, index, next, nextIndex }) {
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

    ${has(p.hero_image) ? `<img ${img(p.hero_image)} alt="${esc(altOf(p.hero_image, p.hero_alt))}" fetchpriority="high" style="width: 100%; aspect-ratio: 16 / 9; ${PIC}">` : ''}

    ${p.about ? `<div style="display: flex; flex-wrap: wrap; gap: 32px 72px; padding: clamp(40px, 5cqw, 80px) 0">
      <h2 style="flex: 1 1 220px; margin: 0; font-size: clamp(26px, 2.4cqw, 32px); line-height: 1.05; font-weight: 500; letter-spacing: -0.03em">About the project</h2>
      <div style="flex: 3 1 560px; display: flex; flex-direction: column; gap: 18px; max-width: 34em">${paras(p.about).map((t) => `<p style="margin: 0; font-size: clamp(20px, 2cqw, 26px); line-height: 1.45; font-weight: 300; letter-spacing: -0.01em">${rich(t)}</p>`).join('')}</div>
    </div>` : ''}

${(p.blocks || []).map(block).filter(Boolean).join('\n\n')}

    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 24px; padding: clamp(48px, 6cqw, 88px) 0; border-top: 1px solid #0E0E0E; margin-top: clamp(40px, 5cqw, 80px)">
      <a href="/work/" style="font-size: 15px; font-weight: 400; padding: 12px 0">← All work</a>
      ${next ? `<a href="${nextHref}" class="next" style="display: flex; align-items: center; gap: 24px">
        <span style="display: flex; flex-direction: column; gap: 8px; text-align: right">
          <span style="font-size: 12px; letter-spacing: 0.12em; color: #6B6A67">Next · ${pad(nextIndex + 1, 3)}</span>
          <span class="next-title" style="font-size: clamp(26px, 2.6cqw, 36px); font-weight: 500; letter-spacing: -0.03em">${esc(next.title)}</span>
        </span>
        <img ${img(next.thumbnail, { widths: [320], sizes: '160px' })} loading="lazy" decoding="async" alt="" style="width: 160px; height: 120px; ${PIC}">
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
    image: p.hero_image || p.thumbnail || undefined,
  });
}
