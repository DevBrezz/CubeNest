/**
 * Sync resources from Modrinth (official API) and SpigotMC (best-effort scrape).
 * Designed to run in GitHub Actions. Preserves existing data on partial failure.
 */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/data/resources.json');
// Modrinth accepts a username or user ID. Use the stable account ID to avoid
// username/slug lookup inconsistencies and always fetch this account's full project list.
const MODRINTH_USER = '6CK7TRJp';
const SPIGOT_AUTHOR = 'https://www.spigotmc.org/resources/authors/brezz.2530124/';

async function fetchModrinth() {
  const res = await fetch(`https://api.modrinth.com/v2/user/${MODRINTH_USER}/projects`, {
    headers: { 'User-Agent': 'KingBrezz-Portfolio-Sync/1.0 (github.com/KingBrezz)' },
  });
  if (!res.ok) throw new Error(`Modrinth ${res.status}`);
  const projects = await res.json();
  return projects
    .filter((p) => p && p.id && p.status !== 'rejected' && p.status !== 'archived')
    .map((p) => ({
    id: `modrinth-${p.id}`,
    platform: 'modrinth',
    platformId: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    body: p.body || p.description,
    icon: p.icon_url || null,
    gallery: (p.gallery || []).map((g) => g.url || g.raw_url).filter(Boolean),
    categories: p.categories || [],
    loaders: p.loaders || [],
    gameVersions: p.game_versions || [],
    version: 'latest',
    downloads: p.downloads || 0,
    published: p.published,
    updated: p.updated,
    url: `https://modrinth.com/project/${p.slug}`,
    downloadUrl: `https://modrinth.com/project/${p.slug}/versions`,
    featured: false,
    hidden: false,
  }));
}

async function fetchSpigot() {
  // Best-effort. Cloudflare often blocks headless/cloud IPs.
  // On failure we keep previous Spigot data.
  const pages = [];
  for (let page = 1; page <= 5; page++) {
    const url = page === 1 ? SPIGOT_AUTHOR : `${SPIGOT_AUTHOR}?page=${page}`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KingBrezzPortfolio/1.0; +https://github.com)',
          Accept: 'text/html',
        },
      });
      if (!res.ok) break;
      const html = await res.text();
      if (html.includes('cf-error') || html.includes('Attention Required')) {
        throw new Error('Cloudflare blocked');
      }
      pages.push(html);
      // simple stop if no more resources link pattern
      if (!html.includes('resources/') || html.includes('There are no resources')) break;
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e) {
      if (page === 1) throw e;
      break;
    }
  }

  const resources = [];
  const seen = new Set();
  const re = /resources\/([a-z0-9\-]+)\.(\d+)\/[^"]*"[^>]*>([^<]+)<\/a>[\s\S]*?(?:Downloads:\s*([\d,]+))?[\s\S]*?Updated:\s*[^<]*?([A-Za-z]+ \d+, \d{4})?/gi;

  for (const html of pages) {
    let m;
    const linkRe = /href="(?:https?:\/\/www\.spigotmc\.org\/)?(?:\/)?resources\/([^"]+?)\.(\d+)\/"[^>]*>([^<]+)<\/a>/gi;
    while ((m = linkRe.exec(html)) !== null) {
      const slug = m[1];
      const id = m[2];
      const title = m[3].trim();
      if (seen.has(id)) continue;
      seen.add(id);
      resources.push({
        id: `spigot-${id}`,
        platform: 'spigot',
        platformId: id,
        slug,
        title,
        description: title,
        body: title,
        icon: null,
        gallery: [],
        categories: [],
        loaders: ['spigot', 'paper'],
        gameVersions: [],
        version: '',
        downloads: 0,
        published: new Date().toISOString(),
        updated: new Date().toISOString(),
        url: `https://www.spigotmc.org/resources/${slug}.${id}/`,
        downloadUrl: `https://www.spigotmc.org/resources/${slug}.${id}/`,
        featured: false,
        hidden: false,
      });
    }
  }
  return resources;
}

function loadExisting() {
  if (!existsSync(OUT)) return { resources: [], sources: {} };
  try {
    return JSON.parse(readFileSync(OUT, 'utf8'));
  } catch {
    return { resources: [], sources: {} };
  }
}

function merge(existing, modrinth, spigot, modStatus, spigotStatus) {
  const byId = new Map();
  // keep previous
  for (const r of existing.resources || []) {
    byId.set(r.id, { ...r });
  }
  // upsert modrinth
  for (const r of modrinth) {
    const prev = byId.get(r.id);
    byId.set(r.id, {
      ...r,
      featured: prev?.featured ?? r.featured,
      hidden: prev?.hidden ?? false,
    });
  }
  // upsert spigot only if we got fresh data
  if (spigotStatus === 'success' && spigot.length) {
    for (const r of spigot) {
      const prev = byId.get(r.id);
      byId.set(r.id, {
        ...r,
        description: prev?.description && prev.description !== prev.title ? prev.description : r.description,
        featured: prev?.featured ?? false,
        hidden: prev?.hidden ?? false,
        downloads: r.downloads || prev?.downloads || 0,
      });
    }
  }

  return {
    lastSynced: new Date().toISOString(),
    sources: {
      modrinth: {
        status: modStatus,
        count: modrinth.length,
        lastSuccess: modStatus === 'success' ? new Date().toISOString() : (existing.sources?.modrinth?.lastSuccess || ''),
      },
      spigot: {
        status: spigotStatus,
        count: spigotStatus === 'success' ? spigot.length : (existing.sources?.spigot?.count || 0),
        lastSuccess: spigotStatus === 'success' ? new Date().toISOString() : (existing.sources?.spigot?.lastSuccess || ''),
        note: spigotStatus !== 'success' ? 'SpigotMC fetch failed (Cloudflare or network). Previous data retained.' : undefined,
      },
    },
    resources: Array.from(byId.values()).sort(
      (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
    ),
  };
}

async function main() {
  const existing = loadExisting();
  let modrinth = [];
  let modStatus = 'error';
  try {
    modrinth = await fetchModrinth();
    modStatus = 'success';
    console.log(`Modrinth: ${modrinth.length} projects`);
  } catch (e) {
    console.error('Modrinth failed:', e.message);
  }

  let spigot = [];
  let spigotStatus = 'error';
  try {
    spigot = await fetchSpigot();
    if (spigot.length) {
      spigotStatus = 'success';
      console.log(`Spigot: ${spigot.length} resources`);
    } else {
      console.warn('Spigot returned 0 resources');
    }
  } catch (e) {
    console.error('Spigot failed:', e.message);
  }

  const merged = merge(existing, modrinth, spigot, modStatus, spigotStatus);
  writeFileSync(OUT, JSON.stringify(merged, null, 2));
  console.log(`Wrote ${merged.resources.length} resources to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
