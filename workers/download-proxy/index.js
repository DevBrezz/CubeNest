const ALLOWED_HOSTS = [
  'cdn.modrinth.com', 'cdn-raw.modrinth.com', 'api.modrinth.com',
  'api.spiget.org', 'www.spigotmc.org', 'spigotmc.org',
  'poggit.pmmp.io', 'github.com', 'objects.githubusercontent.com',
];
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const POGGIT_CATALOGUES = [
  'https://poggit.pmmp.io/plugins.min.json',
  'https://poggit.pmmp.io/releases.min.json',
  'https://poggit.pmmp.io/plugins.json',
];

function corsHeaders(origin, allowedOrigin) {
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
  };
}
function json(data, status, allowedOrigin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders('', allowedOrigin), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60' },
  });
}
function isAllowed(url) {
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOSTS.some(allowed => host === allowed || host.endsWith(`.${allowed}`));
}
function safeFilename(value, fallback = 'download.bin') {
  const cleaned = String(value || fallback).replace(/[\\/\r\n"<>:|?*\x00-\x1f]/g, '_').trim().slice(0, 150);
  return cleaned || fallback;
}
function records(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['plugins', 'data', 'results', 'items', 'resources', 'releases']) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
  }
  return Object.values(payload).filter(v => v && typeof v === 'object');
}
function pluginName(item) {
  return String(item?.name ?? item?.plugin_name ?? item?.project_name ?? item?.title ?? item?.slug ?? '');
}
function pluginId(item) {
  return String(item?.project_id ?? item?.id ?? item?.resource_id ?? item?.slug ?? '');
}
async function fetchPoggitCatalogue() {
  let lastError;
  for (const endpoint of POGGIT_CATALOGUES) {
    try {
      const response = await fetch(endpoint, { headers: { Accept: 'application/json', 'User-Agent': 'CubeNest-Download-Proxy/1.1' } });
      if (!response.ok) throw new Error(`Poggit returned HTTP ${response.status}`);
      const list = records(await response.json()).filter(item => item && typeof item === 'object' && pluginName(item));
      if (list.length) return list;
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error('Poggit catalogue is empty.');
}
async function fetchFile(url) {
  let upstream;
  for (let hop = 0; hop <= 6; hop++) {
    if (!isAllowed(url)) throw new Error('Redirected file host is not supported.');
    upstream = await fetch(url.toString(), {
      redirect: 'manual',
      headers: { 'User-Agent': 'CubeNest-Download-Proxy/1.1', Accept: '*/*' },
    });
    if (!REDIRECT_STATUSES.has(upstream.status)) break;
    const location = upstream.headers.get('Location');
    if (!location) throw new Error('File host returned a redirect without a destination.');
    if (hop === 6) throw new Error('Too many redirects from file host.');
    url = new URL(location, url);
    await upstream.body?.cancel();
  }
  if (!upstream?.ok) {
    await upstream?.body?.cancel();
    throw new Error(`File host returned HTTP ${upstream?.status || 502}.`);
  }
  const type = (upstream.headers.get('Content-Type') || 'application/octet-stream').toLowerCase();
  if (type.includes('text/html') || type.includes('application/json')) {
    await upstream.body?.cancel();
    throw new Error('Source returned a webpage instead of a file.');
  }
  return upstream;
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://cubenest.sytes.net';
    if (origin && origin !== allowedOrigin) return json({ error: 'Origin not allowed.' }, 403, allowedOrigin);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin, allowedOrigin) });
    if (request.method !== 'GET') return json({ error: 'Only GET is supported.' }, 405, allowedOrigin);
    const path = requestUrl.pathname;

    if (path === '/' && !requestUrl.searchParams.has('url')) {
      return json({ success: true, service: 'CubeNest Download Proxy', status: 'online', providers: { modrinth: true, curseforge: false, poggit: true }, endpoints: ['/api/modrinth/search?q=world', '/api/curseforge/search?q=world', '/api/poggit/plugins?name=world', '/api/poggit/apis', '/download/modrinth?url=FILE_URL&filename=FILE_NAME', '/download/curseforge?modId=ID&fileId=ID', '/download/poggit?id=RESOURCE_ID&filename=plugin.phar'] }, 200, allowedOrigin);
    }

    if (path === '/api/poggit/apis') {
      return json({ success: true, provider: 'Poggit', apis: POGGIT_CATALOGUES }, 200, allowedOrigin);
    }
    if (path === '/api/poggit/plugins') {
      try {
        const query = (requestUrl.searchParams.get('name') || '').trim().toLowerCase();
        const all = await fetchPoggitCatalogue();
        const filtered = query ? all.filter(item => `${pluginName(item)} ${item.description || item.summary || ''} ${(item.authors || []).toString()}`.toLowerCase().includes(query)) : all;
        return json({ success: true, provider: 'Poggit', total: filtered.length, plugins: filtered.slice(0, 100) }, 200, allowedOrigin);
      } catch (error) {
        return json({ success: false, provider: 'Poggit', error: error instanceof Error ? error.message : 'Poggit catalogue unavailable', total: 0, plugins: [] }, 502, allowedOrigin);
      }
    }
    if (path === '/api/modrinth/search') {
      const query = (requestUrl.searchParams.get('q') || '').trim();
      if (!query) return json({ success: true, hits: [], total_hits: 0 }, 200, allowedOrigin);
      const api = new URL('https://api.modrinth.com/v2/search');
      api.searchParams.set('query', query);
      api.searchParams.set('limit', '30');
      api.searchParams.set('facets', JSON.stringify([['project_type:mod'], ['categories:bukkit', 'categories:paper', 'categories:spigot']]));
      try {
        const response = await fetch(api, { headers: { Accept: 'application/json', 'User-Agent': 'CubeNest/1.0 (download proxy)' } });
        if (!response.ok) return json({ error: `Modrinth returned HTTP ${response.status}` }, 502, allowedOrigin);
        return json(await response.json(), 200, allowedOrigin);
      } catch (error) { return json({ error: error instanceof Error ? error.message : 'Modrinth search failed' }, 502, allowedOrigin); }
    }

    let target = null;
    let filename = safeFilename(requestUrl.searchParams.get('filename'));
    if (path === '/download/modrinth' || (path === '/' && requestUrl.searchParams.has('url'))) {
      const raw = requestUrl.searchParams.get('url');
      try { target = raw ? new URL(raw) : null; } catch { target = null; }
      if (!target || !isAllowed(target)) return json({ error: 'Invalid or unsupported download URL.' }, 400, allowedOrigin);
    } else if (path === '/download/poggit') {
      const id = requestUrl.searchParams.get('id') || '';
      if (!id) return json({ error: 'Missing Poggit resource ID.' }, 400, allowedOrigin);
      try {
        const all = await fetchPoggitCatalogue();
        const item = all.find(entry => pluginId(entry) === id || String(entry.project_id || '') === id || String(entry.id || '') === id || String(entry.slug || '') === id);
        if (!item) return json({ error: 'Poggit plugin ID was not found. Refresh the PocketMine catalogue and try again.' }, 404, allowedOrigin);
        const latest = item.latest_release || item.latestRelease || item.release || {};
        const candidate = item.artifact_url || item.download_url || item.downloadUrl || item.phar_url || item.file_url || latest.artifact_url || latest.download_url || latest.url;
        if (candidate) { try { target = new URL(candidate); } catch { target = null; } }
        if (!target && Array.isArray(item.versions)) {
          const version = item.versions.find(v => v?.artifact_url || v?.download_url || v?.url) || item.versions[0];
          const candidateUrl = version?.artifact_url || version?.download_url || version?.url;
          if (candidateUrl) { try { target = new URL(candidateUrl); } catch { target = null; } }
        }
        if (!target && Array.isArray(item.releases)) {
          const release = item.releases.find(v => v?.artifact_url || v?.download_url || v?.url) || item.releases[0];
          const candidateUrl = release?.artifact_url || release?.download_url || release?.url;
          if (candidateUrl) { try { target = new URL(candidateUrl); } catch { target = null; } }
        }
        if (!target || !isAllowed(target)) return json({ error: 'Poggit did not expose a direct downloadable PHAR for this resource.' }, 502, allowedOrigin);
        filename = safeFilename(filename, `${pluginName(item).toLowerCase().replace(/[^a-z0-9._-]+/g, '-') || 'plugin'}.phar`);
        if (!filename.toLowerCase().endsWith('.phar')) filename = filename.replace(/\.[^.]+$/, '') + '.phar';
      } catch (error) { return json({ error: error instanceof Error ? error.message : 'Could not resolve Poggit release.' }, 502, allowedOrigin); }
    } else if (path === '/download/curseforge') {
      return json({ error: 'CurseForge downloads are not enabled on this Worker yet. Use an available provider.' }, 501, allowedOrigin);
    } else {
      return json({ error: 'Unknown endpoint.' }, 404, allowedOrigin);
    }

    try {
      const upstream = await fetchFile(target);
      const headers = new Headers({
        ...corsHeaders(origin, allowedOrigin),
        'Content-Type': upstream.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store',
      });
      const length = upstream.headers.get('Content-Length');
      if (length) headers.set('Content-Length', length);
      return new Response(upstream.body, { status: 200, headers });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Download failed.' }, 502, allowedOrigin);
    }
  },
};
    
