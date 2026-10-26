// Studio page (profile, people, capabilities, contact)
import { esc, rich, paras, cdn, img, page, mount, mnav, capabilities, contact, footer, MNAV_CSS, CAPS_CSS, CONTACT_CSS } from './lib.mjs';

const CSS = `
body{margin:0;background:#FFFFFF}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
a{color:#0E0E0E;text-decoration:none}
a:hover{color:#A5532F}
.nav a[aria-current]{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
:focus-visible{outline:2px solid #A5532F;outline-offset:2px}
${CONTACT_CSS}
/* ---- phones ---- */
@container page (max-width: 640px){
.hnav{align-items:flex-start !important;width:100%}
.sub{flex-wrap:nowrap !important;justify-content:flex-start !important;overflow-x:auto;width:100%;border-top:1px solid #E2DED7;padding-top:6px;scrollbar-width:none}
.sub::-webkit-scrollbar{display:none}
.sub a{white-space:nowrap}
}
${CAPS_CSS}
.sub a{color:#6B6760}.sub a:hover{color:#0E0E0E}.sub a[aria-current]{color:#0E0E0E}
${MNAV_CSS}
`;

const H2 = 'flex: 1 1 260px; margin: 0; font-size: clamp(30px, 3cqw, 44px); line-height: 1; font-weight: 500; letter-spacing: -0.035em';
const LEAD = 'flex: 2 1 560px; margin: 0; font-size: clamp(20px, 1.9cqw, 26px); line-height: 1.4; max-width: 34em';
const BODY = 'font-size: clamp(17px, 1.4cqw, 19px); line-height: 1.55; color: #2A2724';

export function renderStudio({ site, studio }) {
  const people = (studio.people || []).filter((p) => p.name).map((p) => ({ img: p.photo ? cdn(p.photo, 600) : '', name: p.name, role: p.role || '', edu: p.qualifications || '' }));
  const body = `
  <!-- HEADER -->
  <header style="border-bottom: 1px solid #E2DED7">
    <div style="max-width: 1440px; margin: 0 auto; box-sizing: border-box; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px 24px; padding: 28px clamp(16px, 4cqw, 56px) 20px">
      <a href="/" aria-label="${esc(site.firm_name)} — home" style="display: block; line-height: 0">
        <img src="/images/logo-dark.png" alt="${esc(site.firm_name)}" style="height: 42px; width: auto">
      </a>
      ${mnav([['/work/', 'Work'], ['/studio/', 'Studio'], ['#contact', 'Contact']], '#0E0E0E')}
      <div class="hnav" style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px">
        <nav class="nav mainnav" aria-label="Main" style="display: flex; gap: 32px; font-size: 13px; font-weight: 600; letter-spacing: 0.2em">
          <a href="/work/" style="padding: 12px 0">Work</a>
          <a href="/studio/" aria-current="page" style="padding: 12px 0">Studio</a>
          <a href="#contact" style="padding: 12px 0">Contact</a>
        </nav>
        <nav class="sub" aria-label="Studio" style="display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px 22px; font-size: 14px; font-weight: 400">
          <a href="#profile" aria-current="true" style="padding: 8px 0">Profile</a>
          <a href="#people" style="padding: 8px 0">People</a>
          <a href="#capabilities" style="padding: 8px 0">Capabilities</a>
        </nav>
      </div>
    </div>
  </header>

  <main style="max-width: 1440px; margin: 0 auto; box-sizing: border-box; padding: 0 clamp(16px, 4cqw, 56px) clamp(80px, 9cqw, 140px); display: flex; flex-direction: column; gap: clamp(72px, 8cqw, 120px)">

    <!-- PROFILE -->
    <section id="profile" style="display: flex; flex-wrap: wrap; align-items: stretch; gap: 40px 72px; padding-top: clamp(40px, 5cqw, 72px)">
      <div style="flex: 1.5 1 480px; position: relative; aspect-ratio: 4 / 5; max-height: 980px; overflow: hidden; background: #ECE8E1">
        <img ${img(studio.profile_image, { widths: [800, 1400], sizes: '(max-width: 900px) 100vw, 60vw' })} alt="${esc(studio.profile_image_alt)}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 40%; display: block">
        <h1 style="position: absolute; left: clamp(16px, 2.4cqw, 32px); bottom: clamp(16px, 2.4cqw, 32px); margin: 0; padding: 10px 22px 14px; background: #FFFFFF; font-size: clamp(40px, 5.2cqw, 72px); font-weight: 500; letter-spacing: -0.045em; line-height: 0.94">Profile</h1>
      </div>
      <div style="flex: 1 1 360px; display: flex; flex-direction: column; justify-content: flex-end; gap: 22px; padding-bottom: 8px">
        <p style="margin: 0; font-size: clamp(26px, 2.4cqw, 36px); line-height: 1.08; font-weight: 500; letter-spacing: -0.03em">${esc(studio.lead)}${studio.lead_accent ? ` <span style="color: #A5532F">${esc(studio.lead_accent)}</span>` : ''}</p>
        <div style="display: flex; flex-direction: column; gap: 16px; ${BODY}; max-width: 36em">
          ${studio.intro ? `<p style="margin: 0; ${BODY}; font-weight: 500; color: #0E0E0E">${rich(studio.intro)}</p>` : ''}
${paras(studio.body).map((p) => `          <p style="margin: 0">${rich(p)}</p>`).join('\n')}
        </div>
      </div>
    </section>

    <!-- PEOPLE -->
    <section id="people" style="display: flex; flex-direction: column; gap: 32px">
      <div style="display: flex; flex-wrap: wrap; gap: 24px 72px; border-top: 1px solid #0E0E0E; padding-top: 24px">
        <h2 style="${H2}">People</h2>
        <p style="${LEAD}">${rich(studio.people_text)}</p>
      </div>
      ${mount('PeopleCarousel', { people }, `<ul style="list-style: none; margin: 0; padding: 0; min-height: 420px; display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; align-content: center">${people.map((p) => `<li style="font-size: 16px; font-weight: 500">${esc(p.name)} <span style="font-weight: 300; color: #6B6760">· ${esc(p.role)}</span></li>`).join('')}</ul>`)}
    </section>

    <!-- CAPABILITIES -->
    <section id="capabilities" style="display: flex; flex-direction: column; gap: 32px">
      <div style="display: flex; flex-wrap: wrap; gap: 24px 72px; border-top: 1px solid #0E0E0E; padding-top: 24px">
        <h2 style="${H2}">Capabilities</h2>
        <p style="${LEAD}">${rich(studio.capabilities_text)}</p>
      </div>
      ${capabilities(site.capabilities || [])}
    </section>

    <!-- CONTACT -->
    <section id="contact" style="display: flex; flex-direction: column; gap: 40px">
${contact(site, `<div style="display: flex; flex-wrap: wrap; gap: 24px 72px; border-top: 1px solid #0E0E0E; padding-top: 24px">
      <h2 style="${H2}">Contact</h2>
      <p style="${LEAD}">${rich(site.contact_text)}</p>
    </div>`)}
    </section>
  </main>

${footer(site, { emblemHref: '/', emblemLabel: 'Bloc 11 — back to the home page', contactHref: '#contact' })}`;

  return page({
    title: `Studio — ${site.firm_name}`,
    description: `${studio.lead} ${studio.lead_accent} ${studio.intro}`.trim(),
    path: '/studio/',
    css: CSS,
    body,
    image: studio.profile_image || undefined,
    ticker: true,
  });
}
