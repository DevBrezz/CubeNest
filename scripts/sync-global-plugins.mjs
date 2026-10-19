import { mkdir, readFile, writeFile } from 'node:fs/promises';

const outputDir = new URL('../public/data/', import.meta.url);
await mkdir(outputDir, { recursive: true });

async function fetchJson(url, label) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'CubeNest-resource-sync/1.2 (+https://github.com)',
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  return response.json();
}

function records(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  // Poggit's documented endpoints return arrays, but some aliases/mirrors wrap them.
  for (const key of ['plugins', 'releases', 'data', 'results', 'items', 'resources']) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
  }

  const values = Object.values(payload).filter((value) => value && typeof value === 'object');
  return values;
}

function isPoggitRecord(item) {
  if (!item || typeof item !== 'object') return false;
  // Accept both plugin-level records and release/version-level records.
  return Boolean(
    item.name || item.plugin_name || item.project_name || item.title || item.slug ||
    item.project_id || item.id || item.versions || item.version_name
  );
}

function isSpigetRecord(item) {
  return Boolean(item && typeof item === 'object' && item.id != null && item.name);
}

function valid(list, provider) {
  return list.filter(provider === 'poggit' ? isPoggitRecord : isSpigetRecord);
}

async function readPrevious(filename) {
  try {
    const value = JSON.parse(await readFile(new URL(filename, outputDir), 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function syncProvider({ label, filename, urls, provider }) {
  const previous = await readPrevious(filename);
  let lastError = 'No endpoints configured';

  for (const url of urls) {
    try {
      const payload = await fetchJson(url, label);
      const list = valid(records(payload), provider);
      if (!list.length) {
        const shape = Array.isArray(payload) ? 'array' : payload === null ? 'null' : typeof payload;
        throw new Error(`Endpoint returned no recognizable records (payload type: ${shape})`);
      }
      await writeFile(new URL(filename, outputDir), `${JSON.stringify(list, null, 2)}\n`);
      console.log(`${label}: saved ${list.length} records from ${url}`);
      return { label, count: list.length, cached: false };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`${label} endpoint failed (${url}): ${lastError}`);
    }
  }

  if (previous.length) {
    console.warn(`${label}: retaining ${previous.length} previously synced records; refusing to overwrite them with an empty catalogue.`);
    return { label, count: previous.length, cached: true };
  }

  // Don't fail the entire workflow just because one provider is offline; keep the error explicit.
  console.error(`${label}: no catalogue was saved. Last error: ${lastError}`);
  return { label, count: 0, cached: false, error: lastError };
}

const results = await Promise.all([
  syncProvider({
    label: 'Poggit',
    filename: 'poggit-plugins.json',
    provider: 'poggit',
    // These aliases are documented by Poggit. Prefer minimized output for the static cache.
    urls: [
      'https://poggit.pmmp.io/plugins.min.json',
      'https://poggit.pmmp.io/releases.min.json',
      'https://poggit.pmmp.io/plugins.json',
      'https://poggit.pmmp.io/releases.json',
    ],
  }),
  syncProvider({
    label: 'Spiget',
    filename: 'spigot-plugins.json',
    provider: 'spigot',
    urls: [
      'https://api.spiget.org/v2/resources?size=100&sort=-downloads',
      'https://api.spiget.org/v2/resources?size=100',
    ],
  }),
]);

for (const result of results) {
  if (result.error) console.warn(`${result.label} cache remains unavailable; frontend fallback will show its diagnostic message.`);
}
console.log(`Global catalogue sync finished: ${results.map((r) => `${r.label}=${r.count}${r.cached ? ' (cached)' : ''}`).join(', ')}`);
