// Home page
import { esc, rich, pad, cdn, img, srcset, ver, page, mount, mnav, capabilities, contact, footer, SITE_URL, MNAV_CSS, CAPS_CSS, CONTACT_CSS } from './lib.mjs';

const KINDS = ['question', 'decode', 'experiment', 'refine', 'realise'];
const ACCENTS = ['#7F7061', '#5D5C4C', '#B9693F', '#34475B', '#8A6D26'];
const STRIP = '0123456789'.repeat(2).split('');

const CSS = `
body{margin:0;background:#ffffff}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
a{color:#141414;text-decoration:none}a:hover{color:#A5532F}
.hero-link{color:#ffffff}.hero-link:hover{color:#F3D9C9}
.hero-img{transition:opacity .6s ease}
.ctl:hover{background:rgba(255,255,255,0.18)}
.ctl:focus-visible,a:focus-visible{outline:2px solid #A5532F;outline-offset:3px}
.proc{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))}
.proc>li+li{border-left:1px solid #E2DED7}
@container page (max-width: 960px){.proc{grid-template-columns:repeat(2,minmax(0,1fr))}.proc>li+li{border-left:0}}
@container page (max-width: 560px){.proc{grid-template-columns:1fr}}
/* process: hovering a step plays its animation and opens its text */
.pstep{box-shadow:inset 0 2px 0 transparent;transition:box-shadow .24s ease}
@media (hover: hover){.pstep:hover,.pstep:focus-visible{box-shadow:inset 0 2px 0 #A5532F}.pstep:hover .cap-no,.pstep:focus-visible .cap-no{color:#141414}}
.pstep.is-hot .cap-desc{grid-template-rows:1fr;opacity:1;transform:none}
${ACCENTS.map((c, k) => `.pstep[data-step="${k + 1}"].is-hot{box-shadow:inset 0 2px 0 ${c}}.pstep[data-step="${k + 1}"].is-hot .cap-title{color:${c}}`).join('\n')}
@media (hover: hover){
${ACCENTS.map((c, k) => `.pstep[data-step="${k + 1}"]:hover,.pstep[data-step="${k + 1}"]:focus-visible{box-shadow:inset 0 2px 0 ${c}}.pstep[data-step="${k + 1}"]:hover .cap-title,.pstep[data-step="${k + 1}"]:focus-visible .cap-title{color:${c}}`).join('\n')}
}
.ppanel{display:none !important}
${CAPS_CSS}
@media (hover: none){.pstep .cap-desc{grid-template-rows:1fr;opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.cap .cap-desc,.pstep{transition:none!important}}
${CONTACT_CSS}
/* section headers: heading on the left, its text starting on the same line for every section */
.shead{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:24px 72px;align-items:start}
.shead>h2{margin:0}.shead>p{margin:0;max-width:34em}
@container page (max-width: 760px){.shead{grid-template-columns:minmax(0,1fr)}}
/* ---- phones ---- */
@container page (max-width: 560px){
.hero{height:640px !important}
#hero-bars{display:none !important}
.statcap{font-size:12px !important;letter-spacing:0 !important}
/* process: the five steps play in one place like a short film */
.pwrap{gap:0 !important}
.pbars{order:-1}
.proc{--reel:1;display:grid !important;grid-template-columns:minmax(0,1fr) !important;border-top:0 !important;cursor:pointer}
.pstep{grid-area:1 / 1;display:flex !important;flex-direction:column !important;align-items:stretch !important;gap:6px !important;padding:18px 0 0 !important;box-shadow:none !important;opacity:0;visibility:hidden;transition:opacity .4s ease,visibility 0s linear .4s}
.pstep.is-live{opacity:1;visibility:visible;transition:opacity .5s ease .1s,visibility 0s}
.pstep .psym{align-self:center;margin-bottom:14px}
.pstep .cap-no{margin-top:0 !important}
.pstep .cap-title{font-size:26px !important}
.pstep .cap-desc{grid-template-rows:1fr;opacity:1;transform:none}
.pstep .cap-desc p{font-size:16px !important}
}
${MNAV_CSS}
`;

const H2 = 'font-size: clamp(30px, 3cqw, 44px); line-height: 1; font-weight: 500; letter-spacing: -0.035em';
const LEAD = 'font-size: clamp(22px, 2.2cqw, 30px); line-height: 1.35; font-weight: 300; letter-spacing: -0.01em';
const SEC = 'max-width: 1440px; margin: 0 auto; box-sizing: border-box';

export function renderHome({ site, home, projects }) {
  const slides = (home.slides || []).filter((s) => s.image);
  const s0 = slides[0] || { image: '', alt: '', caption: '', focus: 50 };
  const feat = projects.find((p) => p.slug === home.featured_project);
  const featHref = feat ? (feat.has_page ? `/work/${feat.slug}/` : '/work/') : '/work/';
  const featText = feat ? `${feat.title}${feat.location ? ', ' + feat.location : ''} →` : 'See our work →';
  // each slide comes in several widths, so a phone downloads a phone-sized picture
  const HERO_W = [800, 1200, 1600, 2000, 2400, 2800, 3200];
  const HERO_M = [600, 900, 1200, 1600, 2000, 2400];
  // a slide captioned "Project — view" links to that project and shows "Type — view" above the link
  const byTitle = new Map(projects.map((p) => [p.title.trim().toLowerCase(), p]));
  const slideInfo = (sl) => {
    const cap = String(sl.caption || '');
    const [head, ...rest] = cap.split(/\s+[—–-]\s+/);
    const p = (sl.project && projects.find((x) => x.slug === sl.project)) || byTitle.get(String(head || '').trim().toLowerCase());
    if (!p) return { kicker: cap, href: '/work/', label: 'See our work →' };
    const view = rest.join(' — ');
    return { kicker: [p.type, view].filter(Boolean).join(' — ') || cap, href: p.has_page ? `/work/${p.slug}/` : '/work/', label: `${p.title} →` };
  };
  const heroData = slides.map((s) => ({ src: cdn(s.image, 2400), set: srcset(s.image, HERO_W), raw: ver(s.image), alt: s.alt || '', caption: slideInfo(s).kicker, href: slideInfo(s).href, label: slideInfo(s).label, pos: `center ${Number(s.focus ?? 50)}%` }));
  // phones: their own upright pictures from the "Homepage slideshow — mobile" folder, when there are any
  const mslides = (home.slides_mobile || []).filter((s) => s.image);
  const heroM = mslides.map((s) => ({ src: cdn(s.image, 1600), set: srcset(s.image, HERO_M), raw: ver(s.image), alt: s.alt || '', caption: slideInfo(s).kicker, href: slideInfo(s).href, label: slideInfo(s).label, pos: `center ${Number(s.focus ?? 50)}%` }));
  const i0 = heroData[0] || { caption: s0.caption, href: featHref, label: featText };
  const steps = (home.steps || []).slice(0, 5);

  const stats = (home.stats || []).map((st, si) => {
    const v = String(st.value || '').replace(/[^0-9]/g, '') || '0';
    return `        <div style="display: flex; flex-direction: column; gap: 10px">
          <span style="font-size: clamp(34px, 5cqw, 72px); font-weight: 500; letter-spacing: -0.045em; line-height: 1; display: inline-flex; position: relative">
            <span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap">${esc(v)}+</span>
${v.split('').map((ch, di) => `            <span aria-hidden="true" style="display: inline-block; height: 1em; overflow: hidden"><span class="dnudge" style="display: block"><span class="droll" data-d="${ch}" data-i="${di}" data-s="${si}" style="display: block; transform: translateY(-${10 + Number(ch)}em)">${STRIP.map((n) => `<span style="display: block; height: 1em">${n}</span>`).join('')}</span></span></span>`).join('\n')}
            <span aria-hidden="true">+</span>
          </span>
          <span class="statcap" style="font-size: 15px; letter-spacing: 0.02em; line-height: 1.45; color: #6B6760; max-width: 15em">${esc(st.caption)}</span>
        </div>`;
  }).join('\n');

  const body = `
  <!-- HERO -->
  <section id="top" class="hero" style="position: relative; height: 860px; overflow: hidden; background: #2a2622">
    <picture style="position: absolute; inset: 0; display: block">${heroM[0] ? `<source id="hero-src-m" media="(max-width: 560px)" srcset="${esc(heroM[0].set)}" sizes="130vw">` : ''}<img id="hero-img" class="hero-img" src="${esc(heroData[0]?.src || '')}"${heroData[0]?.set ? ` srcset="${esc(heroData[0].set)}" sizes="max(100vw, 1530px)"` : ''} onerror="this.onerror=null;this.removeAttribute('srcset');this.src=${esc(JSON.stringify(heroData[0]?.raw || ''))}" alt="${esc(s0.alt)}" fetchpriority="high" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center ${Number(s0.focus ?? 50)}%"></picture>
    <div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 0; height: 180px; background: linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0))"></div>
    <div aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 0; height: 380px; background: linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.5))"></div>

    <header style="position: absolute; top: 0; left: 0; right: 0; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 24px; padding: 32px clamp(20px, 4cqw, 56px)">
      <a href="/" class="hero-link" aria-label="${esc(site.firm_name)} — home" style="display: block; line-height: 0">
        <img src="/images/logo-white.png" alt="${esc(site.firm_name)}" style="height: 46px; width: auto">
      </a>
      <nav class="mainnav" aria-label="Main" style="display: flex; gap: 36px; font-size: 13px; font-weight: 600; letter-spacing: 0.2em">
        <a href="/work/" class="hero-link" style="padding: 12px 0">Work</a>
        <a href="/studio/" class="hero-link" style="padding: 12px 0">Studio</a>
        <a href="#contact" class="hero-link" style="padding: 12px 0">Contact</a>
      </nav>
      ${mnav([['/work/', 'Work'], ['/studio/', 'Studio'], ['#contact', 'Contact']], '#ffffff')}
    </header>

    <div style="position: absolute; left: 0; right: 0; bottom: 0; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 24px; padding: 0 clamp(20px, 4cqw, 56px) 40px; color: #ffffff">
      <div style="display: flex; flex-direction: column; gap: 10px; min-width: 0">
        <h1 style="margin: 0 0 clamp(16px, 2.4cqw, 28px); max-width: 15em; font-size: clamp(28px, 3.4cqw, 48px); line-height: 1.08; font-weight: 500; letter-spacing: -0.03em">${esc(home.hero_title)}</h1>
        <div id="hero-kicker" style="font-size: 13px; letter-spacing: 0.32em; opacity: 0.9">${esc(i0.caption)}</div>
        <a id="hero-feat" href="${esc(i0.href)}" class="hero-link" style="font-size: 20px; font-weight: 500; letter-spacing: -0.02em">${esc(i0.label)}</a>
      </div>
      ${slides.length > 1 ? `<div style="display: flex; align-items: center; gap: 20px">
        <div id="hero-bars" style="display: flex; gap: 6px" aria-hidden="true">
          ${slides.map((s, k) => `<span style="display: block; width: ${slides.length > 8 ? 12 : 28}px; height: 2px; background: #ffffff; opacity: ${k === 0 ? 1 : 0.35}"></span>`).join('')}
        </div>
        <div id="hero-count" style="font-size: 12px; letter-spacing: 0.12em; min-width: 56px; text-align: center">01 / ${pad(slides.length, 2)}</div>
        <div style="display: flex; gap: 8px">
          <button type="button" class="ctl" data-hero="-1" aria-label="Previous image" style="width: 44px; height: 44px; border: 1px solid rgba(255,255,255,0.7); background: transparent; color: #ffffff; border-radius: 0; cursor: pointer; display: flex; align-items: center; justify-content: center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>
          </button>
          <button type="button" class="ctl" data-hero="1" aria-label="Next image" style="width: 44px; height: 44px; border: 1px solid rgba(255,255,255,0.7); background: transparent; color: #ffffff; border-radius: 0; cursor: pointer; display: flex; align-items: center; justify-content: center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>` : ''}
    </div>
    <script type="application/json" id="hero-data">${JSON.stringify(heroData).replace(/</g, '\\u003c')}</script>
    ${heroM.length ? `<script type="application/json" id="hero-data-m">${JSON.stringify(heroM).replace(/</g, '\\u003c')}</script>` : ''}
  </section>

  <!-- PRACTICE -->
  <section style="padding: clamp(80px, 9cqw, 140px) clamp(20px, 4cqw, 56px); ${SEC}; display: flex; flex-direction: column; gap: clamp(64px, 7cqw, 112px)">
    <div class="shead" style="border-top: 1px solid #141414; padding-top: 24px">
      <h2 style="${H2}">Practice</h2>
      <p style="${LEAD}">${rich(home.practice_text)}</p>
    </div>
    <div id="stats" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(14px, 2.4cqw, 32px); border-top: 1px solid #141414; padding-top: 28px">
${stats}
    </div>
  </section>

  <!-- PROCESS -->
  <section style="padding: 0 clamp(20px, 4cqw, 56px); ${SEC}; display: flex; flex-direction: column; gap: 56px">
    <div class="shead">
      <h2 style="${H2}">Process</h2>
      <p style="${LEAD}">${rich(home.process_text)}</p>
    </div>
    ${mount('FilmLoop', { src: '/media/process-film.mp4', poster: cdn('/images/process-film-poster.jpg', 1600), label: 'A short film of the bloc 11 process: question, decode, experiment, refine and realise, from sketchbook to the built brick jaali wall' },
      `<div style="width: 100%; aspect-ratio: 16 / 9; background: #ffffff"><img src="/images/process-film-poster.jpg" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block"></div>`)}
    <div class="pwrap" style="display: flex; flex-direction: column; gap: 8px">
      <ol class="proc" style="list-style: none; margin: 0; padding: 0; border-top: 1px solid #141414">
${steps.map((s, k) => `        <li class="cap pstep" data-ps-hover="1" data-step="${k + 1}" tabindex="0" style="padding: 28px 20px 40px; display: flex; flex-direction: column; gap: 14px">
          ${mount('ProcessSymbol', { kind: KINDS[k], playing: false }, '<div class="psym" style="width: 140px; height: 140px"></div>')}
          <span class="cap-no" style="font-size: 12px; letter-spacing: 0.12em; color: #6B6760; margin-top: 8px">${pad(k + 1, 2)}</span>
          <span class="cap-title" style="font-size: 24px; font-weight: 500; letter-spacing: -0.025em">${esc(s.title)}</span>
          <div class="cap-desc"><div style="overflow: hidden"><p style="margin: 0; font-size: 15px; line-height: 1.55; color: #3A3733">${rich(s.text)}</p></div></div>
        </li>`).join('\n')}
      </ol>
      ${mount('ProcessPanel', { panels: steps.map((s, k) => ({ accent: ACCENTS[k], title: s.title, no: pad(k + 1, 2) })) })}
    </div>
  </section>

  <!-- CAPABILITIES -->
  <section style="padding: clamp(80px, 9cqw, 140px) clamp(20px, 4cqw, 56px) 0; ${SEC}">
    <div style="display: flex; flex-direction: column; gap: 28px">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 16px">
        <h2 style="margin: 0; ${H2}">${esc(home.capabilities_heading || 'Our capabilities')}</h2>
        <a href="/studio/" style="font-size: 15px; font-weight: 400; display: inline-flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid #141414">About the studio
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
        </a>
      </div>
      ${capabilities(site.capabilities || [])}
    </div>
  </section>

  <!-- CONTACT -->
  <section id="contact" style="padding: clamp(80px, 9cqw, 140px) clamp(20px, 4cqw, 56px); ${SEC}; display: flex; flex-direction: column; gap: 40px">
${contact(site, `<div class="shead">
      <h2 style="${H2}">Contact</h2>
      <p style="${LEAD}">${rich(site.contact_text)}</p>
    </div>`)}
  </section>

${footer(site, { emblemHref: '#top', emblemLabel: 'Bloc 11 — back to the top', contactHref: '#contact' })}
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ProfessionalService', name: site.firm_name, url: SITE_URL,
    logo: SITE_URL + '/images/logo-dark.png', image: SITE_URL + (s0.image || '/images/logo-dark.png'),
    email: site.email, description: site.seo_description, knowsAbout: (site.capabilities || []).map((c) => c.title),
    address: (site.offices || []).map((o) => ({ '@type': 'PostalAddress', streetAddress: o.address_line_1, addressLocality: o.city, addressRegion: (o.address_line_2 || '').replace(o.city, '').replace(/[0-9]/g, '').replace(/,/g, ' ').trim(), postalCode: ((o.address_line_2 || '').match(/[0-9]{6}/) || [''])[0], addressCountry: 'IN' })),
  }).replace(/</g, '\\u003c')}</script>`;

  return page({
    title: `${site.firm_name} — Indore & Bengaluru`,
    description: site.seo_description,
    path: '/',
    css: CSS,
    body,
    image: s0.image || undefined,
    ticker: true,
  });
}
