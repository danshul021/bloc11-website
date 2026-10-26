# bloc11.studio

Website of Bloc 11 Architects + Planners.

## Editing the site

Go to **https://bloc11.studio/admin/** and log in with GitHub. Change anything, press **Publish**, and the live site updates about a minute later.

- **Projects** — add, edit or remove projects. Switch on *Give it its own page* to get a project page built from its pictures and text.
- **Pages** — the words and pictures on the Home, Studio and Work pages, the numbers, the process steps and the people.
- **Site-wide** — notice board messages, capabilities, contact details and addresses.

Tips: put an empty line between paragraphs, and `**two stars**` around words to make them bold.

## How it is built

- `content/` — everything the admin page edits (JSON files, one per project in `content/projects/`).
- `templates/` — the page designs.
- `static/` — images, the film, scripts and the admin page, copied to the site as they are.
- `build.mjs` — writes the finished site into `_site/`. Netlify runs `node build.mjs`; no packages are needed.
- `tools/` — the interactive pieces (process symbols, film, notice board, studio slider, people carousel). If one of `tools/components/*.jsx` changes, run `node tools/build-js.mjs` (needs `esbuild`, `react` and `react-dom`) and commit the new `static/assets/app.js`.

To preview locally: `node build.mjs`, then serve `_site/` with any static server.
