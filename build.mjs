// build.mjs — turns the content/ files into the finished website in _site/.
// No packages needed: Netlify runs `node build.mjs` after every change saved from the admin page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHome } from './templates/home.mjs';
import { renderStudio } from './templates/studio.mjs';
import { renderWork, renderProject, vaultData } from './templates/work.mjs';
import { SITE_URL, esc, PHOTO_ALT, has } from './templates/lib.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, '_site');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, 'content', f), 'utf8'));

const site = read('site.json');
const home = read('home.json');
const studio = read('studio.json');
const work = read('work.json');

const projects = fs.readdirSync(path.join(root, 'content', 'projects'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ slug: f.replace(/\.json$/, ''), ...read(path.join('projects', f)) }))
  .filter((p) => p.title && p.draft !== true && p.show_on_work !== false)
  .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999) || a.title.localeCompare(b.title));

// descriptions of every Drive photo, so pictures get proper alt text wherever they are used
projects.forEach((p) => (Array.isArray(p.photos) ? p.photos : []).forEach((ph) => { if (ph && ph.src && ph.alt) PHOTO_ALT.set(ph.src, ph.alt); }));
const vault = vaultData(projects);

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'static'), out, { recursive: true });

const write = (rel, html) => {
  const f = path.join(out, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
};

write('index.html', renderHome({ site, home, projects }));
write('studio/index.html', renderStudio({ site, studio }));
write('work/index.html', renderWork({ site, work, projects, vault }));
write('work/vault/index.html', renderWork({ site, work, projects, vault, view: 'vault' }));
const urls = ['/', '/studio/', '/work/', '/work/vault/'];
projects.forEach((p, i) => {
  if (!p.has_page) return;
  const n = (i + 1) % projects.length;
  const next = projects.length > 1 ? projects[n] : null;
  write(`work/${p.slug}/index.html`, renderProject({ site, project: p, index: i, next, nextIndex: n }));
  urls.push(`/work/${p.slug}/`);
});

// sitemap with the photos on each page (helps them appear in Google Images)
const pageImages = { '/work/vault/': vault.items.map((v) => ({ src: v.raw, alt: v.a })) };
projects.forEach((p) => {
  if (!p.has_page) return;
  const list = [];
  const add = (src, alt) => { if (src && has(src) && !list.some((x) => x.src === src)) list.push({ src, alt: alt || PHOTO_ALT.get(src) || p.title }); };
  add(p.hero_image, p.hero_alt);
  (p.blocks || []).forEach((b) => { add(b.image, b.alt); (b.images || []).forEach((i) => add(i.image, i.alt)); });
  pageImages[`/work/${p.slug}/`] = list;
});
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map((u) => `  <url><loc>${esc(SITE_URL + u)}</loc>${(pageImages[u] || []).slice(0, 1000).map((im) => `\n    <image:image><image:loc>${esc(SITE_URL + im.src)}</image:loc></image:image>`).join('')}\n  </url>`).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *\nDisallow: /admin/\nSitemap: ${SITE_URL}/sitemap.xml\n`);
write('404.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found — ${esc(site.firm_name)}</title><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png"><link rel="apple-touch-icon" href="/images/apple-touch-icon.png"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@300;500&display=swap"><style>body{margin:0;font-family:'Jost',system-ui,sans-serif;font-weight:300;color:#141414;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;box-sizing:border-box}a{color:#141414}h1{font-weight:500;letter-spacing:-0.03em;font-size:40px;margin:24px 0 12px}</style></head><body><div><a href="/"><img src="/images/logo-dark.png" alt="${esc(site.firm_name)}" style="height:42px"></a><h1>Page not found</h1><p>This page has moved or no longer exists. <a href="/">Go to the home page</a> or <a href="/work/">see our work</a>.</p></div></body></html>`);

console.log(`Built ${urls.length} pages and ${projects.length} projects into _site/`);
