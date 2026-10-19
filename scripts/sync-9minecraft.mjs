/**
 * Sync Minecraft Bedrock resources from 9Minecraft (WordPress REST API + page HTML).
 * Writes public/data/9minecraft-bedrock.json for the Bedrock catalog.
 *
 * Categories (MCPE/Bedrock only — never Java mods):
 *   6734 mods-addons, 7946 maps, 6735 texture-packs, 8057 shaders, 7877 skin-packs
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/data');
const outFile = join(outDir, '9minecraft-bedrock.json');
const UA = 'CubeNest-9Minecraft-Sync/1.0 (+resource catalogue)';
const API = 'https://www.9minecraft.net/wp-json/wp/v2';
const PER_PAGE = 20;
const MAX_PAGES_PER_CAT = 12; // up to 240 posts per Bedrock category
const DETAIL_CONCURRENCY = 5;

const CATEGORIES = [
  { id: 6734, key: 'addons', label: 'Add-ons' },
  { id: 7946, key: 'maps', label: 'Maps' },
  { id: 6735, key: 'textures', label: 'Texture packs' },
  { id: 8057, key: 'shaders', label: 'Shaders' },
  { id: 7877, key: 'skins', label: 'Skins' },
];

function decodeHtml(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function stripTags(html) {
  return decodeHtml(String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { Accept: 'text/html', 'User-Agent': UA },
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response.text();
}

function extractDownloadUrls(html) {
  const found = [];
  const re = /https?:\/\/(?:dl\d+\.(?:9minecraft\.net|cdn9mc\.com))\/dl2\.php\?file=[^"'&\s]+/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    let url = match[0].replace(/&amp;/g, '&');
    // Normalize to a stable host form used on post pages
    url = url.replace('cdn9mc.com', '9minecraft.net');
    if (!found.includes(url)) found.push(url);
  }
  return found;
}

function inferFilename(downloadUrl, slug) {
  try {
    const u = new URL(downloadUrl);
    const file = u.searchParams.get('file');
    if (file) return file;
  } catch { /* ignore */ }
  return `${slug || 'resource'}.mcaddon`;
}

async function mediaUrl(mediaId) {
  if (!mediaId) return null;
  try {
    const media = await fetchJson(`${API}/media/${mediaId}?_fields=source_url,media_details`);
    const thumb =
      media?.media_details?.sizes?.thumbnail?.source_url ||
      media?.media_details?.sizes?.['post-thumbnail']?.source_url ||
      media?.source_url ||
      null;
    return thumb;
  } catch {
    return null;
  }
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;
  async function run() {
    while (index < items.length) {
      const i = index++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

async function fetchCategoryPosts(category) {
  const posts = [];
  for (let page = 1; page <= MAX_PAGES_PER_CAT; page++) {
    const url = new URL(`${API}/posts`);
    url.searchParams.set('categories', String(category.id));
    url.searchParams.set('per_page', String(PER_PAGE));
    url.searchParams.set('page', String(page));
    url.searchParams.set('_fields', 'id,title,link,slug,date,modified,excerpt,featured_media');
    try {
      const batch = await fetchJson(url.toString());
      if (!Array.isArray(batch) || !batch.length) break;
      for (const post of batch) {
        posts.push({ ...post, _category: category });
      }
      if (batch.length < PER_PAGE) break;
    } catch (error) {
      console.warn(`9Minecraft category ${category.key} page ${page}: ${error.message || error}`);
      break;
    }
  }
  return posts;
}

async function enrichPost(post) {
  const category = post._category;
  const name = decodeHtml(post.title?.rendered || post.slug || 'Untitled');
  const summary = stripTags(post.excerpt?.rendered || '');
  let downloadUrl = null;
  let fileName = null;
  try {
    const html = await fetchText(post.link);
    const urls = extractDownloadUrls(html);
    if (urls.length) {
      downloadUrl = urls[0];
      fileName = inferFilename(downloadUrl, post.slug);
    }
  } catch (error) {
    console.warn(`Detail fetch failed for ${post.slug}: ${error.message || error}`);
  }
  const logo = await mediaUrl(post.featured_media);
  return {
    id: `9mc-${post.id}`,
    numericId: post.id,
    slug: post.slug || String(post.id),
    name,
    summary,
    downloadCount: 0,
    logo,
    url: post.link,
    authors: ['9Minecraft'],
    categories: [category.label],
    category: category.key,
    categoryLabel: category.label,
    downloadUrl,
    fileName,
    fileId: null,
    updated: post.modified || post.date || null,
    source: '9Minecraft',
  };
}

function existingResources() {
  try {
    const old = JSON.parse(readFileSync(outFile, 'utf8'));
    return Array.isArray(old.resources) ? old.resources : [];
  } catch {
    return [];
  }
}

async function main() {
  console.log('Syncing 9Minecraft Bedrock catalogue…');
  const allPosts = [];
  for (const category of CATEGORIES) {
    const batch = await fetchCategoryPosts(category);
    console.log(`Category ${category.key}: ${batch.length} posts`);
    allPosts.push(...batch);
  }

  // Dedupe by post id (a post should only appear in one category for our mapping)
  const unique = new Map();
  for (const post of allPosts) {
    if (!unique.has(post.id)) unique.set(post.id, post);
  }
  const posts = [...unique.values()];
  console.log(`Unique posts: ${posts.length}; resolving download links…`);

  const resources = (await mapWithConcurrency(posts, DETAIL_CONCURRENCY, enrichPost)).filter(Boolean);
  const withDl = resources.filter((r) => r.downloadUrl).length;

  if (!resources.length) {
    const previous = existingResources();
    if (previous.length) {
      console.warn(`No new resources; retaining ${previous.length} previous entries.`);
      return;
    }
    throw new Error('9Minecraft returned zero Bedrock resources.');
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    outFile,
    `${JSON.stringify(
      {
        lastSynced: new Date().toISOString(),
        source: '9minecraft-wordpress',
        total: resources.length,
        directDownloads: withDl,
        resources,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`Wrote ${resources.length} 9Minecraft resources (${withDl} with download URLs).`);
}

main().catch((error) => {
  console.error(`9Minecraft sync failed: ${error.message || error}`);
  if (!existsSync(outFile)) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      outFile,
      `${JSON.stringify({ lastSynced: null, resources: [], error: 'sync_failed' }, null, 2)}\n`,
    );
  }
  process.exitCode = 1;
});
