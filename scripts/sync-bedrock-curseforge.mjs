/** Sync public Minecraft Bedrock projects from CurseForge. API key is server-side only. */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/data');
const outFile = join(outDir, 'bedrock-curseforge.json');
const API = 'https://api.curseforge.com/v1';
const KEY = process.env.CURSEFORGE_API_KEY || '';
const GAME_CANDIDATES = [69076, 432, 297];
const PAGE_SIZE = 50;
const MAX_PER_CATEGORY = 250;

async function cf(path, params = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { Accept: 'application/json', 'x-api-key': KEY, 'User-Agent': 'CubeNest-Sync/1.0' } });
  const body = await res.text();
  if (!res.ok) throw new Error(`CurseForge ${res.status} ${path}: ${body.slice(0, 180)}`);
  return JSON.parse(body);
}

function bucketFor(name = '') {
  const n = name.toLowerCase();
  if (n.includes('texture') || n.includes('resource pack')) return 'textures';
  if (n.includes('map') || n.includes('world') || n.includes('save')) return 'maps';
  if (n.includes('skin')) return 'skins';
  if (n.includes('shader')) return 'shaders';
  if (n.includes('addon') || n.includes('add-on') || n.includes('mod')) return 'addons';
  return 'other';
}

async function resolveGameId() {
  for (const id of GAME_CANDIDATES) {
    try {
      const r = await cf('/mods/search', { gameId: id, pageSize: 1, index: 0 });
      if (Array.isArray(r.data)) return id;
    } catch (e) { console.warn(`gameId ${id}: ${e.message}`); }
  }
  throw new Error('No supported CurseForge gameId responded successfully');
}

async function getClasses(gameId) {
  const r = await cf('/categories', { gameId, classesOnly: true });
  return (r.data || []).map(c => ({ id: c.id, name: c.name, bucket: bucketFor(c.name) }));
}

async function searchPage(gameId, classId, index) {
  return cf('/mods/search', { gameId, classId, pageSize: PAGE_SIZE, index, sortField: 2, sortOrder: 'desc' });
}

async function getBestFile(mod) {
  const latest = Array.isArray(mod.latestFiles) ? mod.latestFiles.find(f => f.isAvailable !== false && (f.downloadUrl || f.id)) : null;
  const indexed = (mod.latestFilesIndexes || []).find(f => f.fileId);
  const fileId = latest?.id || indexed?.fileId || mod.mainFileId || null;
  let downloadUrl = latest?.downloadUrl || null;
  let fileName = latest?.fileName || latest?.displayName || null;
  // Resolve a direct CDN URL on the server when CurseForge's search payload omits it.
  if (fileId && !downloadUrl) {
    try {
      const file = await cf(`/mods/${mod.id}/files/${fileId}`);
      downloadUrl = file.data?.downloadUrl || null;
      fileName = file.data?.fileName || fileName;
    } catch (e) { console.warn(`file metadata unavailable for mod ${mod.id}: ${e.message}`); }
  }
  return { fileId, downloadUrl, fileName };
}

async function main() {
  if (!KEY) throw new Error('Missing CURSEFORGE_API_KEY GitHub Actions secret');
  const gameId = await resolveGameId();
  let classes = [];
  try { classes = await getClasses(gameId); } catch (e) { console.warn(`Could not load classes: ${e.message}`); }
  const classList = classes.filter(c => c.bucket !== 'other');
  if (!classList.length) {
    // Still allow generic projects but mark them honestly; UI filtering uses resource categories.
    classList.push({ id: null, name: 'All Bedrock resources', bucket: 'addons' });
  }

  const map = new Map();
  for (const cls of classList) {
    for (let index = 0; index < MAX_PER_CATEGORY; index += PAGE_SIZE) {
      const response = await searchPage(gameId, cls.id, index);
      const batch = response.data || [];
      for (const m of batch) {
        if (!m?.id) continue;
        const names = (m.categories || []).map(c => c.name).filter(Boolean);
        const className = cls.name || '';
        const bucket = bucketFor(className) !== 'other' ? bucketFor(className) : (names.map(bucketFor).find(x => x !== 'other') || bucketFor(m.name));
        const existing = map.get(m.id);
        const record = {
          id: m.id, slug: m.slug || String(m.id), name: m.name || 'Untitled resource',
          summary: m.summary || '', downloadCount: m.downloadCount || 0,
          logo: m.logo?.thumbnailUrl || m.logo?.url || null,
          url: m.links?.websiteUrl || `https://www.curseforge.com/minecraft-bedrock/${bucket}/${m.slug}`,
          authors: (m.authors || []).map(a => a.name).filter(Boolean), categories: names,
          category: bucket, categoryLabel: className || names[0] || 'Bedrock resource',
          classId: m.classId ?? cls.id ?? null,
          allowModDistribution: m.allowModDistribution ?? null,
          fileId: null, fileName: null, downloadUrl: null,
          updated: m.dateModified || m.dateReleased || null,
          mainFileId: m.mainFileId || null, latestFiles: m.latestFiles || [], latestFilesIndexes: m.latestFilesIndexes || [],
        };
        if (!existing) map.set(m.id, record);
        else if (existing.category === 'other' && bucket !== 'other') map.set(m.id, record);
      }
      if (batch.length < PAGE_SIZE) break;
    }
  }

  const resources = [...map.values()].sort((a, b) => b.downloadCount - a.downloadCount);
  // Resolve latest files in small batches; never expose the API key to the browser.
  for (let i = 0; i < resources.length; i += 5) {
    await Promise.all(resources.slice(i, i + 5).map(async item => {
      const source = map.get(item.id);
      const file = await getBestFile(source || item);
      item.fileId = file.fileId;
      item.fileName = file.fileName;
      item.downloadUrl = file.downloadUrl;
      delete item.mainFileId; delete item.latestFiles; delete item.latestFilesIndexes;
    }));
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, JSON.stringify({ lastSynced: new Date().toISOString(), gameId, source: 'CurseForge API', total: resources.length, categories: classes, resources }, null, 2));
  const direct = resources.filter(r => r.downloadUrl).length;
  console.log(`Wrote ${resources.length} resources; ${direct} have direct download URLs.`);
  if (!resources.length) throw new Error('CurseForge returned zero resources; existing catalog should not be replaced');
}

main().catch(error => {
  console.error(error?.stack || error);
  // Preserve the last good catalogue on any API/auth/network error.
  if (!existsSync(outFile)) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, JSON.stringify({ lastSynced: null, resources: [], error: String(error?.message || error) }, null, 2));
  }
  process.exit(1);
});
