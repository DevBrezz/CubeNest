/**
 * Fetch Bedrock addons from CurseForge API (server-side only).
 * Usage: CURSEFORGE_API_KEY=xxx node scripts/sync-bedrock-curseforge.mjs
 * Writes public/data/bedrock-curseforge.json
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/data');
const outFile = join(outDir, 'bedrock-curseforge.json');
const API = 'https://api.curseforge.com/v1';
const KEY = process.env.CURSEFORGE_API_KEY || process.env.VITE_CURSEFORGE_API_KEY || '';

// Try common game IDs for Minecraft Bedrock on CurseForge
const GAME_CANDIDATES = [69076, 432, 297];

async function cf(path, params = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-api-key': KEY,
      'User-Agent': 'CubeNest-Sync/1.0',
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`CurseForge ${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

async function resolveGameId() {
  for (const id of GAME_CANDIDATES) {
    try {
      const r = await cf('/mods/search', { gameId: id, pageSize: 1, index: 0 });
      if (r?.data) {
        console.log(`Using gameId=${id} (${r.pagination?.totalCount ?? '?'} total)`);
        return id;
      }
    } catch (e) {
      console.warn(`gameId ${id} failed:`, e.message);
    }
  }
  throw new Error('No working CurseForge gameId');
}

async function main() {
  if (!KEY || KEY.includes('your_')) {
    console.error('Set CURSEFORGE_API_KEY or VITE_CURSEFORGE_API_KEY');
    // Keep previous file if any
    if (!existsSync(outFile)) {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(outFile, JSON.stringify({ lastSynced: null, gameId: null, resources: [], error: 'missing_api_key' }, null, 2));
    }
    process.exit(0);
  }

  const gameId = await resolveGameId();
  const resources = [];
  const pageSize = 50;
  // First pages of popular + a few search seeds for variety
  const queries = ['', 'addon', 'map', 'texture', 'shader'];

  for (const q of queries) {
    for (let index = 0; index < 100 && resources.length < 200; index += pageSize) {
      const r = await cf('/mods/search', {
        gameId,
        searchFilter: q,
        pageSize,
        index,
        sortField: 2,
        sortOrder: 'desc',
      });
      const batch = r.data || [];
      for (const m of batch) {
        if (resources.some((x) => x.id === m.id)) continue;
        resources.push({
          id: m.id,
          slug: m.slug,
          name: m.name,
          summary: m.summary || '',
          downloadCount: m.downloadCount || 0,
          logo: m.logo?.thumbnailUrl || m.logo?.url || null,
          url: m.links?.websiteUrl || `https://www.curseforge.com/minecraft-bedrock/addons/${m.slug}`,
          // CurseForge includes recent files on many search results. Use a publisher-provided
          // direct URL when present; never guess a CDN URL or expose the API key in the client.
          downloadUrl: m.latestFiles?.find((file) => file.isAvailable !== false && file.downloadUrl)?.downloadUrl || null,
          fileName: m.latestFiles?.find((file) => file.isAvailable !== false && file.downloadUrl)?.fileName || null,
          authors: (m.authors || []).map((a) => a.name),
          categories: (m.categories || []).map((c) => c.name),
        });
      }
      if (batch.length < pageSize) break;
      if (!q && index >= 50) break; // limit empty query
    }
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    outFile,
    JSON.stringify(
      {
        lastSynced: new Date().toISOString(),
        gameId,
        source: 'curseforge-api',
        resources,
      },
      null,
      2
    )
  );
  console.log(`Wrote ${resources.length} Bedrock resources → ${outFile}`);
}

main().catch((e) => {
  console.error(e.message || e);
  // Do not wipe existing good data
  if (!existsSync(outFile)) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, JSON.stringify({ lastSynced: null, resources: [], error: String(e.message || e) }, null, 2));
  }
  process.exit(1);
});
