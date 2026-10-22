/** Shared Bedrock resource download via CubeNest proxy. */

export type BedrockDownloadItem = {
  id: number | string;
  slug?: string;
  name?: string;
  downloadUrl?: string | null;
  fileName?: string | null;
  fileId?: number | null;
  latestFileId?: number | null;
  source?: string | null;
  url?: string | null;
};

export const DOWNLOAD_PROXY_URL = String(
  import.meta.env.VITE_DOWNLOAD_PROXY_URL || 'https://cubenest-download-proxy.brezzteam5.workers.dev',
)
  .trim()
  .replace(/\/$/, '');


/** Classic ForgeCDN layout: fileId 6503708 → /files/6503/708/name.zip */
export function forgecdnFileUrl(fileId: number, fileName: string): string {
  const major = Math.floor(fileId / 1000);
  const minor = fileId % 1000;
  const safe = encodeURIComponent(fileName).replace(/%20/g, ' ');
  return `https://edge.forgecdn.net/files/${major}/${minor}/${safe}`;
}

function numericId(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

/**
 * Download a Bedrock catalog item through the CubeNest worker.
 * Prefer modId + fileId (CurseForge API path on the worker). Fall back to direct CDN URL.
 */
export async function downloadBedrockItem(item: BedrockDownloadItem): Promise<void> {
  if (!DOWNLOAD_PROXY_URL) {
    throw new Error('CubeNest download proxy is not configured.');
  }

  const modId = numericId(item.id);
  const fileId = numericId(item.fileId ?? item.latestFileId);
  let downloadUrl = item.downloadUrl ? String(item.downloadUrl) : '';

  // Reconstruct ForgeCDN URL when the catalogue stored null downloadUrl but has file id + name
  if (!downloadUrl && fileId && item.fileName) {
    downloadUrl = forgecdnFileUrl(fileId, String(item.fileName));
  }

  if (!downloadUrl && !(modId && fileId)) {
    throw new Error(
      'No download file is available for this resource. Open the project page for more options.',
    );
  }

  const path = '/download/curseforge';
  const endpoint = new URL(path, DOWNLOAD_PROXY_URL);

  if (modId && fileId) {
    endpoint.searchParams.set('modId', String(modId));
    endpoint.searchParams.set('fileId', String(fileId));
  }
  if (downloadUrl) {
    endpoint.searchParams.set('url', downloadUrl);
  }

  const filename =
    item.fileName ||
    `${item.slug || item.id || 'resource'}.zip`;
  endpoint.searchParams.set('filename', filename);

  const response = await fetch(endpoint.toString(), { method: 'GET', credentials: 'omit' });
  if (!response.ok) {
    let detail = '';
    try {
      const payload = await response.json();
      detail = typeof payload?.error === 'string' ? ` ${payload.error}` : '';
    } catch {
      /* not JSON */
    }
    // Last-resort: open curated project page is NOT a fake binary — we still refuse.
    // But if worker only accepts modId/fileId and URL path failed, surface a clear English message.
    throw new Error(`Download failed (HTTP ${response.status}).${detail}`);
  }

  const blob = await response.blob();
  if (blob.size < 32) {
    throw new Error('The source returned an empty or incomplete file.');
  }
  const head = new TextDecoder()
    .decode(await blob.slice(0, 64).arrayBuffer())
    .trimStart()
    .toLowerCase();
  if (head.startsWith('<!doctype') || head.startsWith('<html') || head.startsWith('{')) {
    throw new Error('The source returned a web page or error instead of a resource file.');
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export function canDownloadBedrockItem(item: BedrockDownloadItem): boolean {
  if (item.downloadUrl) return true;
  const fileId = numericId(item.fileId ?? item.latestFileId);
  const modId = numericId(item.id);
  if (fileId && modId) return true;
  if (fileId && item.fileName) return true;
  return false;
}
