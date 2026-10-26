// tools/build-js.mjs — bundles React and the interactive pieces (process symbols, process film
// controls, notice board, studio slider, people carousel) into static/assets/app.js.
//
// Only needed when one of the files in tools/components changes. The result is committed, so
// Netlify never has to run this. Usage:  node tools/build-js.mjs
// Needs esbuild, react and react-dom available to Node (set ESBUILD / NODE_PATH if they are not
// installed in this folder).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const esbuild = require(process.env.ESBUILD || 'esbuild');

const ORDER = [
  'ps-kit', 'sym-question', 'sym-decode', 'sym-experiment', 'sym-refine', 'sym-realise',
  'ps-symbol', 'process-panel', 'film-loop', 'ticker', 'office-compare', 'people-carousel',
];

const parts = ORDER.map((n) => `// ---- ${n}.jsx ----\n` + fs.readFileSync(path.join(here, 'components', n + '.jsx'), 'utf8'));

const entry = `
import * as React from 'react';
import { createRoot } from 'react-dom/client';
window.React = React;

${parts.join('\n\n')}

// ---- mounting ----
// Every <div data-c="Name" data-props='{...}'> on the page becomes that component.
// The process symbols take their size from the page width, as in the design:
// 140px on wider screens, a big symbol (up to 300px) on phones.
function pageWidth() {
  const el = document.querySelector('.page');
  return el ? el.getBoundingClientRect().width : window.innerWidth;
}
function AutoSymbol(props) {
  const [w, setW] = React.useState(pageWidth);
  React.useEffect(() => {
    const el = document.querySelector('.page');
    const on = () => setW(pageWidth());
    const ro = window.ResizeObserver && el ? new ResizeObserver(on) : null;
    if (ro) ro.observe(el); else window.addEventListener('resize', on);
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', on); };
  }, []);
  const size = w > 0 && w <= 560 ? Math.round(Math.min(300, w * 0.68)) : 140;
  return React.createElement(window.ProcessSymbol, Object.assign({}, props, { size }));
}
const REG = {
  ProcessSymbol: AutoSymbol,
  ProcessPanel: window.ProcessPanel,
  FilmLoop: window.FilmLoop,
  Ticker: window.Ticker,
  OfficeCompare: window.OfficeCompare,
  PeopleCarousel: window.PeopleCarousel,
};
function mountAll() {
  document.querySelectorAll('[data-c]').forEach((el) => {
    const C = REG[el.getAttribute('data-c')];
    if (!C || el.__mounted) return;
    let props = {};
    try { props = JSON.parse(el.getAttribute('data-props') || '{}'); } catch (e) { console.error(e); }
    el.__mounted = true;
    el.textContent = '';
    createRoot(el).render(React.createElement(C, props));
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
else mountAll();
`;

const tmp = path.join(here, '.entry.gen.jsx');
fs.writeFileSync(tmp, entry);
try {
  await esbuild.build({
    entryPoints: [tmp],
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2019'],
    loader: { '.jsx': 'jsx' },
    jsx: 'transform',
    define: { 'process.env.NODE_ENV': '"production"' },
    nodePaths: (process.env.NODE_PATH || '').split(':').filter(Boolean),
    outfile: path.join(here, '..', 'static', 'assets', 'app.js'),
    legalComments: 'none',
  });
  const kb = Math.round(fs.statSync(path.join(here, '..', 'static', 'assets', 'app.js')).size / 1024);
  console.log('static/assets/app.js', kb + ' KB');
} finally {
  fs.unlinkSync(tmp);
}
