# Fix 404 + Plugins not loading (CubeNest)

## Root cause

GitHub Pages was serving **source files** (`index.html` with `/src/main.tsx`) instead of the **Vite build** (`dist/` with real JS bundles).

Symptoms:
- White page / broken app
- GitHub "File not found" 404 after enabling HTTPS / custom domain
- `/data/resources.json` → 404 → **Plugins page empty**
- `/plugins` deep link → 404 (no SPA fallback)

## Fix on GitHub (required)

1. Open repo **DevBrezz/CubeNest**
2. **Settings → Pages**
3. Under **Build and deployment → Source**, choose:
   - **GitHub Actions**  
   - NOT "Deploy from a branch"
4. If you previously used "Deploy from a branch" (main / root), switch it off.
5. **Custom domain**: `cubenest.sytes.net`
6. Wait for DNS check, then enable **Enforce HTTPS**
7. Open **Actions** → run workflow **Deploy to GitHub Pages** → wait until green

## After deploy, verify

Open these URLs (should NOT 404):

- https://cubenest.sytes.net/
- https://cubenest.sytes.net/data/resources.json
- https://cubenest.sytes.net/plugins

In browser View Source of homepage, you should see something like:

```html
<script type="module" crossorigin src="/assets/index-xxxxx.js"></script>
```

NOT:

```html
<script type="module" src="/src/main.tsx"></script>
```

## DNS (No-IP / sytes.net)

CNAME record:

```
cubenest.sytes.net  →  devbrezz.github.io
```

(Replace with your actual GitHub username if different. For project pages it may be `devbrezz.github.io` with path, but custom domains point at the Pages host.)

Also ensure repo file `CNAME` contains exactly:

```
cubenest.sytes.net
```

## Local build test

```bash
npm install
npm run build
# dist/index.html must exist and must NOT contain src/main.tsx
# dist/data/resources.json must exist
npm run preview
```
