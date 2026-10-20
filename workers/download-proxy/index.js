/**
 * CubeNest Download Proxy — Cloudflare Worker
 * Streams allowlisted Minecraft resource files so downloads stay inside CubeNest.
 *
 * Endpoints:
 *   GET /health | / | /api
 *   GET /api/poggit/plugins?name=
 *   GET /api/spigot/resources | /api/spigot/search?q=
 *   GET /api/curseforge/search?q=  (optional; requires CURSEFORGE_API_KEY secret)
 *   GET /download/spigot?id=
 *   GET /download/poggit?url= | ?id=
 *   GET /download/modrinth?url=
 *   GET /download/curseforge?url=
 *   GET /download/9minecraft?url=
 *   GET /api/9minecraft/search?q=
 *   GET /download?url= | /?url=
 */
const ALLOWED_HOSTS = [
  'cdn.modrinth.com',
  'cdn-raw.modrinth.com',
  'api.modrinth.com',
  'api.spiget.org',
  'cdn.spiget.org',
  'spiget.org',
  'www.spigotmc.org',
  'spigotmc.org',
  'poggit.pmmp.io',
  'lemehost.com',
  'www.lemehost.com',
  'github.com',
  'githubusercontent.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
  'github-releases.githubusercontent.com',
  'edge.forgecdn.net',
  'media.forgecdn.net',
  'forgecdn.net',
  'addons-ecs.forgesvc.net',
  'api.curseforge.com',
  // 9Minecraft download CDN (session-gated binaries)
  '9minecraft.net',
  'cdn9mc.com',
  'img4.9minecraft.net',
];

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const VERSION = '4.3.0';
const LEMEHOST_INDEX = 'https://lemehost.com/poggit/index';
const UA = 'CubeNest-Download-Proxy/4.3 (+resource catalogue; +https://cubenest.sytes.net)';

function isNineMinecraftHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return (
    host === '9minecraft.net' ||
    host.endsWith('.9minecraft.net') ||
    host === 'cdn9mc.com' ||
    host.endsWith('.cdn9mc.com')
  );
}

function corsHeaders(origin) {
  // Reflect request origin so CubeNest custom domains and previews work.
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
    'X-Content-Type-Options': 'nosniff',
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function isAllowed(url) {
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

function safeFilename(value) {
  const cleaned = String(value || 'download.bin')
    .replace(/[\\/\r\n"<>:|?*\x00-\x1f]/g, '_')
    .trim()
    .slice(0, 150);
  return cleaned || 'download.bin';
}

function textOnly(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * PocketMine catalogue from lemehost.com/poggit (official poggit.pmmp.io JSON
 * redirects to a GitHub archive and no longer returns release records).
 */
async function fetchLemehostPlugins(search) {
  const query = String(search || '').trim().toLowerCase();
  const pagesToFetch = query ? 10 : 3; // broader crawl when searching
  const all = [];
  const seen = new Set();
  const errors = [];

  for (let page = 1; page <= pagesToFetch; page++) {
    const url = page === 1 ? LEMEHOST_INDEX : `${LEMEHOST_INDEX}?page=${page}`;
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': UA,
        },
      });
      if (!response.ok) {
        errors.push(`page ${page}: HTTP ${response.status}`);
        if (response.status === 404) break;
        continue;
      }
      const html = await response.text();
      const parts = html.split(/<div class="item" data-key="(\d+)">/);
      if (parts.length < 3) {
        errors.push(`page ${page}: no plugin cards`);
        break;
      }
      let pageCount = 0;
      for (let i = 1; i < parts.length; i += 2) {
        const id = parts[i];
        const body = parts[i + 1] || '';
        if (seen.has(id)) continue;
        seen.add(id);
        const heading = body.match(/panel-heading">\s*([^<]+)/);
        const versionLabel = body.match(/label-info">\s*([^<]+)/);
        const downloadsMatch = body.match(/fa-download[^>]*>\s*<\/i>\s*(\d+)/);
        const img = body.match(/<img[^>]+src="([^"]+)"/);
        const name = (heading ? heading[1] : '').trim();
        if (!name) continue;
        const versionText = (versionLabel ? versionLabel[1] : '').trim();
        // Version label is often "(API range) version"
        const versionParts = versionText.match(/\(([^)]*)\)\s*(.+)/);
        const api = versionParts ? versionParts[1].trim() : '';
        const version = versionParts ? versionParts[2].trim() : versionText;
        // Prefer a poggit-style artifact URL when name/version known (may still fail upstream).
        const artifactUrl =
          version && name
            ? `https://poggit.pmmp.io/p/${encodeURIComponent(name)}/${encodeURIComponent(version)}`
            : '';
        const record = {
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
          repo_name: '',
          icon_url: img ? img[1] : null,
          source: 'lemehost',
        };
        all.push(record);
        pageCount++;
      }
      if (pageCount === 0) break;
    } catch (error) {
      errors.push(`page ${page}: ${error instanceof Error ? error.message : 'request failed'}`);
    }
  }

  if (!all.length) {
    throw new Error(
      `Lemehost PocketMine catalogue unavailable (${errors.join('; ') || 'empty'}). Official poggit.pmmp.io no longer serves release JSON.`,
    );
  }

  if (!query) return all;
  return all.filter((item) => {
    const hay = `${item.name} ${item.tagline} ${item.version}`.toLowerCase();
    return hay.includes(query);
  });
}

/** Legacy Poggit JSON endpoints (usually redirect to GitHub archive). */
async function fetchPoggitJsonList(search) {
  const endpoints = ['releases.min.json', 'plugins.min.json', 'releases.json', 'plugins.json'];
  const errors = [];
  for (const endpoint of endpoints) {
    const api = new URL(`https://poggit.pmmp.io/${endpoint}`);
    if (endpoint.startsWith('releases')) api.searchParams.set('latest-only', 'on');
    if (search) api.searchParams.set('name', search.slice(0, 100));
    try {
      const response = await fetch(api.toString(), {
        headers: { Accept: 'application/json', 'User-Agent': UA },
        redirect: 'follow',
      });
      if (!response.ok) {
        errors.push(`${endpoint}: HTTP ${response.status}`);
        continue;
      }
      const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
      if (contentType.includes('text/html')) {
        errors.push(`${endpoint}: redirected to HTML (archive)`);
        continue;
      }
      const payload = await response.json();
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.releases)
          ? payload.releases
          : Array.isArray(payload?.plugins)
            ? payload.plugins
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
      const valid = rows.filter((item) => {
        if (!item || typeof item !== 'object') return false;
        const name = String(item.project_name || item.plugin_name || item.name || item.title || '').trim();
        const artifact = String(item.artifact_url || item.download_url || item.downloadUrl || '');
        const project = name.toLowerCase();
        const repo = String(item.repo_name || item.repository || '').toLowerCase();
        if (!name || !artifact || project === 'pocketmine-mp' || repo.includes('release-archive')) return false;
        try {
          const u = new URL(artifact);
          return u.protocol === 'https:' && (u.hostname === 'poggit.pmmp.io' || u.hostname.endsWith('.poggit.pmmp.io'));
        } catch {
          return false;
        }
      });
      if (valid.length) {
        const q = String(search || '').toLowerCase();
        return valid.filter(
          (item) =>
            !q ||
            String(item.project_name || item.name || '')
              .toLowerCase()
              .includes(q) ||
            String(item.tagline || '')
              .toLowerCase()
              .includes(q),
        );
      }
      errors.push(`${endpoint}: no valid release records`);
    } catch (error) {
      errors.push(`${endpoint}: ${error instanceof Error ? error.message : 'request failed'}`);
    }
  }
  throw new Error(`Poggit JSON unavailable (${errors.join('; ')})`);
}

async function fetchPoggitList(search) {
  // Prefer lemehost mirror; fall back to official JSON if it ever returns data again.
  try {
    return await fetchLemehostPlugins(search);
  } catch (lemeError) {
    try {
      return await fetchPoggitJsonList(search);
    } catch {
      throw lemeError;
    }
  }
}

async function fetchSpigetResources(search) {
  const urls = [];
  if (search) {
    urls.push(
      `https://api.spiget.org/v2/search/resources/${encodeURIComponent(search.slice(0, 100))}?size=36&sort=-downloads`,
    );
  }
  urls.push('https://api.spiget.org/v2/resources?size=36&sort=-downloads');
  const errors = [];
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': UA },
      });
      if (!response.ok) {
        errors.push(`HTTP ${response.status}`);
        continue;
      }
      const payload = await response.json();
      const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.resources) ? payload.resources : [];
      const records = rows.filter((item) => item && /^\d+$/.test(String(item.id || '')) && item.name);
      if (records.length) {
        const q = String(search || '').trim().toLowerCase();
        return records.filter(
          (item) =>
            !q ||
            `${item.name || ''} ${item.description || ''} ${item.tag || ''} ${
              typeof item.author === 'string' ? item.author : item.author?.name || ''
            }`
              .toLowerCase()
              .includes(q),
        );
      }
      errors.push('empty or unrecognized response');
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'request failed');
    }
  }
  throw new Error(`Spiget API unavailable (${errors.join('; ') || 'no records'}).`);
}

/**
 * Optional CurseForge search (Bedrock-oriented). Requires env.CURSEFORGE_API_KEY.
 * classId 4559 = Minecraft Addons (Bedrock). gameId 432 = Minecraft.
 */
async function fetchCurseforgeSearch(search, env) {
  const key = env.CURSEFORGE_API_KEY || env.CF_API_KEY || '';
  if (!key) {
    throw new Error('CurseForge API key is not configured on the Worker (set CURSEFORGE_API_KEY secret).');
  }
  const q = String(search || '').trim();
  if (!q) {
    throw new Error('Missing search query. Use ?q=world');
  }
  const url = new URL('https://api.curseforge.com/v1/mods/search');
  url.searchParams.set('gameId', '432');
  url.searchParams.set('classId', '4559'); // Bedrock addons class — do not drop when query is set
  url.searchParams.set('searchFilter', q.slice(0, 100));
  url.searchParams.set('pageSize', '20');
  url.searchParams.set('sortField', '2');
  url.searchParams.set('sortOrder', 'desc');
  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'x-api-key': key,
      'User-Agent': UA,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`CurseForge HTTP ${response.status}: ${body.slice(0, 180)}`);
  }
  return response.json();
}

/**
 * 9Minecraft CDN requires a session cookie from the interstitial page
 * before ?dl=1 returns the binary. Mirror that handshake server-side.
 */
async function downloadNineMinecraft(rawUrl, filename, origin) {
  let target;
  try {
    target = new URL(rawUrl);
  } catch {
    return json({ success: false, error: 'Invalid 9Minecraft download URL.' }, 400, origin);
  }
  if (!isNineMinecraftHost(target.hostname)) {
    return json({ success: false, error: '9Minecraft downloads must use a 9Minecraft CDN host.' }, 403, origin);
  }

  // Normalize to a gate URL without dl=1 so the session cookie is issued.
  const gate = new URL(target.toString());
  gate.searchParams.delete('dl');

  let cookieHeader = '';
  try {
    const gateResponse = await fetch(gate.toString(), {
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        Referer: 'https://www.9minecraft.net/',
      },
    });
    const setCookies = typeof gateResponse.headers.getSetCookie === 'function'
      ? gateResponse.headers.getSetCookie()
      : [];
    // Workers may only expose a single set-cookie; also parse get('set-cookie').
    const rawSet = setCookies.length
      ? setCookies
      : [gateResponse.headers.get('set-cookie')].filter(Boolean);
    cookieHeader = rawSet
      .map((line) => String(line).split(';')[0].trim())
      .filter(Boolean)
      .join('; ');
    await gateResponse.body?.cancel();
  } catch (error) {
    return json(
      {
        success: false,
        error: `Could not open 9Minecraft download gate: ${error instanceof Error ? error.message : 'network error'}`,
      },
      502,
      origin,
    );
  }

  const fileUrl = new URL(gate.toString());
  fileUrl.searchParams.set('dl', '1');

  let upstream;
  try {
    upstream = await fetch(fileUrl.toString(), {
      redirect: 'manual',
      headers: {
        'User-Agent': UA,
        Accept: '*/*',
        Referer: gate.toString(),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });
    // Follow a short redirect chain while staying on allowlisted hosts.
    for (let hop = 0; hop < 5 && REDIRECT_STATUSES.has(upstream.status); hop++) {
      const location = upstream.headers.get('Location');
      if (!location) break;
      const next = new URL(location, fileUrl);
      if (!isNineMinecraftHost(next.hostname) && !isAllowed(next)) {
        await upstream.body?.cancel();
        return json({ success: false, error: '9Minecraft redirected to an unsupported host.' }, 403, origin);
      }
      await upstream.body?.cancel();
      upstream = await fetch(next.toString(), {
        redirect: 'manual',
        headers: {
          'User-Agent': UA,
          Accept: '*/*',
          Referer: gate.toString(),
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      });
    }
  } catch (error) {
    return json(
      {
        success: false,
        error: `Could not download from 9Minecraft: ${error instanceof Error ? error.message : 'network error'}`,
      },
      502,
      origin,
    );
  }

  if (!upstream || !upstream.ok) {
    await upstream?.body?.cancel();
    return json(
      { success: false, error: `9Minecraft returned HTTP ${upstream?.status || 502} for the file request.` },
      502,
      origin,
    );
  }

  const contentType = (upstream.headers.get('Content-Type') || '').toLowerCase();
  if (contentType.includes('text/html') || contentType.includes('application/json')) {
    await upstream.body?.cancel();
    return json(
      {
        success: false,
        error: '9Minecraft returned a web page instead of a file (session or anti-bot gate may have blocked the request).',
      },
      502,
      origin,
    );
  }

  let name = safeFilename(filename);
  const disposition = upstream.headers.get('Content-Disposition') || '';
  const named = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
  if (named?.[1]) name = safeFilename(decodeURIComponent(named[1]));
  if (!name.includes('.') && gate.searchParams.get('file')) {
    name = safeFilename(gate.searchParams.get('file'));
  }

  const headers = new Headers({
    ...corsHeaders(origin),
    'Content-Type': contentType || 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    'Cache-Control': 'no-store',
  });
  const length = upstream.headers.get('Content-Length');
  if (length) headers.set('Content-Length', length);
  return new Response(upstream.body, { status: 200, headers });
}

async function streamDownload(target, filename, origin) {
  if (!isAllowed(target)) {
    return json({ success: false, error: 'This file host is not supported by CubeNest.' }, 403, origin);
  }
  let upstream;
  try {
    for (let hop = 0; hop <= 7; hop++) {
      if (!isAllowed(target)) {
        return json({ success: false, error: 'The download redirected to an unsupported host.' }, 403, origin);
      }
      upstream = await fetch(target.toString(), {
        redirect: 'manual',
        headers: { 'User-Agent': UA, Accept: '*/*' },
      });
      if (!REDIRECT_STATUSES.has(upstream.status)) break;
      const location = upstream.headers.get('Location');
      if (!location) {
        return json({ success: false, error: 'The file host returned a redirect without a destination.' }, 502, origin);
      }
      if (hop === 7) {
        return json({ success: false, error: 'Too many redirects from the file host.' }, 502, origin);
      }
      target = new URL(location, target);
      await upstream.body?.cancel();
    }
  } catch (error) {
    return json(
      {
        success: false,
        error: `Could not reach the file host: ${error instanceof Error ? error.message : 'network error'}`,
      },
      502,
      origin,
    );
  }

  if (!upstream || !upstream.ok) {
    await upstream?.body?.cancel();
    // Poggit often 301s to the GitHub release-archive landing page (HTML).
    if (upstream && REDIRECT_STATUSES.has(upstream.status)) {
      return json(
        {
          success: false,
          error:
            'The upstream host no longer serves this plugin binary (redirected away from a file URL). CubeNest will not open an external project page as a fake download.',
        },
        502,
        origin,
      );
    }
    return json(
      { success: false, error: `The file host returned HTTP ${upstream?.status || 502}.` },
      502,
      origin,
    );
  }

  const contentType = (upstream.headers.get('Content-Type') || '').toLowerCase();
  if (
    contentType.includes('text/html') ||
    contentType.includes('application/json') ||
    (contentType.includes('text/plain') && !contentType.includes('octet'))
  ) {
    await upstream.body?.cancel();
    return json(
      {
        success: false,
        error: 'The source returned a web page or metadata instead of a downloadable file.',
      },
      502,
      origin,
    );
  }

  const name = safeFilename(filename);
  const headers = new Headers({
    ...corsHeaders(origin),
    'Content-Type': contentType.includes('octet') || contentType.includes('zip') || contentType.includes('java')
      ? contentType
      : 'application/octet-stream',
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

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'GET') {
      return json({ success: false, error: 'Only GET is supported.' }, 405, origin);
    }

    if (path === '/' || path === '/health' || path === '/api') {
      // Generic download via ?url= on root is supported; health JSON only when no url param.
      const raw = requestUrl.searchParams.get('url');
      if (raw && path === '/') {
        let target;
        try {
          target = new URL(raw);
        } catch {
          return json({ success: false, error: 'Invalid file URL.' }, 400, origin);
        }
        return streamDownload(target, requestUrl.searchParams.get('filename') || 'download.bin', origin);
      }
      return json(
        {
          success: true,
          service: 'CubeNest Download Proxy',
          status: 'online',
          version: VERSION,
          providers: { modrinth: true, curseforge: true, poggit: true, spigot: true, nineminecraft: true },
          endpoints: [
            '/health',
            '/api/poggit/plugins?name=world',
            '/api/poggit/apis',
            '/api/spigot/resources',
            '/api/spigot/search?q=essentials',
            '/api/curseforge/search?q=addon',
            '/download?url=FILE_URL',
            '/download/modrinth?url=FILE_URL',
            '/download/curseforge?url=FILE_URL',
            '/download/9minecraft?url=FILE_URL',
            '/download/poggit?url=FILE_URL',
            '/download/spigot?id=RESOURCE_ID',
          ],
        },
        200,
        origin,
      );
    }

    if (path === '/api/poggit/plugins') {
      try {
        const records = await fetchPoggitList(requestUrl.searchParams.get('name') || '');
        return json(
          { success: true, provider: 'poggit', source: 'lemehost', plugins: records, data: records },
          200,
          origin,
        );
      } catch (error) {
        return json(
          {
            success: false,
            provider: 'poggit',
            error: error instanceof Error ? error.message : 'Poggit catalogue unavailable',
            plugins: [],
            version: VERSION,
          },
          502,
          origin,
        );
      }
    }

    if (path === '/api/spigot/resources' || path === '/api/spigot/search') {
      try {
        const records = await fetchSpigetResources(requestUrl.searchParams.get('q') || '');
        return json(records, 200, origin);
      } catch (error) {
        return json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Spigot catalogue unavailable',
            resources: [],
          },
          502,
          origin,
        );
      }
    }

    if (path === '/api/curseforge/search') {
      try {
        const payload = await fetchCurseforgeSearch(requestUrl.searchParams.get('q') || '', env);
        return json(
          {
            success: true,
            provider: 'curseforge',
            query: requestUrl.searchParams.get('q') || '',
            data: payload?.data || [],
            pagination: payload?.pagination || null,
          },
          200,
          origin,
        );
      } catch (error) {
        return json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'CurseForge search unavailable',
            version: VERSION,
          },
          502,
          origin,
        );
      }
    }

    if (path === '/api/poggit/apis') {
      try {
        const response = await fetch('https://poggit.pmmp.io/pmapis.min', {
          headers: { Accept: 'application/json', 'User-Agent': UA },
        });
        if (!response.ok) throw new Error(`Poggit API returned HTTP ${response.status}`);
        return new Response(await response.text(), {
          status: 200,
          headers: {
            ...corsHeaders(origin),
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } catch (error) {
        return json(
          { success: false, error: error instanceof Error ? error.message : 'Poggit API versions unavailable' },
          502,
          origin,
        );
      }
    }

    if (path === '/download/spigot') {
      const id = requestUrl.searchParams.get('id') || '';
      if (!/^\d+$/.test(id)) {
        return json({ success: false, error: 'A numeric Spigot resource ID is required.' }, 400, origin);
      }
      return streamDownload(
        new URL(`https://api.spiget.org/v2/resources/${id}/download`),
        requestUrl.searchParams.get('filename') || `spigot-${id}.jar`,
        origin,
      );
    }

    if (path === '/download/poggit') {
      let raw = requestUrl.searchParams.get('url');
      if (!raw) {
        const id = requestUrl.searchParams.get('id');
        if (!id || !/^\d+$/.test(id)) {
          return json(
            { success: false, error: 'Provide a Poggit artifact URL or numeric release ID.' },
            400,
            origin,
          );
        }
        // Resolve from lemehost detail page when possible
        try {
          const detail = await fetch(`https://lemehost.com/poggit/view?id=${id}`, {
            headers: { Accept: 'text/html', 'User-Agent': UA },
          });
          if (detail.ok) {
            const html = await detail.text();
            const match = html.match(/https:\/\/poggit\.pmmp\.io\/p\/[^"'<\s]+/);
            if (match) raw = match[0];
          }
        } catch {
          /* fall through */
        }
        if (!raw) {
          return json(
            {
              success: false,
              error:
                'Could not resolve a downloadable Poggit artifact for this ID. Official poggit.pmmp.io no longer hosts binaries for many releases.',
            },
            502,
            origin,
          );
        }
      }
      let target;
      try {
        target = new URL(raw);
      } catch {
        return json({ success: false, error: 'Invalid Poggit artifact URL.' }, 400, origin);
      }
      if (
        target.hostname !== 'poggit.pmmp.io' &&
        !target.hostname.endsWith('.poggit.pmmp.io') &&
        target.hostname !== 'lemehost.com' &&
        !target.hostname.endsWith('.lemehost.com')
      ) {
        return json(
          { success: false, error: 'Poggit downloads must use a verified Poggit or Lemehost URL.' },
          403,
          origin,
        );
      }
      return streamDownload(target, requestUrl.searchParams.get('filename') || 'plugin.phar', origin);
    }

    if (path === '/download/9minecraft') {
      const raw = requestUrl.searchParams.get('url');
      if (!raw) {
        return json({ success: false, error: 'Missing url parameter for 9Minecraft download.' }, 400, origin);
      }
      return downloadNineMinecraft(raw, requestUrl.searchParams.get('filename') || 'resource.mcaddon', origin);
    }

    if (path === '/download/modrinth' || path === '/download/curseforge' || path === '/download') {
      const filename = requestUrl.searchParams.get('filename') || 'download.bin';
      const modIdRaw = requestUrl.searchParams.get('modId');
      const fileIdRaw = requestUrl.searchParams.get('fileId');
      const modId = modIdRaw ? Number(modIdRaw) : NaN;
      const fileId = fileIdRaw ? Number(fileIdRaw) : NaN;

      // CurseForge: prefer modId + fileId (works when catalogue has null downloadUrl)
      if (path === '/download/curseforge' && Number.isFinite(modId) && modId > 0 && Number.isFinite(fileId) && fileId > 0) {
        const key = env.CURSEFORGE_API_KEY || env.CF_API_KEY || '';
        let resolved = null;
        if (key) {
          try {
            const apiRes = await fetch(
              `https://api.curseforge.com/v1/mods/${modId}/files/${fileId}/download-url`,
              { headers: { Accept: 'application/json', 'x-api-key': key, 'User-Agent': UA } },
            );
            if (apiRes.ok) {
              const body = await apiRes.json();
              if (typeof body?.data === 'string' && body.data.startsWith('http')) resolved = body.data;
            }
          } catch {
            /* fall through to ForgeCDN pattern */
          }
        }
        if (!resolved) {
          // ForgeCDN path layout used by CurseForge CDN
          const major = Math.floor(fileId / 1000);
          const minor = fileId % 1000;
          const name = safeFilename(filename);
          resolved = `https://edge.forgecdn.net/files/${major}/${minor}/${name}`;
        }
        try {
          const target = new URL(resolved);
          return streamDownload(target, filename, origin);
        } catch {
          return json({ success: false, error: 'Could not resolve CurseForge file URL.' }, 502, origin);
        }
      }

      const raw = requestUrl.searchParams.get('url');
      if (!raw) {
        if (path === '/download/curseforge') {
          return json(
            { success: false, error: 'Numeric modId and fileId are required, or provide a direct ForgeCDN url parameter.' },
            400,
            origin,
          );
        }
        return json({ success: false, error: 'Missing url parameter.' }, 400, origin);
      }
      let target;
      try {
        target = new URL(raw);
      } catch {
        return json({ success: false, error: 'Invalid file URL.' }, 400, origin);
      }
      // Route 9Minecraft CDN URLs through the session-aware downloader.
      if (isNineMinecraftHost(target.hostname)) {
        return downloadNineMinecraft(raw, requestUrl.searchParams.get('filename') || 'resource.mcaddon', origin);
      }
      if (path === '/download/modrinth') {
        if (!target.hostname.includes('modrinth')) {
          return json({ success: false, error: 'Modrinth downloads must use a Modrinth CDN URL.' }, 403, origin);
        }
      }
      if (path === '/download/curseforge') {
        if (!/forgecdn\.net$|curseforge\.com$|forgesvc\.net$/i.test(target.hostname) && !target.hostname.endsWith('.forgecdn.net')) {
          return json(
            { success: false, error: 'CurseForge downloads must use a ForgeCDN or CurseForge URL.' },
            403,
            origin,
          );
        }
      }
      return streamDownload(target, filename, origin);
    }

    // Fallback: any path with ?url=
    const raw = requestUrl.searchParams.get('url');
    if (!raw) {
      return json({ success: false, error: 'Unknown endpoint or missing url parameter.' }, 404, origin);
    }
    let target;
    try {
      target = new URL(raw);
    } catch {
      return json({ success: false, error: 'Invalid file URL.' }, 400, origin);
    }
    return streamDownload(target, requestUrl.searchParams.get('filename') || 'download.bin', origin);
  },
};
