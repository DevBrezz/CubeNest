/**
 * Sync Spigot (Spiget) and PocketMine (Lemehost / Poggit mirror) catalogues
 * into public/data for offline fallback on the Plugins page.
 *
 * Official poggit.pmmp.io JSON endpoints redirect to the GitHub release-archive
 * and no longer return release records. Catalogue data is therefore scraped
 * from https://lemehost.com/poggit/index as requested.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const outputDir = new URL('../public/data/', import.meta.url);
await mkdir(outputDir, { recursive: true });

const UA = 'CubeNest-resource-sync/1.3 (+https://github.com)';
const LEMEHOST_INDEX = 'https://lemehost.com/poggit/index';
const MAX_LEME_PAGES = 15;

async function fetchText(url, label) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json',
      'user-agent': UA,
    },
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  return response.text();
}

async function fetchJson(url, label) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': UA,
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  return response.json();
}

function parseLemehostPage(html) {
  const parts = html.split(/<div class="item" data-key="(\d+)">/);
  const records = [];
  for (let i = 1; i < parts.length; i += 2) {
    const id = parts[i];
    const body = parts[i + 1] || '';
    const heading = body.match(/panel-heading">\s*([^<]+)/);
    const versionLabel = body.match(/label-info">\s*([^<]+)/);
    const downloadsMatch = body.match(/fa-download[^>]*>\s*<\/i>\s*(\d+)/);
    const img = body.match(/<img[^>]+src="([^"]+)"/);
    const name = (heading ? heading[1] : '').trim();
    if (!name) continue;
    const versionText = (versionLabel ? versionLabel[1] : '').trim();
    const versionParts = versionText.match(/\(([^)]*)\)\s*(.+)/);
    const api = versionParts ? versionParts[1].trim() : '';
    const version = versionParts ? versionParts[2].trim() : versionText;
    const artifactUrl =
      version && name
        ? `https://poggit.pmmp.io/p/${encodeURIComponent(name)}/${encodeURIComponent(version)}`
        : '';
    records.push({
      id: Number(id) || id,
      project_name: name,
      name,
      plugin_name: name,
      version,
      version_name: version,
      api,
      tagline: api ? `API ${api}` : '',
      downloads: downloadsMatch ? Number(downloadsMatch[1]) : 0,
      artifact_url: artifactUrl,
      download_url: artifactUrl,
      html_url: `https://lemehost.com/poggit/view?id=${id}`,
      icon_url: img ? img[1] : null,
      source: 'lemehost',
    });
  }
  return records;
}

async function readPrevious(filename) {
  try {
    const value = JSON.parse(await readFile(new URL(filename, outputDir), 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function syncLemehostPoggit() {
  const previous = await readPrevious('poggit-plugins.json');
  const seen = new Set();
  const all = [];
  let lastError = '';

  for (let page = 1; page <= MAX_LEME_PAGES; page++) {
    const url = page === 1 ? LEMEHOST_INDEX : `${LEMEHOST_INDEX}?page=${page}`;
    try {
      const html = await fetchText(url, `Lemehost page ${page}`);
      const batch = parseLemehostPage(html);
      if (!batch.length) {
        console.warn(`Lemehost page ${page}: no plugin cards; stopping pagination.`);
        break;
      }
      for (const item of batch) {
        const key = String(item.id);
        if (seen.has(key)) continue;
        seen.add(key);
        all.push(item);
      }
      console.log(`Lemehost page ${page}: +${batch.length} (total ${all.length})`);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`Lemehost page ${page} failed: ${lastError}`);
      break;
    }
  }

  if (!all.length) {
    if (previous.length) {
      console.warn(`Poggit/Lemehost: retaining ${previous.length} previously synced records.`);
      return { label: 'Poggit', count: previous.length, cached: true };
    }
    console.error(`Poggit/Lemehost: no catalogue saved. ${lastError}`);
    await writeFile(new URL('poggit-plugins.json', outputDir), `${JSON.stringify([], null, 2)}\n`);
    return { label: 'Poggit', count: 0, cached: false, error: lastError || 'empty catalogue' };
  }

  await writeFile(new URL('poggit-plugins.json', outputDir), `${JSON.stringify(all, null, 2)}\n`);
  console.log(`Poggit/Lemehost: saved ${all.length} records from ${LEMEHOST_INDEX}`);
  return { label: 'Poggit', count: all.length, cached: false };
}

function records(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['plugins', 'releases', 'data', 'results', 'items', 'resources']) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
  }
  return Object.values(payload).filter((value) => value && typeof value === 'object');
}

function isSpigetRecord(item) {
  return Boolean(item && typeof item === 'object' && item.id != null && item.name);
}

async function syncSpiget() {
  const previous = await readPrevious('spigot-plugins.json');
  const urls = [
    'https://api.spiget.org/v2/resources?size=100&sort=-downloads',
    'https://api.spiget.org/v2/resources?size=100',
  ];
  let lastError = 'No endpoints configured';
  for (const url of urls) {
    try {
      const payload = await fetchJson(url, 'Spiget');
      const list = records(payload).filter(isSpigetRecord);
      if (!list.length) throw new Error('Endpoint returned no recognizable records');
      await writeFile(new URL('spigot-plugins.json', outputDir), `${JSON.stringify(list, null, 2)}\n`);
      console.log(`Spiget: saved ${list.length} records from ${url}`);
      return { label: 'Spiget', count: list.length, cached: false };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`Spiget endpoint failed (${url}): ${lastError}`);
    }
  }
  if (previous.length) {
    console.warn(`Spiget: retaining ${previous.length} previously synced records.`);
    return { label: 'Spiget', count: previous.length, cached: true };
  }
  console.error(`Spiget: no catalogue was saved. Last error: ${lastError}`);
  return { label: 'Spiget', count: 0, cached: false, error: lastError };
}

const results = await Promise.all([syncLemehostPoggit(), syncSpiget()]);

for (const result of results) {
  if (result.error) {
    console.warn(`${result.label} cache remains unavailable; frontend fallback will show its diagnostic message.`);
  }
}
console.log(
  `Global catalogue sync finished: ${results.map((r) => `${r.label}=${r.count}${r.cached ? ' (cached)' : ''}`).join(', ')}`,
);
