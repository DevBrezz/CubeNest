/**
 * Sync public Minecraft Bedrock resources from CurseForge.
 * Keeps the API key server-side in GitHub Actions secrets.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/data');
const outFile = join(outDir, 'bedrock-curseforge.json');
const API = 'https://api.curseforge.com/v1';
const KEY = process.env.CURSEFORGE_API_KEY || '';
const GAME_CANDIDATES = [432, 69076, 297];
const BEDROCK_CLASS_ID = 4559;
const PAGE_SIZE = 50;
const MAX_RESOURCES = 200;

async function cf(path, params = {}) {
  const url = new URL(API + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'x-api-key': KEY, 'User-Agent': 'CubeNest-Sync/2.0' },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`CurseForge ${response.status} ${url.pathname}${url.search}: ${body.slice(0, 180)}`);
  }
  try { return JSON.parse(body); }
  catch { throw new Error(`CurseForge returned invalid JSON from ${url.pathname}`); }
}

function existingResources() {
  try {
    const old = JSON.parse(readFileSync(outFile, 'utf8'));
    return Array.isArray(old.resources) ? old.resources : [];
  } catch { return []; }
}

async function findGameAndSearch() {
  // Do not treat a successful HTTP response with an empty data array as a valid game ID.
  // Minecraft's CurseForge game ID is tried first; no /categories request is needed.
  let lastError = '';
  for (const gameId of GAME_CANDIDATES) {
    for (const useClass of [true, false]) {
      try {
        const params = { gameId, pageSize: 1, index: 0, sortField: 2, sortOrder: 'desc' };
        if (useClass) params.classId = BEDROCK_CLASS_ID;
        const result = await cf('/mods/search', params);
        const data = Array.isArray(result?.data) ? result.data : [];
        const total = Number(result?.pagination?.totalCount ?? 0);
        if (data.length || total > 0) {
          console.log(`CurseForge search validated: gameId=${gameId}, classId=${useClass ? BEDROCK_CLASS_ID : 'none'}, total=${total || 'unknown'}`);
          return { gameId, classId: useClass ? BEDROCK_CLASS_ID : null, firstPage: result };
        }
        console.warn(`gameId=${gameId}, classId=${useClass ? BEDROCK_CLASS_ID : 'none'} returned zero results; trying next combination.`);
      } catch (error) {
        lastError = error.message || String(error);
        console.warn(`Search failed for gameId=${gameId}, classId=${useClass ? BEDROCK_CLASS_ID : 'none'}: ${lastError}`);
      }
    }
  }
  throw new Error(`No CurseForge search combination returned resources. ${lastError}`.trim());
}

async function main() {
  if (!KEY) throw new Error('Missing GitHub Actions secret CURSEFORGE_API_KEY.');

  const { gameId, classId, firstPage } = await findGameAndSearch();
  const unique = new Map();
  const searches = ['', 'addon', 'add-on', 'map', 'texture', 'shader', 'behavior pack', 'resource pack'];

  function addMods(mods) {
    for (const mod of mods || []) {
      if (!mod?.id || unique.has(mod.id)) continue;
      const files = Array.isArray(mod.latestFiles) ? mod.latestFiles : [];
      const latest = files.find((file) => file?.isAvailable !== false && file?.downloadUrl) ||
        files.find((file) => file?.isAvailable !== false) || null;
      unique.set(mod.id, {
        id: mod.id,
        slug: mod.slug || String(mod.id),
        name: mod.name || 'Untitled resource',
        summary: mod.summary || '',
        downloadCount: mod.downloadCount || 0,
        logo: mod.logo?.thumbnailUrl || mod.logo?.url || null,
        url: mod.links?.websiteUrl || `https://www.curseforge.com/minecraft/mc-mods/${mod.slug || mod.id}`,
        downloadUrl: latest?.downloadUrl || null,
        latestFileId: latest?.id || null,
        fileName: latest?.fileName || null,
        authors: (mod.authors || []).map((author) => author.name).filter(Boolean),
        categories: (mod.categories || []).map((category) => category.name).filter(Boolean),
        source: 'CurseForge',
      });
    }
  }

  addMods(firstPage.data || []);
  // Fetch additional results with search terms; omit categories endpoint entirely.
  for (const term of searches) {
    if (unique.size >= MAX_RESOURCES) break;
    for (let index = 0; index < 200 && unique.size < MAX_RESOURCES; index += PAGE_SIZE) {
      try {
        const params = {
          gameId, pageSize: PAGE_SIZE, index,
          sortField: 2, sortOrder: 'desc',
        };
        if (classId) params.classId = classId;
        if (term) params.searchFilter = term;
        const result = await cf('/mods/search', params);
        const batch = Array.isArray(result?.data) ? result.data : [];
        addMods(batch);
        if (batch.length < PAGE_SIZE) break;
      } catch (error) {
        console.warn(`Search term "${term || '(popular)'}" at index ${index} failed: ${error.message || error}`);
        break;
      }
    }
  }

  const resources = [...unique.values()];
  if (!resources.length) {
    throw new Error('CurseForge returned zero resources; existing catalog was preserved.');
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, JSON.stringify({
    lastSynced: new Date().toISOString(),
    gameId,
    classId,
    source: 'curseforge-api',
    total: resources.length,
    directDownloads: resources.filter((item) => item.downloadUrl).length,
    resources,
  }, null, 2) + '\n');
  console.log(`Wrote ${resources.length} resources; ${resources.filter((item) => item.downloadUrl).length} have direct download URLs.`);
}

main().catch((error) => {
  console.error(`Bedrock sync failed: ${error.message || error}`);
  if (!existsSync(outFile)) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, JSON.stringify({
      lastSynced: null, resources: [], error: 'sync_failed_check_github_actions_logs',
    }, null, 2) + '\n');
  }
  process.exitCode = 1;
});
