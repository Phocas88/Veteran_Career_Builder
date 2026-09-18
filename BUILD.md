# Build

The in-app tools (`app.html`) load **`app.bundle.js`**, which is generated from
**`app.js`** (React written with JSX) by esbuild. `app.bundle.js` is committed to
the repo because the live site is served statically (GitHub Pages / Firebase Hosting)
with no build step at serve time.

## If you edit `app.js`, you MUST rebuild

```bash
npm ci        # first time only (installs the pinned esbuild)
npm run build # regenerates app.bundle.js from app.js
git add app.js app.bundle.js
```

Then commit **both** files together.

## Guardrail

CI (`.github/workflows/deploy.yml`, `quality` job) rebuilds `app.bundle.js` and fails
the check if it differs from what's committed — so a stale bundle can't reach production.
Run `npm run build:check` locally to reproduce that check.

esbuild is pinned in `package.json` (and `package-lock.json`) so local and CI builds
match byte-for-byte. `app.bundle.js` line endings are pinned to LF via `.gitattributes`.
