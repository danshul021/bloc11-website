// tools/photo-tags.mjs — writes a description, search tags and an SEO file name for one photo.
//
// Uses an AI image-reading service when a key is available (checked in this order):
//   GEMINI_API_KEY     → Google Gemini   (model: GEMINI_MODEL, default gemini-3.5-flash-lite)
//   ANTHROPIC_API_KEY  → Claude          (model: TAG_MODEL, default claude-haiku-5-5)
// Without a key it falls back to the project's details and the Drive file name, so the
// refresh still works — the photo just gets plainer tags, which can be edited in the admin page.

export const slugify = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const FIRM = 'Bloc 11 Architects';

// "Double-height living room …" + project → full sentence for Google and screen readers
export function altFor(desc, p) {
  const d = String(desc || '').trim().replace(/\.$/, '');
  const where = [p.type ? p.type.toLowerCase() : '', p.location ? `in ${p.location}` : ''].filter(Boolean).join(' ');
  const ctx = `${p.title}${where ? `, ${where}` : ''} by ${FIRM}`;
  return d ? `${d} — ${ctx}` : ctx;
}

// shantiniketan-residence-indore-double-height-living-room.jpg
export function seoBase(p, name) {
  const parts = [slugify(p.slug || p.title), slugify(p.type), slugify(p.location), slugify(name)].filter(Boolean);
  // drop repeated words like "residence-residence"
  const seen = new Set();
  return parts.join('-').split('-').filter((w) => { if (seen.has(w) && w.length > 3) return false; seen.add(w); return true; }).join('-').slice(0, 90).replace(/-+$/, '');
}

// tags every photo gets from its project, so searching "Indore" or "residential" always works
export function projectTags(p) {
  return [p.title, p.type, p.category, p.location].filter(Boolean).map((t) => String(t).toLowerCase());
}

export function mergeTags(...lists) {
  const out = [];
  lists.flat().forEach((t) => { const v = String(t || '').trim().toLowerCase(); if (v && !out.includes(v)) out.push(v); });
  return out.slice(0, 18);
}

// camera and render file names ("IMG_20230224_132250_Edited_4K", "View_01_P05", "Enscape_2025-01-08…") make poor tags
const JUNK = /^[\d\s._-]*$|\d{5,}|\b\d+k\b|\b[pvx]\d+\b|\b(img|dsc|pxl|enscape|view|edited|repaired|final|copy|untitled|render)\s*\d*$|^(img|dsc|pxl|enscape|view|untitled)\b/i;
export const cleanTags = (tags) => (tags || []).filter((t) => !JUNK.test(String(t)) || /^render$/i.test(String(t)));

const PROMPT = (p) => `You are tagging a photo for the portfolio website of ${FIRM}, an architecture and interior design practice in India.
Project: ${p.title || 'unknown'}${p.type ? ` — ${p.type}` : ''}${p.location ? ` in ${p.location}` : ''}${p.status ? ` (${p.status})` : ''}.

Look at the photo and reply with JSON only, no other text:
{"description": "...", "tags": ["..."], "name": "...", "rotate": 0}

- description: one plain sentence (8–18 words) describing what is visible, the way an architect would — space or view, key elements, materials, light. No project name, no marketing words.
- tags: 6–12 short lowercase search tags. Always include the view type (one of: exterior, interior, elevation, detail, aerial, plan, section, sketch, model, render, site) and the space if any (e.g. living room, bedroom, kitchen, bathroom, dining, staircase, entrance, courtyard, terrace, office, lobby, facade, landscape). Add materials and features you can see (e.g. brick jaali, terracotta, exposed concrete, timber, marble, louvres, double height, skylight). Say "render" if it is a computer visualisation.
- name: 2–5 lowercase words for an SEO file name (e.g. "double height living room").
- rotate: 0 if the photo is upright. Only if it is clearly saved sideways or upside down (sky at the side or bottom, walls and people lying horizontal, upside-down text), give the clockwise turn in degrees that makes it upright: 90, 180 or 270. Upward views of a facade and tilted artistic angles are upright — answer 0 for those.`;

function parse(text) {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) throw new Error('no JSON in reply');
  const j = JSON.parse(m[0]);
  const rotate = [90, 180, 270].includes(Number(j.rotate)) ? Number(j.rotate) : 0;
  return { description: String(j.description || '').trim(), tags: Array.isArray(j.tags) ? j.tags.map(String) : [], name: String(j.name || '').trim(), rotate };
}

async function claude(jpeg, p) {
  const r = await fetch((process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com') + '/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.TAG_MODEL || 'claude-haiku-5-5', max_tokens: 400,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpeg.toString('base64') } },
        { type: 'text', text: PROMPT(p) },
      ] }],
    }),
  });
  if (!r.ok) throw new Error(`Claude said ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return parse((j.content || []).map((c) => c.text || '').join(''));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0, outOfQuota = '';

async function gemini(jpeg, p) {
  if (outOfQuota) throw new Error(outOfQuota);
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const gap = Number(process.env.TAG_GAP_MS || 4500);   // the free tier allows about 15 photos a minute
  for (let attempt = 0; ; attempt++) {
    const since = Date.now() - lastCall;
    if (since < gap) await sleep(gap - since);
    lastCall = Date.now();
    let r;
    try { r = await fetch(`${process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com'}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: jpeg.toString('base64') } }, { text: PROMPT(p) }] }] }),
    }); } catch (e) {                                   // network hiccup: try again
      if (attempt < 3) { await sleep(5000); continue; }
      throw e;
    }
    if (r.ok) {
      const j = await r.json();
      return parse(((j.candidates || [])[0]?.content?.parts || []).map((x) => x.text || '').join(''));
    }
    const body = await r.text();
    if (r.status === 429 && /PerDay|per day|daily/i.test(body)) {
      outOfQuota = 'Gemini daily limit reached — the rest will be described on a later refresh';
      throw new Error(outOfQuota);
    }
    const wait = [20, 40, 60][attempt];
    if ((r.status === 429 || r.status >= 500) && wait) { console.log(`Gemini is busy (${r.status}) — waiting ${wait} s`); await sleep(wait * 1000); continue; }
    throw new Error(`Gemini said ${r.status}: ${body.slice(0, 200)}`);
  }
}

export const tagger = process.env.GEMINI_API_KEY ? 'Gemini' : process.env.ANTHROPIC_API_KEY ? 'Claude' : '';

// jpeg: a small JPEG of the photo (about 1024 px wide); fileName: its name in Drive
export async function describe(jpeg, p, fileName) {
  const fromName = String(fileName || '').replace(/\.[^.]+$/, '').replace(/^(cover|img|dsc|pxl|photo)[\s_-]*\d*/i, '').replace(/^\d+[\s._-]*/, '').replace(/[_-]+/g, ' ').trim();
  let got = null, error = '';
  if (tagger) {
    try { got = tagger === 'Gemini' ? await gemini(jpeg, p) : await claude(jpeg, p); }
    catch (e) { error = e.message; }
  }
  const description = got?.description || (fromName ? fromName.charAt(0).toUpperCase() + fromName.slice(1) : '');
  const name = got?.name || fromName || 'photo';
  return { description, tags: cleanTags(mergeTags(got?.tags || [], !got && fromName ? [fromName] : [], projectTags(p))), name, rotate: got?.rotate || 0, auto: got ? tagger : 'file name', error };
}
