import { mkdir, writeFile } from 'node:fs/promises';

const outputDir = new URL('../public/data/', import.meta.url);
await mkdir(outputDir, { recursive: true });

async function fetchJson(url, label) {
  const response = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'CubeNest-resource-sync/1.0' }, signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  return response.json();
}

async function save(name, data) {
  await writeFile(new URL(name, outputDir), `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Saved ${name}: ${Array.isArray(data) ? data.length : Object.keys(data ?? {}).length} records`);
}

// The static snapshots are a fallback for browsers where the upstream host blocks CORS.
// They are refreshed by GitHub Actions and never contain fabricated records.
try {
  const poggit = await fetchJson('https://poggit.pmmp.io/plugins.json', 'Poggit');
  const list = Array.isArray(poggit) ? poggit : Array.isArray(poggit.plugins) ? poggit.plugins : Array.isArray(poggit.data) ? poggit.data : Object.values(poggit ?? {});
  if (!list.some((x) => x && typeof x === 'object' && (x.id || x.name))) throw new Error('Poggit payload did not contain plugin records');
  await save('poggit-plugins.json', list);
} catch (error) {
  console.error(`Poggit sync failed: ${error.message}`);
  // Keep the scheduled sync alive so the other provider can still refresh.
}

try {
  const spigot = await fetchJson('https://api.spiget.org/v2/resources?size=100&sort=-downloads', 'Spiget');
  if (!Array.isArray(spigot) || !spigot.some((x) => x && x.id && x.name)) throw new Error('Spiget payload did not contain resource records');
  await save('spigot-plugins.json', spigot);
} catch (error) {
  console.error(`Spiget sync failed: ${error.message}`);
  // Keep the scheduled sync alive so the other provider can still refresh.
}
