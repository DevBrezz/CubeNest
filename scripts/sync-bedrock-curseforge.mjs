/**
 * Sync Minecraft Bedrock add-ons from the CurseForge Core API.
 * The API key must stay in GitHub Actions secrets (never VITE_* / browser code).
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/data');
const outFile = join(outDir, 'bedrock-curseforge.json');
const API = 'https://api.curseforge.com/v1';
const KEY = process.env.CURSEFORGE_API_KEY || '';
const MINECRAFT_GAME_ID = 432;
// CurseForge's Minecraft Bedrock Addons class.
const BEDROCK_ADDONS_CLASS_ID = 4559;

async function cf(path, params = {}) {
  const url = new URL(API + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'x-api-key': KEY, 'User-Agent': 'CubeNest-Sync/1.1' },
  });
  const body = await response.text();
  if (!response.ok) {
    const hint = response.status === 401 || response.status === 403
      ? ' Check that CURSEFORGE_API_KEY is the actual API key and that its access is enabled.'
      : '';
    throw new Error(`CurseForge API ${response.status} at ${url.pathname}: ${body.slice(0, 240)}.${hint}`);
  }
  try { return JSON.parse(body); }
  catch { throw new Error(`CurseForge returned invalid JSON from ${url.pathname}`); }
}

async function main() {
  if (!KEY) throw new Error('Missing GitHub Actions secret CURSEFORGE_API_KEY.');

  // Validate both credentials and game access before replacing the catalogue.
  const game = await cf(`/games/${MINECRAFT_GAME_ID}`);
  if (!game?.data?.id) throw new Error(`API key cannot access Minecraft game ${MINECRAFT_GAME_ID}.`);
  console.log(`Authenticated; game=${game.data.name} (${game.data.id})`);

  const unique = new Map();
  const searches = ['', 'addon', 'add-on', 'map', 'texture', 'shader', 'behavior pack', 'resource pack'];
  const pageSize = 50;
  for (const term of searches) {
    // Keep total API work bounded; each search is scoped to the Bedrock Addons class.
    const result = await cf('/mods/search', {
      gameId: MINECRAFT_GAME_ID,
      classId: BEDROCK_ADDONS_CLASS_ID,
      searchFilter: term,
      pageSize,
      index: 0,
      sortField: 2,
      sortOrder: 'desc',
    });
    for (const mod of result.data || []) {
      if (!unique.has(mod.id)) {
        const latest = (mod.latestFiles || []).find((file) => file.downloadUrl) || (mod.latestFiles || [])[0];
        unique.set(mod.id, {
          id: mod.id,
          slug: mod.slug || String(mod.id),
          name: mod.name || 'Untitled resource',
          summary: mod.summary || '',
          downloadCount: mod.downloadCount || 0,
          logo: mod.logo?.thumbnailUrl || mod.logo?.url || null,
          url: mod.links?.websiteUrl || `https://www.curseforge.com/minecraft-bedrock/addons/${mod.slug || mod.id}`,
          // Only use a direct file URL when the API actually provides one.
          downloadUrl: latest?.downloadUrl || null,
          latestFileId: latest?.id || null,
          authors: (mod.authors || []).map((author) => author.name).filter(Boolean),
          categories: (mod.categories || []).map((category) => category.name).filter(Boolean),
          source: 'CurseForge',
        });
      }
    }
  }

  const resources = [...unique.values()];
  if (!resources.length) {
    throw new Error(`CurseForge returned zero Bedrock add-ons for gameId=${MINECRAFT_GAME_ID}, classId=${BEDROCK_ADDONS_CLASS_ID}. Refusing to overwrite the catalogue with an empty result.`);
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, JSON.stringify({
    lastSynced: new Date().toISOString(),
    gameId: MINECRAFT_GAME_ID,
    classId: BEDROCK_ADDONS_CLASS_ID,
    source: 'curseforge-api',
    count: resources.length,
    resources,
  }, null, 2) + '\n');
  console.log(`Wrote ${resources.length} Bedrock resources to ${outFile}; ${resources.filter((item) => item.downloadUrl).length} have direct file URLs.`);
}

main().catch((error) => {
  console.error(`Bedrock sync failed: ${error.message || error}`);
  // Keep the last known-good catalogue; do not create an empty replacement.
  if (!existsSync(outFile)) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, JSON.stringify({ lastSynced: null, resources: [], error: 'sync_failed_check_github_actions_logs' }, null, 2) + '\n');
  }
  process.exitCode = 1;
});
