# CubeNest — Minecraft community platform

CubeNest is a dark, cyan-accented Minecraft discovery frontend for server listings, Java/Bedrock resources, and Java server plugins. It retains the repository’s existing Modrinth/Spigot resource data and CurseForge creator sync.

## Local development

Requires Node.js 20+ and npm.

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The build requires the dependencies in `package.json` to be installed. The project archive supplied for this patch did not include `node_modules` or a lockfile; dependency installation could not finish in the editing environment, so a successful build has **not** been verified here. Run the command locally or in CI and commit a generated lockfile for reproducible installs.

## Existing resource synchronization

- `npm run sync` — existing Modrinth/Spigot catalogue sync.
- `npm run sync:curseforge` — best-effort public creator-page sync for https://www.curseforge.com/members/kingbrezzx/projects.
- `.github/workflows/sync-resources.yml` runs both scripts on a schedule and commits changed JSON.

CurseForge sync is HTML parsing rather than a guaranteed API integration; the script intentionally preserves the last known good catalogue if it cannot detect cards. Check the workflow logs and `public/data/curseforge.json` before claiming a sync succeeded. For durable production sync, use an official/authorized API where available and keep API keys in GitHub Actions Secrets, never in frontend code.

## Deployment notes

The existing GitHub Pages workflow is preserved. GitHub Pages is a static host: it cannot accept uploads, run a database, authenticate moderators, or safely store uploaded files. The Upload Center will clearly report that no upload API is configured unless `VITE_CUBENEST_UPLOAD_API` is set, and it must be paired with a separately deployed, secured API before submissions can work. Setting the URL alone is not a security review.

### Required production backend before enabling uploads

Use a server-side API and database/object storage (for example PostgreSQL plus private object storage). Enforce authentication and role-based moderator access server-side; request size/rate limits; extension, MIME, magic-byte and archive-path validation; malware scanning/quarantine; licence checks; private storage while Pending; explicit Approved/Rejected moderation; audit logs; and safe download headers. Do not serve unreviewed uploads from the public origin. Keep credentials in the hosting provider’s secret manager. The current frontend does not implement those backend controls and does not claim that upload, accounts, admin moderation, or public server submissions are operational.

## Routes

- `/` — CubeNest portal
- `/servers` — searchable/filterable server directory (empty until verified listings are configured)
- `/resources` and `/mods` — resource catalogue
- `/plugins` — Spigot/Java plugin catalogue
- `/resource/:id` — resource detail view
- `/search` — searchable catalogue
- `/upload` — upload metadata form; submission requires the secure API described above
- `/dashboard`, `/admin`, `/creators`, `/terms`, `/privacy`, `/report` — platform information/status pages

Server status and player counts are not fabricated. The directory currently has no validated server dataset or status provider.
