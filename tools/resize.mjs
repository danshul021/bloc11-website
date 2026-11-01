// tools/resize.mjs — makes the smaller copies of photos the pages ask for (/r/<width>/images/…).
// Runs in the "Publish website" workflow after build.mjs. Copies made before are kept in .rcache
// (saved between runs), so only new or changed photos are resized.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_PATH || 'sharp');
const listFile = path.join(root, '_site', '.resize.json');
const list = fs.existsSync(listFile) ? JSON.parse(fs.readFileSync(listFile, 'utf8')) : [];
const cache = path.join(root, '.rcache');
let made = 0, reused = 0;

for (const item of list) {
  const [w, src] = item.split('|');
  const from = path.join(root, 'static', src);
  const rel = path.join(w, src.replace(/\.[^.]+$/, '.jpg'));
  const out = path.join(root, '_site', 'r', rel);
  const buf = fs.readFileSync(from);
  const hash = crypto.createHash('md5').update(buf).digest('hex').slice(0, 12);
  const cached = path.join(cache, rel + '.' + hash);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (fs.existsSync(cached)) { fs.copyFileSync(cached, out); reused++; continue; }
  await sharp(buf, { failOn: 'none' }).rotate().resize({ width: Number(w), withoutEnlargement: true })
    .jpeg({ quality: 78, progressive: true, mozjpeg: true }).toFile(out);
  fs.mkdirSync(path.dirname(cached), { recursive: true });
  fs.copyFileSync(out, cached);
  made++;
}
fs.rmSync(listFile, { force: true });
console.log(`Smaller photo copies: ${made} made, ${reused} reused`);
