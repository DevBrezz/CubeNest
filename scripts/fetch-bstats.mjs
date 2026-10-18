import { mkdir, writeFile } from 'node:fs/promises';

const plugins = [
  { id: 34529, name: 'CostumeEnchant', url: 'https://bstats.org/plugin/bukkit/CostumeEnchant/34529' },
  { id: 34146, name: 'ClaimCore', url: 'https://bstats.org/plugin/bukkit/ClaimCore/34146' },
  { id: 34226, name: 'EcoSMP', url: 'https://bstats.org/plugin/bukkit/EcoSMP/34226' },
  { id: 34510, name: 'DonutSUS', url: 'https://bstats.org/plugin/bukkit/DonutSUS/34510' },
];

async function json(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'KingBrezzPortfolio/1.1' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

function chartEntries(charts) {
  if (Array.isArray(charts)) return charts.map((chart, i) => [String(chart?.id ?? chart?.uid ?? i), chart]);
  if (charts && typeof charts === 'object') return Object.entries(charts);
  return [];
}

function findChart(charts, names) {
  const entries = chartEntries(charts);
  for (const name of names) {
    const found = entries.find(([key, chart]) =>
      key.toLowerCase() === name || String(chart?.title ?? '').toLowerCase() === name ||
      String(chart?.name ?? '').toLowerCase() === name ||
      String(chart?.uid ?? chart?.id ?? '') === name
    );
    if (found) return found;
  }
  return entries.find(([key, chart]) => `${key} ${chart?.title ?? ''} ${chart?.name ?? ''}`.toLowerCase().includes(names[0]));
}

function points(data) {
  const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.values) ? data.values : [];
  return rows.flatMap(row => {
    if (!Array.isArray(row) || row.length < 2) return [];
    const timestamp = Number(row[0]);
    const value = Number(row[1]);
    if (!Number.isFinite(timestamp) || !Number.isFinite(value)) return [];
    // bStats REST timestamps are milliseconds since epoch.
    return [{ timestamp: timestamp < 100000000000 ? timestamp * 1000 : timestamp, value }];
  }).slice(-60);
}

async function collect(plugin) {
  const base = { ...plugin, players: null, servers: null, playerHistory: [], serverHistory: [], error: null };
  try {
    const details = await json(`https://bstats.org/api/v1/plugins/${plugin.id}`);
    const charts = details?.charts ?? await json(`https://bstats.org/api/v1/plugins/${plugin.id}/charts`);
    const playerEntry = findChart(charts, ['players', 'players on servers']);
    const serverEntry = findChart(charts, ['servers', 'servers using']);
    const errors = [];

    async function getHistory(entry, label) {
      const chart = entry?.[1];
      const chartId = chart?.uid ?? chart?.id ?? entry?.[0];
      if (chartId === undefined || chartId === null || chartId === '') {
        errors.push(`${label} chart not found`);
        return [];
      }
      try {
        return points(await json(`https://bstats.org/api/v1/plugins/${plugin.id}/charts/${encodeURIComponent(chartId)}/data?maxElements=60`));
      } catch (error) {
        errors.push(`${label}: ${String(error?.message ?? error)}`);
        return [];
      }
    }

    const [playerHistory, serverHistory] = await Promise.all([
      getHistory(playerEntry, 'players'), getHistory(serverEntry, 'servers'),
    ]);
    base.playerHistory = playerHistory;
    base.serverHistory = serverHistory;
    base.players = playerHistory.length ? playerHistory[playerHistory.length - 1].value : null;
    base.servers = serverHistory.length ? serverHistory[serverHistory.length - 1].value : null;
    if (base.players === null && base.servers === null) {
      base.error = errors.length ? errors.join('; ') : 'bStats returned no public chart samples';
    }
  } catch (error) {
    base.error = String(error?.message ?? error);
  }
  return base;
}

const result = await Promise.all(plugins.map(collect));
await mkdir('public/data', { recursive: true });
await writeFile('public/data/bstats.json', JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'https://bstats.org/docs/rest-api', plugins: result }, null, 2) + '\n');
console.log(`Wrote public/data/bstats.json for ${result.length} plugins`);
for (const p of result) console.log(`${p.name}: players=${p.players ?? 'unavailable'}, servers=${p.servers ?? 'unavailable'}${p.error ? ` (${p.error})` : ''}`);
