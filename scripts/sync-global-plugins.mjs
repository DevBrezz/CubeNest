import { mkdir, readFile, writeFile } from 'node:fs/promises';

const outputDir = new URL('../public/data/', import.meta.url);
await mkdir(outputDir, { recursive: true });

async function fetchJson(url, label) {
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'CubeNest-resource-sync/1.1 (+https://github.com)' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  return response.json();
}

function records(payload, provider) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const keys = provider === 'poggit' ? ['plugins', 'data', 'results', 'items', 'resources'] : ['resources', 'data', 'results', 'items'];
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
  }
  return Object.values(payload).filter((value) => value && typeof value === 'object');
}

function valid(list, provider) {
  return list.filter((item) => item && typeof item === 'object' &&
    (provider === 'poggit' ? (item.name || item.id || item.plugin_name || item.slug) : (item.id && item.name)));
}

async function readPrevious(filename) {
  try { return JSON.parse(await readFile(new URL(filename, outputDir), 'utf8')); }
  catch { return []; }
}

async function syncProvider({ label, filename, urls, provider }) {
  const previous = await readPrevious(filename);
  let lastError = 'No endpoints configured';
  for (const url of urls) {
    try {
      const payload = await fetchJson(url, label);
      const list = valid(records(payload, provider), provider);
      if (!list.length) throw new Error('Endpoint returned no recognizable records');
      await writeFile(new URL(filename, outputDir), `${JSON.stringify(list, null, 2)}\n`);
      console.log(`${label}: saved ${list.length} real records from ${url}`);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`${label} endpoint failed (${url}): ${lastError}`);
    }
  }
  if (previous.length) {
    console.warn(`${label}: retaining ${previous.length} previously synced records; refusing to overwrite with an empty catalogue.`);
    return;
  }
  throw new Error(`${label} sync failed and no previous non-empty snapshot exists: ${lastError}`);
}

const tasks = [
  syncProvider({ label: 'Poggit', filename: 'poggit-plugins.json', provider: 'poggit', urls: ['https://poggit.pmmp.io/plugins.json?api=1', 'https://poggit.pmmp.io/plugins.json'] }),
  syncProvider({ label: 'Spiget', filename: 'spigot-plugins.json', provider: 'spigot', urls: ['https://api.spiget.org/v2/resources?size=100&sort=-downloads', 'https://api.spiget.org/v2/resources?size=100'] }),
];
const results = await Promise.allSettled(tasks);
const failures = results.filter((result) => result.status === 'rejected');
for (const failure of failures) console.error(failure.reason);
if (failures.length === results.length) process.exitCode = 1;
