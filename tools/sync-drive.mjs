// tools/sync-drive.mjs — brings the projects folder on Google Drive into the website.
//
// The folder (its link is set in the admin page under Site-wide → Google Drive folder) holds
// one subfolder per project, with that project's photos inside:
//
//   Bloc 11 Website Projects/
//     Shantiniketan/      cover.jpg, 01 street.jpg, 02 living.jpg …
//     Vistara/            …
//
// Each run (the "Refresh from Drive" button in the admin page starts one on GitHub):
//   • a new subfolder becomes a new project in the admin page — named after the folder,
//     hidden from the website until "Show on the Work page" is switched on;
//   • a subfolder whose name matches an existing project is linked to it;
//   • new or changed photos are copied in (resized to at most 2400 px wide), photos removed
//     from Drive are removed from the site, and each project's photos become choosable in the
//     admin page when you build its page;
//   • the list picture follows the photo named "cover…" (or the first photo) unless you chose a
//     different list picture in the admin page;
//   • nothing you typed in the admin page (names, text, page layouts) is ever overwritten.
//
// Needs: DRIVE_API_KEY (a Google API key allowed to use the Drive API) and the folder shared as
// "Anyone with the link – Viewer". Uses `sharp` to resize photos.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { describe, altFor, seoBase, tagger, cleanTags, classify, TYPE_FOR } from './photo-tags.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_PATH || 'sharp');

const API = process.env.DRIVE_API_BASE || 'https://www.googleapis.com/drive/v3';
const KEY = process.env.DRIVE_API_KEY;
const STATE_FILE = path.join(root, 'tools', 'drive-state.json');
const PROJECTS = path.join(root, 'content', 'projects');
const IMG_ROOT = path.join(root, 'static', 'images', 'projects');
const IMAGE_TYPES = /^image\/(jpeg|png|webp|tiff|heic|heif)$/i;
const MAX_W = 2400;

const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let waited = 0;                                       // seconds spent waiting on a busy Google Drive
// a refresh stops taking new photos after this long and saves what it has, so GitHub's time limit
// never throws away a long run; the rest come in on the next refresh
const T0 = Date.now();
const TIME_BUDGET = Number(process.env.SYNC_TIME_BUDGET_MIN || 35) * 60000;
const overTime = () => Date.now() - T0 > TIME_BUDGET;
const clock = () => { const t = Math.round((Date.now() - T0) / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
let done = 0;
const WAIT_BUDGET = Number(process.env.DRIVE_WAIT_BUDGET || 600);
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
const writeJSON = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); };
export const slugify = (s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
const fileSlug = (name) => slugify(name.replace(/\.[^.]+$/, ''));

// ---- the "Website projects" Google Sheet ----
function sheetIdFrom(link) {
  const m = String(link || '').match(/spreadsheets\/d\/([A-Za-z0-9_-]{20,})/) || String(link || '').match(/^([A-Za-z0-9_-]{30,})$/);
  return m ? m[1] : '';
}
function csv(text) {                                   // a small CSV reader (quotes, commas and line breaks inside quotes)
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const GROUPS = ['Residential', 'Commercial', 'Hospitality', 'Institutional', 'Interiors', 'Planning', 'Installations'];
async function applySheet(id) {
  const r = await fetch(`${process.env.SHEET_BASE || 'https://docs.google.com'}/spreadsheets/d/${id}/export?format=csv`, { signal: AbortSignal.timeout(60000) });
  const text = await r.text();
  if (!r.ok || /^\s*<(!doctype|html)/i.test(text)) throw new Error(`Google said ${r.status}`);
  const rows = csv(text).filter((x) => x.some((c) => c.trim()));
  const head = (rows.shift() || []).map((h) => h.trim().toLowerCase());
  const col = (...names) => head.findIndex((h) => names.some((n) => h === n || h.startsWith(n)));
  const C = { id: col('id'), title: col('project'), show: col('show'), order: col('position', 'order', 'no'), category: col('category', 'filter'), type: col('type'), status: col('status'), year: col('year'), city: col('city', 'location'), page: col('own page') };
  const files = fs.readdirSync(PROJECTS).filter((x) => x.endsWith('.json'));
  const byId = new Map(files.map((x) => [x.replace(/\.json$/, ''), x]));
  const byTitle = new Map(files.map((x) => [String(readJSON(path.join(PROJECTS, x), {}).title || '').trim().toLowerCase(), x]));
  const changes = [];
  for (const row of rows) {
    const get = (k) => (C[k] >= 0 ? String(row[C[k]] || '').trim() : '');
    const file = byId.get(get('id')) || byTitle.get(get('title').toLowerCase());
    if (!file) continue;
    const pf = path.join(PROJECTS, file), p = readJSON(pf, {}), was = JSON.stringify(p), what = [];
    const set = (key, v, label) => { if (v !== '' && v !== undefined && p[key] !== v) { p[key] = v; what.push(label); } };
    if (get('title')) set('title', get('title'), 'name');
    const sh = get('show').toLowerCase();
    if (/^(yes|y|true|on|show|shown|✓|✔|1)$/.test(sh)) set('show_on_work', true, 'shown');
    else if (/^(no|n|false|off|hide|hidden|✗|✘|0)$/.test(sh)) set('show_on_work', false, 'hidden');
    const pg = get('page').toLowerCase();
    if (/^(yes|y|true|on|1)$/.test(pg)) set('has_page', true, 'own page on');
    else if (/^(no|n|false|off|0)$/.test(pg)) set('has_page', false, 'own page off');
    if (/^\d+$/.test(get('order'))) set('order', Number(get('order')), `position ${get('order')}`);
    const g = GROUPS.find((x) => x.toLowerCase() === get('category').toLowerCase());
    if (g) set('category', g, g);
    set('type', get('type'), 'type');
    const stt = ['Completed', 'Ongoing'].find((x) => x.toLowerCase() === get('status').toLowerCase());
    if (stt) set('status', stt, stt);
    set('year', get('year'), 'year');
    set('location', get('city'), 'city');
    if (JSON.stringify(p) !== was) { writeJSON(pf, p); changes.push(`${p.title}: ${what.join(', ')}`); }
  }
  return changes;
}

// replace whole picture addresses inside a JSON text
function swap(txt, map) {
  let out = txt;
  for (const [a, b] of map) out = out.split(JSON.stringify(a)).join(JSON.stringify(b));
  return out;
}

function folderIdFrom(link) {
  const s = String(link || '').trim();
  const m = s.match(/folders\/([A-Za-z0-9_-]{10,})/) || s.match(/[?&]id=([A-Za-z0-9_-]{10,})/) || s.match(/^([A-Za-z0-9_-]{10,})$/);
  return m ? m[1] : '';
}

async function api(p, params = {}) {
  const u = new URL(API + p);
  Object.entries({ ...params, key: KEY, supportsAllDrives: 'true' }).forEach(([k, v]) => u.searchParams.set(k, v));
  for (let attempt = 0; ; attempt++) {
    let r;
    try { r = await fetch(u, { signal: AbortSignal.timeout(p.includes('alt=media') || params.alt ? 180000 : 60000) }); }
    catch (e) { if (attempt < 2) { log(`Google Drive did not answer — trying again`); continue; } throw new Error(`Google Drive did not answer (${e.name})`); }
    if (r.ok) return r;
    const body = await r.text();
    // Google answers many quick downloads with a "Sorry…" page (403) or 429: wait and try again
    const busy = r.status === 429 || r.status >= 500 || (r.status === 403 && /Sorry|automated|rateLimit|userRateLimit|quota/i.test(body));
    const wait = [15, 30, 60, 90, 120][attempt];
    if (busy && wait && waited + wait <= WAIT_BUDGET) {
      log(`Google Drive is busy (${r.status}) — waiting ${wait} s`);
      waited += wait; await sleep(wait * 1000); continue;
    }
    const text = body.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    throw new Error(`Google Drive said ${r.status}${busy ? ' (too many downloads — the next refresh will pick it up)' : ''}: ${text.slice(0, 160)}`);
  }
}
async function list(parent) {
  const out = []; let pageToken = '';
  do {
    const r = await api('/files', {
      q: `'${parent}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, md5Checksum, modifiedTime, size)',
      pageSize: '1000', orderBy: 'name', includeItemsFromAllDrives: 'true',
      ...(pageToken ? { pageToken } : {}),
    });
    const j = await r.json();
    out.push(...(j.files || []));
    pageToken = j.nextPageToken || '';
  } while (pageToken);
  return out;
}
// Photos come from Google's image servers as a ready-made copy at most 2400 px wide — the size the
// website keeps anyway. That is a fraction of a 10 MB render, and those servers don't refuse long runs
// of downloads the way Drive's file downloads do. If that copy isn't available, the original is used.
const IMG_BASE = process.env.DRIVE_IMAGE_BASE || 'https://lh3.googleusercontent.com/d/';
let viaImageServer = 0, viaDrive = 0;
async function download(id) {
  if (IMG_BASE !== 'off') {
    try {
      const r = await fetch(`${IMG_BASE}${id}=w${MAX_W}`, { redirect: 'follow', signal: AbortSignal.timeout(60000) });
      const type = r.headers.get('content-type') || '';
      if (r.ok && type.startsWith('image/')) {
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length > 2000) { viaImageServer++; return buf; }
      }
    } catch (e) {}
  }
  const r = await api(`/files/${id}`, { alt: 'media' });
  viaDrive++;
  return Buffer.from(await r.arrayBuffer());
}

// renders and photos become JPEGs (a fraction of the size); PNG is kept only for real transparency
async function encode(buf) {
  const meta = await sharp(buf, { failOn: 'none' }).metadata();
  let keepPng = false;
  if (meta.hasAlpha && /png|webp/.test(meta.format || '')) {
    // keep transparency only when it is real (logos, cut-outs) — not a few stray pixels at a render's edge
    const st = await sharp(buf, { failOn: 'none' }).stats();
    const a = st.channels && st.channels[st.channels.length - 1];
    keepPng = !st.isOpaque && !!a && a.mean < 250;
  }
  let img = sharp(buf, { failOn: 'none' }).rotate();
  if ((meta.width || 0) > MAX_W) img = img.resize({ width: MAX_W, withoutEnlargement: true });
  return keepPng
    ? { ext: 'png', out: img.png({ compressionLevel: 9 }) }
    : { ext: 'jpg', out: img.flatten({ background: '#ffffff' }).jpeg({ quality: 80, progressive: true, mozjpeg: true }) };
}

async function main() {
  if (!KEY) throw new Error('DRIVE_API_KEY is missing. Add it under the GitHub repository → Settings → Secrets and variables → Actions.');
  const cfg = readJSON(path.join(root, 'content', 'drive.json'), {});
  const rootId = process.env.DRIVE_FOLDER_ID || folderIdFrom(cfg.folder_link);
  if (!rootId) throw new Error('No Google Drive folder set. Paste the folder link in the admin page under Site-wide → Google Drive folder.');

  const state = readJSON(STATE_FILE, { folders: {} });
  const report = { added: [], linked: [], photosAdded: 0, photosUpdated: 0, photosRemoved: 0, upgraded: 0, converted: 0, skipped: [], duplicates: [], missingFolders: [] };
  const renames = new Map();                           // old picture address → new one (for every page that uses it)

  const entries = await list(rootId);
  const folders = entries.filter((f) => f.mimeType === 'application/vnd.google-apps.folder' && !/^[._]/.test(f.name));
  log(`Drive folder has ${folders.length} project folder(s).`);

  const takenSlugs = new Map(Object.entries(state.folders).map(([fid, s]) => [s.slug, fid]));
  const seenFolders = new Set();

  // list every folder first, so the log can say "photo 12 of 70"
  const listed = new Map();
  for (const folder of folders) listed.set(folder.id, (await list(folder.id)).filter((f) => IMAGE_TYPES.test(f.mimeType) && !/^[._]/.test(f.name)));
  let total = 0;
  for (const folder of folders) {
    const st = state.folders[folder.id], seen = new Set();
    for (const f of listed.get(folder.id)) {
      if (f.md5Checksum) { if (seen.has(f.md5Checksum)) continue; seen.add(f.md5Checksum); }
      const prev = st && st.files[f.id];
      if (!prev || prev.md5 !== (f.md5Checksum || f.modifiedTime) || (/\.png$/i.test(prev.file) && !prev.transparent) || (tagger && (prev.by ? prev.by === 'file name' : !prev.file.startsWith(`${st.slug}-`)))) total++;
    }
  }
  log(total ? `${total} photo(s) to bring in.` : 'No new or changed photos.');

  for (const folder of folders) {
    seenFolders.add(folder.id);
    let st = state.folders[folder.id];
    // which project does this folder belong to?
    if (!st) {
      let slug = slugify(folder.name), n = 2;
      while (takenSlugs.has(slug) && takenSlugs.get(slug) !== folder.id) slug = `${slugify(folder.name)}-${n++}`;
      st = state.folders[folder.id] = { slug, files: {}, cover: '' };
      takenSlugs.set(slug, folder.id);
    }
    const slug = st.slug;
    const pfile = path.join(PROJECTS, `${slug}.json`);
    const exists = fs.existsSync(pfile);
    let proj = exists ? readJSON(pfile, {}) : { title: folder.name.trim() };
    const ctx = { slug, title: proj.title || folder.name, type: proj.type, location: proj.location, status: proj.status };

    // photos
    const files = listed.get(folder.id)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const dir = path.join(IMG_ROOT, slug);
    fs.mkdirSync(dir, { recursive: true });
    const keep = new Set();
    const usedNames = new Set(Object.values(st.files).map((i) => i.file.replace(/\.[^.]+$/, '')));
    const fresh = {};                                  // file id → new description/tags for this run
    const renamedFrom = {};                            // file id → its old picture address
    const seenMd5 = new Set();
    // the same photo uploaded twice: keep the copy the site already uses
    files.sort((a, b) => (st.files[b.id] ? 1 : 0) - (st.files[a.id] ? 1 : 0) || a.name.localeCompare(b.name, undefined, { numeric: true }));
    for (const f of files) {
      if (f.md5Checksum) {
        if (seenMd5.has(f.md5Checksum)) { report.duplicates.push(`${folder.name}/${f.name}`); continue; }
        seenMd5.add(f.md5Checksum);
      }
      const prev = st.files[f.id];
      keep.add(f.id);
      const sum = f.md5Checksum || f.modifiedTime;
      const have = prev && fs.existsSync(path.join(dir, prev.file));
      const unchanged = have && prev.md5 === sum;
      // photos copied in before descriptions were switched on (or when the reader was unavailable)
      const unnamed = !!prev && (prev.by ? prev.by === 'file name' && !!tagger : !prev.file.startsWith(`${slug}-`));
      const isPng = !!prev && /\.png$/i.test(prev.file) && !prev.transparent;   // a PNG kept for real transparency stays
      if (unchanged && !(unnamed && tagger) && !isPng) continue;
      if (overTime()) {                                // time's up: leave this photo for the next refresh
        report.deferred = (report.deferred || 0) + 1;
        if (!prev) keep.delete(f.id);
        continue;
      }
      log(`[${clock()}] photo ${++done} of ${Math.max(total, done)} · ${folder.name} · ${f.name}`);
      try {
        const buf = unchanged ? fs.readFileSync(path.join(dir, prev.file)) : await download(f.id);
        let enc = await encode(buf);
        let base = prev ? prev.file.replace(/\.[^.]+$/, '') : '';
        let by = prev && prev.by;
        // a brand-new photo is read and named once; a replaced photo keeps its name (and the tags you may have edited)
        if (!prev || (unnamed && tagger)) {
          const small = await sharp(buf, { failOn: 'none' }).rotate().resize({ width: 1024, withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 78 }).toBuffer();
          const info = await describe(small, ctx, f.name);
          // a photo saved sideways or upside down (the reader says how far to turn it) is turned upright
          if (!prev && info.rotate) { const upright = await sharp(buf, { failOn: 'none' }).rotate().toBuffer(); enc = await encode(await sharp(upright).rotate(info.rotate).toBuffer()); report.turned = (report.turned || 0) + 1; }
          if (info.error) report.skipped.push(`${folder.name}/${f.name}: description from file name (${info.error.slice(0, 120)})`);
          if (!prev || !info.error) {
            let b = seoBase(ctx, info.name) || fileSlug(f.name), n = 2;
            const b0 = b;
            while (usedNames.has(b) && b !== base) b = `${b0}-${n++}`;
            usedNames.add(b);
            base = b; by = info.auto;
            fresh[f.id] = info;
            if (prev) report.upgraded++;
          }
        }
        const rel = `${base}.${enc.ext}`;
        await enc.out.toFile(path.join(dir, rel));
        if (prev && prev.file !== rel) {
          if (have) fs.rmSync(path.join(dir, prev.file), { force: true });
          renamedFrom[f.id] = `/images/projects/${slug}/${prev.file}`;
          renames.set(renamedFrom[f.id], `/images/projects/${slug}/${rel}`);
          if (isPng && enc.ext === 'jpg') report.converted++;
        }
        st.files[f.id] = { name: f.name, file: rel, md5: sum, ...(by ? { by } : {}), ...(enc.ext === 'png' ? { transparent: true } : {}) };
        if (!prev) report.photosAdded++; else if (!unchanged) report.photosUpdated++;
      } catch (e) {
        report.skipped.push(`${folder.name}/${f.name} (${e.message.split('\n')[0]})`);
        if (!prev) keep.delete(f.id);
      }
    }
    // renamed pictures: follow them in this project's list picture, main picture and layout
    if (Object.keys(renamedFrom).length) proj = JSON.parse(swap(JSON.stringify(proj), renames));
    // photos taken out of the Drive folder
    for (const [fid, info] of Object.entries(st.files)) {
      if (!keep.has(fid)) { fs.rmSync(path.join(dir, info.file), { force: true }); delete st.files[fid]; report.photosRemoved++; }
    }
    // the project's photo list: one entry per Drive photo, with its description and tags
    const old = new Map((Array.isArray(proj.photos) ? proj.photos : []).map((ph) => typeof ph === 'string' ? [ph, { src: ph }] : [ph.src, ph]));
    const photos = Object.entries(st.files).sort(([, a], [, b]) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map(([fid, i]) => {
        const src = `/images/projects/${slug}/${i.file}`;
        const was = old.get(src) || {};
        const nu = fresh[fid];
        // a new description replaces only the plain one written before (never text typed in the admin page)
        const plain = !was.alt || was.alt === altFor('', ctx) || !(was.tags && was.tags.length);
        return {
          src,
          alt: nu && plain ? altFor(nu.description, ctx) : (was.alt || altFor('', ctx)),
          tags: cleanTags(nu && plain ? nu.tags : (was.tags || [])),
          vault: was.vault !== false,
        };
      });
    if (Object.keys(fresh).length) report.tagged = (report.tagged || 0) + Object.keys(fresh).length;
    const coverInfo = Object.values(st.files).find((i) => /^cover/i.test(i.name));
    const cover = coverInfo ? `/images/projects/${slug}/${coverInfo.file}` : (photos[0] && photos[0].src) || '';

    // the project's filter group (Residential, Interiors …): decided once by the photo reader from a few
    // of its photos, only while it is empty — a group chosen in the admin page is never changed
    let picked = null;
    if (tagger && !st.classified && !(exists && proj.category) && photos.length && !overTime()) {
      log(`[${clock()}] choosing the filter group · ${folder.name}`);
      const pick = photos.filter((ph, k) => k % Math.max(1, Math.floor(photos.length / 4)) === 0).slice(0, 4);
      const jpegs = [];
      for (const ph of pick) {
        try { jpegs.push(await sharp(fs.readFileSync(path.join(root, 'static', ph.src)), { failOn: 'none' }).rotate().resize({ width: 768, withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 75 }).toBuffer()); } catch (e) {}
      }
      const notes = photos.map((ph) => String(ph.alt || '').split(' — ')[0]).filter(Boolean);
      const got = jpegs.length ? await classify(jpegs, ctx, notes) : { category: '', error: 'no photos' };
      if (got.category) {
        picked = got.category; st.classified = true;
        (report.grouped = report.grouped || []).push(`${folder.name} → ${got.category}${got.reason ? ` (${got.reason})` : ''}`);
      } else report.skipped.push(`${folder.name}: filter group not decided (${got.error})`);
    }

    // the project in the admin page
    if (!exists) {
      // a new project is numbered after the last one (e.g. 23 when the list ends at 22)
      const orders = fs.readdirSync(PROJECTS).filter((x) => x.endsWith('.json')).map((x) => Number(readJSON(path.join(PROJECTS, x), {}).order) || 0).filter((o) => o < 99);
      writeJSON(pfile, {
        title: folder.name.trim(), order: Math.max(0, ...orders) + 1, type: picked ? TYPE_FOR[picked] : '', category: picked || '', location: '', year: '', status: 'Ongoing',
        show_on_work: false, has_page: false, thumbnail: cover, hero_image: cover, hero_alt: '', about: '', blocks: [],
        drive_folder: folder.id, photos,
      });
      report.added.push(folder.name);
    } else {
      const p = proj;
      if (p.drive_folder !== folder.id) report.linked.push(folder.name);
      p.drive_folder = folder.id;
      p.photos = photos;
      if (picked && !p.category) { p.category = picked; if (!p.type) p.type = TYPE_FOR[picked]; }
      // follow the Drive cover only while the list picture is still the one the sync chose
      if (!p.thumbnail || p.thumbnail === st.cover || !fs.existsSync(path.join(root, 'static', p.thumbnail))) p.thumbnail = cover || p.thumbnail;
      if (p.has_page && !p.hero_image) p.hero_image = cover;
      writeJSON(pfile, p);
    }
    st.cover = cover;
    st.name = folder.name;
  }

  // project folders no longer in Drive: keep the project and its photos, just unlink it
  for (const [fid, st] of Object.entries(state.folders)) {
    if (seenFolders.has(fid)) continue;
    report.missingFolders.push(st.name || st.slug);
    const pfile = path.join(PROJECTS, `${st.slug}.json`);
    if (fs.existsSync(pfile)) { const p = readJSON(pfile, {}); delete p.drive_folder; writeJSON(pfile, p); }
    delete state.folders[fid];
  }

  // the "Website projects" Google Sheet: whatever is filled in there is applied to the projects
  const sheetId = sheetIdFrom(cfg.sheet_link);
  if (sheetId) {
    try { report.sheet = await applySheet(sheetId); }
    catch (e) { report.skipped.push(`Projects sheet could not be read (${e.message.slice(0, 120)}) — check it is shared as "Anyone with the link"`); }
  }

  // pictures renamed this run: update every other page that shows them (e.g. the home slideshow)
  if (renames.size) {
    const dirs = [path.join(root, 'content'), PROJECTS];
    for (const d of dirs) for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.json'))) {
      const file = path.join(d, f), txt = fs.readFileSync(file, 'utf8'), nu = swap(txt, renames);
      if (nu !== txt) fs.writeFileSync(file, nu);
    }
  }

  writeJSON(STATE_FILE, state);
  const lines = [
    `New projects: ${report.added.length ? report.added.join(', ') : 'none'}`,
    `Linked to existing projects: ${report.linked.length ? report.linked.join(', ') : 'none'}`,
    `Photos added ${report.photosAdded}, updated ${report.photosUpdated}, removed ${report.photosRemoved}`,
    ...(viaImageServer + viaDrive ? [`Downloaded ${viaImageServer} from Google's image servers, ${viaDrive} as originals from Drive`] : []),
    ...(report.upgraded ? [`Earlier photos given descriptions and search names: ${report.upgraded}`] : []),
    ...(report.deferred ? [`Left for the next refresh (time limit reached): ${report.deferred} photo(s) — press Refresh again`] : []),
    ...(report.sheet ? [`From the projects sheet: ${report.sheet.length ? report.sheet.join('; ') : 'no changes'}`] : []),
    ...(report.grouped ? [`Filter groups chosen: ${report.grouped.join('; ')}`] : []),
    ...(report.turned ? [`Sideways photos turned upright: ${report.turned}`] : []),
    ...(report.converted ? [`PNG pictures made into lighter JPEGs: ${report.converted}`] : []),
    ...(report.duplicates.length ? [`Skipped as duplicates of another photo in the same folder (you can delete these in Drive): ${report.duplicates.join(', ')}`] : []),
    `New photos described: ${report.tagged || 0} (${tagger ? `by ${tagger}` : 'from file names — add an ANTHROPIC_API_KEY or GEMINI_API_KEY secret for automatic descriptions'})`,
    ...(report.skipped.length ? [`Could not read: ${report.skipped.join('; ')}`] : []),
    ...(report.missingFolders.length ? [`Folders no longer in Drive (projects kept, unlinked): ${report.missingFolders.join(', ')}`] : []),
  ];
  log(lines.join('\n'));
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### Refresh from Drive\n\n' + lines.map((l) => `- ${l}`).join('\n') + '\n');
}

main().catch((e) => {
  console.error('\n' + e.message);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Refresh from Drive failed\n\n${e.message}\n`);
  process.exit(1);
});
