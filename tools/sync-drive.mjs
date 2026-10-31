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
import { describe, altFor, seoBase, tagger } from './photo-tags.mjs';

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
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
const writeJSON = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); };
export const slugify = (s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
const fileSlug = (name) => slugify(name.replace(/\.[^.]+$/, ''));

function folderIdFrom(link) {
  const s = String(link || '').trim();
  const m = s.match(/folders\/([A-Za-z0-9_-]{10,})/) || s.match(/[?&]id=([A-Za-z0-9_-]{10,})/) || s.match(/^([A-Za-z0-9_-]{10,})$/);
  return m ? m[1] : '';
}

async function api(p, params = {}) {
  const u = new URL(API + p);
  Object.entries({ ...params, key: KEY, supportsAllDrives: 'true' }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u);
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Google Drive said ${r.status} for ${p}: ${body.slice(0, 300)}`);
  }
  return r;
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
async function download(id) {
  const r = await api(`/files/${id}`, { alt: 'media' });
  return Buffer.from(await r.arrayBuffer());
}

async function main() {
  if (!KEY) throw new Error('DRIVE_API_KEY is missing. Add it under the GitHub repository → Settings → Secrets and variables → Actions.');
  const cfg = readJSON(path.join(root, 'content', 'drive.json'), {});
  const rootId = process.env.DRIVE_FOLDER_ID || folderIdFrom(cfg.folder_link);
  if (!rootId) throw new Error('No Google Drive folder set. Paste the folder link in the admin page under Site-wide → Google Drive folder.');

  const state = readJSON(STATE_FILE, { folders: {} });
  const report = { added: [], linked: [], photosAdded: 0, photosUpdated: 0, photosRemoved: 0, skipped: [], missingFolders: [] };

  const entries = await list(rootId);
  const folders = entries.filter((f) => f.mimeType === 'application/vnd.google-apps.folder' && !/^[._]/.test(f.name));
  log(`Drive folder has ${folders.length} project folder(s).`);

  const takenSlugs = new Map(Object.entries(state.folders).map(([fid, s]) => [s.slug, fid]));
  const seenFolders = new Set();

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
    const proj = exists ? readJSON(pfile, {}) : { title: folder.name.trim() };
    const ctx = { slug, title: proj.title || folder.name, type: proj.type, location: proj.location, status: proj.status };

    // photos
    const files = (await list(folder.id)).filter((f) => IMAGE_TYPES.test(f.mimeType) && !/^[._]/.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const dir = path.join(IMG_ROOT, slug);
    fs.mkdirSync(dir, { recursive: true });
    const keep = new Set();
    const usedNames = new Set(Object.values(st.files).map((i) => i.file.replace(/\.[^.]+$/, '')));
    const fresh = {};                                  // file id → new description/tags for this run
    for (const f of files) {
      const isPng = /png$/i.test(f.mimeType);
      const prev = st.files[f.id];
      keep.add(f.id);
      const sum = f.md5Checksum || f.modifiedTime;
      if (prev && prev.md5 === sum && fs.existsSync(path.join(dir, prev.file))) continue;
      try {
        const buf = await download(f.id);
        let img = sharp(buf, { failOn: 'none' }).rotate();
        const meta = await img.metadata();
        if ((meta.width || 0) > MAX_W) img = img.resize({ width: MAX_W, withoutEnlargement: true });
        // a brand-new photo is read and named once; a replaced photo keeps its name (and the tags you may have edited)
        let rel = prev && prev.file;
        if (!rel) {
          const small = await sharp(buf, { failOn: 'none' }).rotate().resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 78 }).toBuffer();
          const info = await describe(small, ctx, f.name);
          if (info.error) report.skipped.push(`${folder.name}/${f.name}: tags from file name (${info.error.slice(0, 120)})`);
          let base = seoBase(ctx, info.name) || slugify(f.name.replace(/\.[^.]+$/, '')), n = 2;
          const b0 = base;
          while (usedNames.has(base)) base = `${b0}-${n++}`;
          usedNames.add(base);
          rel = `${base}.${isPng ? 'png' : 'jpg'}`;
          fresh[f.id] = info;
        }
        await (isPng ? img.png({ compressionLevel: 9 }) : img.jpeg({ quality: 80, progressive: true, mozjpeg: true })).toFile(path.join(dir, rel));
        st.files[f.id] = { name: f.name, file: rel, md5: sum };
        prev ? report.photosUpdated++ : report.photosAdded++;
      } catch (e) {
        report.skipped.push(`${folder.name}/${f.name} (${e.message.split('\n')[0]})`);
        if (!prev) keep.delete(f.id);
      }
    }
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
        return {
          src,
          alt: was.alt || (nu ? altFor(nu.description, ctx) : altFor('', ctx)),
          tags: (was.tags && was.tags.length) ? was.tags : (nu ? nu.tags : []),
          vault: was.vault !== false,
        };
      });
    if (Object.keys(fresh).length) report.tagged = (report.tagged || 0) + Object.keys(fresh).length;
    const coverInfo = Object.values(st.files).find((i) => /^cover/i.test(i.name));
    const cover = coverInfo ? `/images/projects/${slug}/${coverInfo.file}` : (photos[0] && photos[0].src) || '';

    // the project in the admin page
    if (!exists) {
      writeJSON(pfile, {
        title: folder.name.trim(), order: 99, type: '', category: '', location: '', year: '', status: 'Ongoing',
        show_on_work: false, has_page: false, thumbnail: cover, hero_image: cover, hero_alt: '', about: '', blocks: [],
        drive_folder: folder.id, photos,
      });
      report.added.push(folder.name);
    } else {
      const p = proj;
      if (p.drive_folder !== folder.id) report.linked.push(folder.name);
      p.drive_folder = folder.id;
      p.photos = photos;
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

  writeJSON(STATE_FILE, state);
  const lines = [
    `New projects: ${report.added.length ? report.added.join(', ') : 'none'}`,
    `Linked to existing projects: ${report.linked.length ? report.linked.join(', ') : 'none'}`,
    `Photos added ${report.photosAdded}, updated ${report.photosUpdated}, removed ${report.photosRemoved}`,
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
