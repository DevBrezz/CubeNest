const ALLOWED_HOSTS = [
  'cdn.modrinth.com', 'cdn-raw.modrinth.com', 'api.spiget.org', 'cdn.spiget.org', 'spiget.org',
  'www.spigotmc.org', 'spigotmc.org', 'poggit.pmmp.io',
  'github.com', 'githubusercontent.com', 'objects.githubusercontent.com',
  'release-assets.githubusercontent.com', 'github-releases.githubusercontent.com',
];
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const DEFAULT_ORIGIN = 'https://cubenest.sytes.net';

function corsHeaders(origin, env) {
  // The Worker is a public download proxy with strict upstream host allowlisting.
  // Reflect the requesting website origin to avoid breaking CubeNest custom domains,
  // GitHub Pages previews, and domain migrations because of a stale ALLOWED_ORIGIN var.
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
  };
}
function json(data, status, origin, env) {
  return new Response(JSON.stringify(data), { status, headers: {
    ...corsHeaders(origin, env), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'
  }});
}
function isAllowed(url) {
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOSTS.some(allowed => host === allowed || host.endsWith(`.${allowed}`));
}
function safeFilename(value) {
  const cleaned = String(value || 'download.bin').replace(/[\\/\r\n"<>:|?*\x00-\x1f]/g, '_').trim().slice(0, 150);
  return cleaned || 'download.bin';
}
async function fetchPoggitList(search) {
  // Poggit's documented releases endpoint returns one record per release and
  // includes artifact_url. Do not use GitHub repository/archive metadata as plugins.
  const api = new URL('https://poggit.pmmp.io/releases.min.json');
  api.searchParams.set('latest-only', 'on');
  api.searchParams.set('min-state', '5');
  if (search) api.searchParams.set('name', search.slice(0, 100));
  const response = await fetch(api.toString(), {
    headers: { 'Accept': 'application/json', 'User-Agent': 'CubeNest/1.0 (+resource catalogue)' }
  });
  if (!response.ok) throw new Error(`Poggit API returned HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error('Poggit API returned an unexpected catalogue format');
  return payload.filter(item => {
    if (!item || !item.id || !item.project_name || !item.artifact_url) return false;
    const project = String(item.project_name || '').toLowerCase();
    const repo = String(item.repo_name || '').toLowerCase();
    const artifact = String(item.artifact_url || '');
    // Exclude PocketMine-MP itself and Poggit's release-archive repository.
    if (project === 'pocketmine-mp' || repo.includes('release-archive')) return false;
    try {
      const u = new URL(artifact);
      return u.protocol === 'https:' && (u.hostname === 'poggit.pmmp.io' || u.hostname.endsWith('.poggit.pmmp.io'));
    } catch { return false; }
  });
}

async function fetchSpigetResources(search) {
  const api = search
    ? new URL(`https://api.spiget.org/v2/search/resources/${encodeURIComponent(search.slice(0, 100))}`)
    : new URL('https://api.spiget.org/v2/resources');
  api.searchParams.set('size', '36');
  api.searchParams.set('sort', '-downloads');
  const response = await fetch(api.toString(), {
    headers: { 'Accept': 'application/json', 'User-Agent': 'CubeNest/1.0 (+resource catalogue)' }
  });
  if (!response.ok) throw new Error(`Spiget API returned HTTP ${response.status}`);
  const payload = await response.json();
  const records = Array.isArray(payload) ? payload : (Array.isArray(payload?.resources) ? payload.resources : []);
  return records.filter(item => item && /^\d+$/.test(String(item.id || '')) && item.name);
}

async function streamDownload(target, filename, origin, env) {
  if (!isAllowed(target)) return json({ error: 'This file host is not supported by CubeNest.' }, 403, origin, env);
  let upstream;
  try {
    for (let hop = 0; hop <= 7; hop++) {
      if (!isAllowed(target)) return json({ error: 'The download redirected to an unsupported host.' }, 403, origin, env);
      upstream = await fetch(target.toString(), { redirect: 'manual', headers: { 'User-Agent': 'CubeNest-Download-Proxy/1.0', 'Accept': '*/*' } });
      if (!REDIRECT_STATUSES.has(upstream.status)) break;
      const location = upstream.headers.get('Location');
      if (!location) return json({ error: 'The file host returned a redirect without a destination.' }, 502, origin, env);
      if (hop === 7) return json({ error: 'Too many redirects from the file host.' }, 502, origin, env);
      target = new URL(location, target);
      await upstream.body?.cancel();
    }
  } catch (error) {
    return json({ error: `Could not reach the file host: ${error instanceof Error ? error.message : 'network error'}` }, 502, origin, env);
  }
  if (!upstream || !upstream.ok) {
    await upstream?.body?.cancel();
    return json({ error: `The file host returned HTTP ${upstream?.status || 502}.` }, 502, origin, env);
  }
  const contentType = (upstream.headers.get('Content-Type') || '').toLowerCase();
  if (contentType.includes('text/html') || contentType.includes('application/json') || contentType.includes('text/plain')) {
    await upstream.body?.cancel();
    return json({ error: 'The source returned a web page or metadata instead of a plugin binary.' }, 502, origin, env);
  }
  const name = safeFilename(filename);
  const headers = new Headers({
    ...corsHeaders(origin, env), 'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    'Cache-Control': 'no-store',
  });
  const length = upstream.headers.get('Content-Length');
  if (length) headers.set('Content-Length', length);
  return new Response(upstream.body, { status: 200, headers });
}

export default {
  async fetch(request, env = {}) {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const path = requestUrl.pathname.replace(/\/+$/, '') || '/';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    if (request.method !== 'GET') return json({ error: 'Only GET is supported.' }, 405, origin, env);

    if (path === '/' || path === '/health' || path === '/api') {
      return json({ success: true, service: 'CubeNest Download Proxy', status: 'online', providers: { modrinth: true, spigot: true, poggit: true }, endpoints: ['/api/spigot/resources', '/api/spigot/search?q=world', '/api/poggit/plugins?name=world', '/api/poggit/apis', '/download/spigot?id=123', '/download/poggit?url=POGGIT_ARTIFACT_URL&filename=plugin.phar', '/?url=FILE_URL&filename=FILE_NAME'] }, 200, origin, env);
    }
    if (path === '/api/poggit/plugins') {
      try {
        const records = await fetchPoggitList(requestUrl.searchParams.get('name') || '');
        return json(records, 200, origin, env);
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'Poggit catalogue unavailable', plugins: [] }, 502, origin, env);
      }
    }
    if (path === '/api/spigot/resources' || path === '/api/spigot/search') {
      try {
        const records = await fetchSpigetResources(requestUrl.searchParams.get('q') || '');
        return json(records, 200, origin, env);
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'Spigot catalogue unavailable', resources: [] }, 502, origin, env);
      }
    }

    if (path === '/download/spigot') {
      const id = requestUrl.searchParams.get('id') || '';
      if (!/^\d+$/.test(id)) return json({ error: 'A numeric Spigot resource ID is required.' }, 400, origin, env);
      // Spiget returns a redirect to its CDN for hosted resources. Follow and
      // stream it here so browser CORS and external-page navigation are avoided.
      return streamDownload(new URL(`https://api.spiget.org/v2/resources/${id}/download`), requestUrl.searchParams.get('filename') || `spigot-${id}.jar`, origin, env);
    }

    if (path === '/api/poggit/apis') {
      try {
        const response = await fetch('https://poggit.pmmp.io/pmapis.min', { headers: { 'Accept': 'application/json', 'User-Agent': 'CubeNest/1.0' } });
        if (!response.ok) throw new Error(`Poggit API returned HTTP ${response.status}`);
        return new Response(await response.text(), { status: 200, headers: { ...corsHeaders(origin, env), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
      } catch (error) { return json({ error: error instanceof Error ? error.message : 'Poggit API versions unavailable' }, 502, origin, env); }
    }

    if (path === '/download/poggit') {
      let raw = requestUrl.searchParams.get('url');
      if (!raw) {
        const id = requestUrl.searchParams.get('id');
        if (!id || !/^\d+$/.test(id)) return json({ error: 'Provide a Poggit artifact URL or numeric release ID.' }, 400, origin, env);
        try {
          const api = new URL('https://poggit.pmmp.io/releases.min.json'); api.searchParams.set('id', id);
          const response = await fetch(api.toString(), { headers: { 'Accept': 'application/json', 'User-Agent': 'CubeNest/1.0' } });
          if (!response.ok) throw new Error(`Poggit API returned HTTP ${response.status}`);
          const records = await response.json();
          raw = Array.isArray(records) ? records.find(item => String(item.id) === id)?.artifact_url : '';
        } catch (error) { return json({ error: error instanceof Error ? error.message : 'Could not resolve Poggit release' }, 502, origin, env); }
      }
      let target;
      try { target = new URL(raw); } catch { return json({ error: 'Invalid Poggit artifact URL.' }, 400, origin, env); }
      if (target.hostname !== 'poggit.pmmp.io' && !target.hostname.endsWith('.poggit.pmmp.io')) return json({ error: 'Poggit downloads must use a verified Poggit artifact URL.' }, 403, origin, env);
      return streamDownload(target, requestUrl.searchParams.get('filename') || 'plugin.phar', origin, env);
    }

    // Generic allowlisted file proxy for Modrinth and Spigot downloads.
    const raw = requestUrl.searchParams.get('url');
    if (!raw) return json({ error: 'Unknown endpoint or missing url parameter.' }, 404, origin, env);
    let target;
    try { target = new URL(raw); } catch { return json({ error: 'Invalid file URL.' }, 400, origin, env); }
    return streamDownload(target, requestUrl.searchParams.get('filename') || 'download.bin', origin, env);
  }
};
