// Shared helpers and pieces used by every page.

import fs from 'node:fs';
import crypto from 'node:crypto';

export const SITE_URL = 'https://bloc11.studio';

// a short fingerprint of each script, added to its address, so browsers fetch a fresh copy
// whenever the file changes instead of reusing an old saved one
const stamp = (f) => {
  try { return crypto.createHash('md5').update(fs.readFileSync(new URL('../static/assets/' + f, import.meta.url))).digest('hex').slice(0, 8); }
  catch (e) { return String(Date.now()); }
};
const V_SITE = stamp('site.js'), V_APP = stamp('app.js');

// true when a picture can actually be shown (a photo removed from Drive simply drops out of the page)
const STATIC = new URL('../static/', import.meta.url);
export const has = (src) => !!src && (!src.startsWith('/') || fs.existsSync(new URL('.' + src.split('?')[0], STATIC)));
const ON_NETLIFY = process.env.NETLIFY === 'true';

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// plain text from the admin page: **words** become semi-bold, line breaks are kept
export const rich = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<span style="font-weight: 500">$1</span>')
  .replace(/\n/g, '<br>');

// split on blank lines into paragraphs
export const paras = (s) => String(s ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export const pad = (n, w) => String(n).padStart(w, '0');

export const json = (o) => esc(JSON.stringify(o));

// Images go through Netlify's image service once the site is live there: it resizes them and
// sends modern formats, so a large photo uploaded from the admin page still loads quickly.
// If the service ever fails the picture falls back to the original file.
export function cdn(src, w) {
  if (!src || !ON_NETLIFY || !src.startsWith('/') || /\.(svg|gif|png)$/i.test(src)) return src;
  return `/.netlify/images?url=${encodeURIComponent(src)}&w=${w}`;
}
export function img(src, { widths = [800, 1600, 2400], sizes = '100vw' } = {}) {
  if (!has(src)) return 'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"';
  if (!ON_NETLIFY || !src.startsWith('/') || /\.(svg|gif|png)$/i.test(src)) return `src="${esc(src)}"`;
  const set = widths.map((w) => `${cdn(src, w)} ${w}w`).join(', ');
  return `src="${esc(cdn(src, widths[widths.length - 1]))}" srcset="${esc(set)}" sizes="${esc(sizes)}" data-raw="${esc(src)}" onerror="this.onerror=null;this.removeAttribute('srcset');this.src=this.dataset.raw"`;
}

// ---------- shared CSS ----------
export const MNAV_CSS = `
/* phones: Work / Studio / Contact fold into a three-line menu */
.mnav{display:none;position:relative}
.mnav>summary{list-style:none;width:44px;height:44px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:6px;cursor:pointer}
.mnav>summary::-webkit-details-marker{display:none}
.mnav>summary span{display:block;width:26px;height:2px;background:currentColor;transition:transform .25s ease,opacity .2s ease}
.mnav[open]>summary span:nth-child(1){transform:translateY(8px) rotate(45deg)}
.mnav[open]>summary span:nth-child(2){opacity:0}
.mnav[open]>summary span:nth-child(3){transform:translateY(-8px) rotate(-45deg)}
.mnav-list{position:absolute;right:0;top:calc(100% + 8px);z-index:30;min-width:220px;background:#FFFFFF;box-shadow:0 10px 36px rgba(0,0,0,0.16);display:flex;flex-direction:column;padding:6px 22px}
.mnav-list a{color:#141414 !important;font-size:15px;font-weight:600;letter-spacing:0.2em;padding:16px 0;border-bottom:1px solid #E2DED7;text-decoration:none !important}
.mnav-list a:last-child{border-bottom:0}
.mnav-list a:hover{color:#A5532F !important}
@container page (max-width: 640px){.mainnav{display:none !important}.mnav{display:block}}
`;

export const CAPS_CSS = `
/* capabilities: description slides open on hover (an arrow opens it on touch screens) */
.cap{cursor:default}
.cap:focus-visible{outline:2px solid #A5532F;outline-offset:4px}
.cap .cap-desc{display:grid;grid-template-rows:0fr;opacity:0;transform:translateY(-4px);transition:grid-template-rows .24s cubic-bezier(.2,.8,.2,1),opacity .2s ease,transform .24s cubic-bezier(.2,.8,.2,1)}
@media (hover: hover){.cap:hover .cap-desc{grid-template-rows:1fr;opacity:1;transform:none}}
.cap:focus-visible .cap-desc{grid-template-rows:1fr;opacity:1;transform:none}
.cap .cap-title,.cap .cap-no{transition:color .18s ease}
@media (hover: hover){.cap:hover .cap-title,.cap:hover .cap-no{color:#A5532F}}
.cap:focus-visible .cap-title,.cap:focus-visible .cap-no,.capt:checked~.caprow .cap-title{color:#A5532F}
.capt{position:absolute;width:1px;height:1px;margin:0;opacity:0;pointer-events:none}
.caprow{display:flex;justify-content:space-between;align-items:center;gap:16px;cursor:pointer}
.capt:checked~.cap-desc{grid-template-rows:1fr;opacity:1;transform:none}
.capt:focus-visible~.caprow{outline:2px solid #A5532F;outline-offset:4px}
.capchev{display:none;flex:0 0 auto;transition:transform .25s ease}
.capt:checked~.caprow .capchev{transform:rotate(180deg)}
@media (hover: none){.capchev{display:block}}
@container page (max-width: 560px){.capchev{display:block}}
`;

export const CONTACT_CSS = `
/* contact: the map follows the city you point at (Indore by default) */
.crow{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:32px 56px;align-items:stretch}
.cmapbox{position:relative;overflow:hidden;background:#F1EEE8;container-type:size;min-height:240px}
.mlayer{position:absolute;left:0;width:100%}
@container page (max-width: 900px){.crow{grid-template-columns:1fr}.cmapbox{aspect-ratio:4/3;min-height:0}}
.city{cursor:default;transition:border-color .2s ease}
.city:hover,.city:focus-within{border-top-color:#A5532F !important}
.cmap{opacity:0;transition:opacity .35s ease;pointer-events:none}
.cmap.on{opacity:1;pointer-events:auto}
.cwrap:has(.city:hover) .cmap,.cwrap:has(.city:focus-within) .cmap{opacity:0;pointer-events:none}
.cwrap:has(.city[data-city="0"]:hover) .cmap[data-city="0"],.cwrap:has(.city[data-city="0"]:focus-within) .cmap[data-city="0"],.cwrap:has(.city[data-city="1"]:hover) .cmap[data-city="1"],.cwrap:has(.city[data-city="1"]:focus-within) .cmap[data-city="1"]{opacity:1;pointer-events:auto}
@container page (max-width: 560px){.mlabel{left:50% !important;transform:translate(-50%,48px)}}
`;

const PAGE_STYLE = "container-type: inline-size; container-name: page; font-family: 'Jost', system-ui, sans-serif; font-weight: 300; color: #141414; background: #ffffff; width: 100%; -webkit-font-smoothing: antialiased";

// ---------- page shell ----------
export function page({ title, description, path, css, body, image = '/images/shantiniketan-dusk.jpg', ticker = false }) {
  const url = SITE_URL + path;
  const fonts = 'family=Jost:wght@300;400;500;600' + (ticker ? '&family=Silkscreen&family=DotGothic16' : '') + '&display=swap';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(SITE_URL + image)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png"><link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts}">
<style>
${css}
</style>
</head>
<body>
<div class="page" style="${PAGE_STYLE}">
${body}
</div>
<script src="/assets/site.js?v=${V_SITE}" defer></script>
<script src="/assets/app.js?v=${V_APP}" defer></script>
</body>
</html>
`;
}

// a spot on the page that the interactive script fills in (placeholder keeps the space meanwhile)
export const mount = (name, props, placeholder = '') =>
  `<div data-c="${name}" data-props="${json(props)}" style="display: contents">${placeholder}</div>`;

// ---------- pieces ----------
export function mnav(links, color) {
  return `<details class="mnav" style="color: ${color}">
        <summary aria-label="Menu"><span></span><span></span><span></span></summary>
        <nav class="mnav-list" aria-label="Menu">
          ${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n          ')}
        </nav>
      </details>`;
}

export function capabilities(caps) {
  const chev = '<svg class="capchev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>';
  return `<ol style="list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); column-gap: 32px; border-top: 1px solid #141414">
${caps.map((c, k) => `        <li class="cap" style="position: relative; padding: 20px 0; border-bottom: 1px solid #E2DED7">
          <input type="checkbox" class="capt" id="cap-${k + 1}" aria-label="Show more: ${esc(c.title)}">
          <label for="cap-${k + 1}" class="caprow"><span style="display: flex; gap: 16px; align-items: baseline"><span class="cap-no" style="font-size: 12px; letter-spacing: 0.12em; color: #6B6760">${pad(k + 1, 2)}</span><span class="cap-title" style="font-size: 20px; font-weight: 500; letter-spacing: -0.015em">${esc(c.title)}</span></span>${chev}</label>
          <div class="cap-desc"><div style="overflow: hidden"><p style="margin: 0; padding: 10px 0 0 36px; font-size: 15px; line-height: 1.55; color: #3A3733">${rich(c.text)}</p></div></div>
        </li>`).join('\n')}
      </ol>`;
}

// the two maps stay as designed; only the words around them come from the admin page
const MAPS = [
  { src: '/images/map-indore.jpg', ratio: [1360, 1043], pin: 38.17, alt: 'Map of Vijay Nagar, Indore, with the Bloc 11 studio marked' },
  { src: '/images/map-bengaluru.jpg', ratio: [1360, 1040], pin: 57.08, alt: 'Map of Halasuru and Indiranagar, Bengaluru, with the Bloc 11 Studioworks studio marked' },
];

export function contact(site, heading) {
  const offices = site.offices || [];
  const ph = site.studio_photos || {};
  const photos = { leftSrc: cdn(ph.indore, 2000), rightSrc: cdn(ph.bengaluru, 2000), leftLabel: offices[0]?.city || 'Indore', rightLabel: offices[1]?.city || 'Bengaluru', leftAlt: ph.indore_alt || '', rightAlt: ph.bengaluru_alt || '', aspect: '16 / 7' };
  const city = (o, k) => `          <div class="city" data-city="${k}" tabindex="0" style="padding: 20px 0 4px; border-top: 1px solid #E2DED7; display: flex; flex-direction: column; gap: 10px">
            <span style="font-size: 22px; font-weight: 500; letter-spacing: -0.02em">${esc(o.city)}</span>
            <span style="font-size: 16px; line-height: 1.55; color: #3A3733">${esc(o.address_line_1)}<br>${esc(o.address_line_2)}</span>
            <a href="${esc(o.maps_link)}" style="font-size: 14px; font-weight: 400; padding: 10px 0; align-self: flex-start; border-bottom: 1px solid #141414; text-decoration: none">Directions ↗</a>
          </div>`;
  const map = (o, k) => {
    const m = MAPS[k]; if (!m) return '';
    const [w, h] = m.ratio, f = (m.pin / 100).toFixed(4);
    return `        <figure class="cmap${k === 0 ? ' on' : ''}" data-city="${k}" style="position: absolute; inset: 0; margin: 0">
          <div class="mlayer" style="aspect-ratio: ${w} / ${h}; top: clamp(calc(100cqh - 100cqw * ${h} / ${w}), calc(50cqh - 100cqw * ${h} / ${w} * ${f}), 0px)">
            <img src="${m.src}" loading="lazy" decoding="async" alt="${esc(m.alt)}" style="position: absolute; inset: 0; width: 100%; height: 100%; display: block">
            <svg width="30" height="40" viewBox="0 0 34 44" aria-hidden="true" style="position: absolute; left: calc(50% - 15px); top: calc(${m.pin}% - 40px)"><path d="M17 1C8.2 1 1 8 1 16.8 1 28.5 17 43 17 43s16-14.5 16-26.2C33 8 25.8 1 17 1z" fill="#A5532F"></path><circle cx="17" cy="16.5" r="6" fill="#ffffff"></circle></svg>
            <span class="mlabel" style="position: absolute; left: calc(50% + 20px); top: calc(${m.pin}% - 38px); padding: 6px 12px; background: #ffffff; font-size: 14px; font-weight: 500; white-space: nowrap; box-shadow: 0 1px 4px rgba(0,0,0,0.12)">${esc(o.map_label)}</span>
          </div>
          <a href="${esc(o.maps_link)}" style="position: absolute; left: 14px; bottom: 14px; padding: 10px 14px; background: #ffffff; font-size: 14px; font-weight: 400; text-decoration: none">Open in Google Maps ↗</a>
          <span style="position: absolute; right: 8px; bottom: 6px; font-size: 11px; color: #6B6760">Map data © Google</span>
        </figure>`;
  };
  const notices = (site.notice_board || []).map((m) => String(m).toUpperCase());
  return `    ${heading}

    ${mount('OfficeCompare', photos, `<div style="width: 100%; aspect-ratio: 16 / 7; background: #ECE8E1"></div>`)}

    <div class="cwrap" style="display: flex; flex-wrap: wrap; gap: 40px 56px; border-top: 1px solid #141414; padding-top: 32px">
      <div class="crow" style="flex: 1 1 100%; min-width: 0">
        <div style="display: grid; grid-template-columns: 1fr; gap: 24px; align-content: start">
${offices.slice(0, 2).map(city).join('\n')}
        </div>
        <div class="cmapbox">
${offices.slice(0, 2).map(map).join('\n')}
        </div>
      </div>
      ${notices.length ? `<div style="flex: 1 1 100%; min-width: 0; display: flex; flex-direction: column; gap: 14px">
        <div style="font-size: 13px; letter-spacing: 0.32em; color: #6B6760">Notice board</div>
        ${mount('Ticker', { messages: notices, speed: 70 }, `<div style="height: 82px; border: 1px solid #0E0E0E; box-sizing: border-box"><span style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)">${esc(notices.join('. '))}</span></div>`)}
        <div style="display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 18px; margin-top: 6px">
          <span style="font-size: 13px; letter-spacing: 0.32em; color: #6B6760">Write to us</span>
          <a href="mailto:${esc(site.email)}" style="font-size: 20px; font-weight: 500; letter-spacing: -0.015em; border-bottom: 1px solid #141414; padding: 4px 0; text-decoration: none">${esc(site.email)}</a>
        </div>
      </div>` : `<div style="flex: 1 1 100%; display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 18px">
          <span style="font-size: 13px; letter-spacing: 0.32em; color: #6B6760">Write to us</span>
          <a href="mailto:${esc(site.email)}" style="font-size: 20px; font-weight: 500; letter-spacing: -0.015em; border-bottom: 1px solid #141414; padding: 4px 0; text-decoration: none">${esc(site.email)}</a>
        </div>`}
    </div>`;
}

export function footer(site, { emblemHref, emblemLabel, contactHref }) {
  return `  <footer style="border-top: 1px solid #0E0E0E">
    <div style="padding: 28px clamp(16px, 4cqw, 56px); max-width: 1440px; margin: 0 auto; box-sizing: border-box; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px 40px; font-size: 12px; letter-spacing: 0.12em; color: #6B6760">
      <div style="display: flex; align-items: center; gap: 16px">
        <a href="${emblemHref}" aria-label="${esc(emblemLabel)}" style="display: block; line-height: 0; text-decoration: none"><img src="/images/emblem.png" loading="lazy" decoding="async" alt="" aria-hidden="true" style="width: 44px; height: auto; display: block"></a>
        <span>© ${esc(site.firm_name)}</span>
      </div>
      <nav aria-label="Footer" style="display: flex; flex-wrap: wrap; gap: 4px 32px; font-size: 13px; letter-spacing: 0.2em">
        <a href="/work/" style="display: inline-block; color: #6B6760; text-decoration: none; padding: 12px 0">Work</a>
        <a href="/studio/" style="display: inline-block; color: #6B6760; text-decoration: none; padding: 12px 0">Studio</a>
        <a href="${contactHref}" style="display: inline-block; color: #6B6760; text-decoration: none; padding: 12px 0">Contact</a>
      </nav>
      <a href="mailto:${esc(site.email)}" style="font-size: 14px; letter-spacing: 0; color: #0E0E0E; text-decoration: none; border-bottom: 1px solid #0E0E0E; padding: 10px 0 2px">${esc(site.email)}</a>
    </div>
  </footer>`;
}
