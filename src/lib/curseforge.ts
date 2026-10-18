/** CurseForge Core API — needs VITE_CURSEFORGE_API_KEY (free at console.curseforge.com). */

const API = 'https://api.curseforge.com/v1';

/** Minecraft Bedrock Edition on CurseForge */
export const CF_BEDROCK_GAME_ID = 69076;
/** Fallback: Java Minecraft (sometimes used for cross-listed content) */
export const CF_JAVA_GAME_ID = 432;

export type CfMod = {
  id: number;
  name: string;
  slug: string;
  summary: string;
  downloadCount: number;
  logo?: { url?: string; thumbnailUrl?: string } | null;
  links?: { websiteUrl?: string };
  categories?: { name: string }[];
  latestFilesIndexes?: { gameVersion?: string; fileId?: number }[];
  authors?: { name: string }[];
};

export type CfFile = {
  id: number;
  displayName: string;
  fileName: string;
  downloadUrl: string | null;
  gameVersions?: string[];
  fileDate?: string;
  downloadCount?: number;
};

function apiKey(): string | undefined {
  const k = import.meta.env.VITE_CURSEFORGE_API_KEY as string | undefined;
  if (!k || k.includes('YOUR_')) return undefined;
  return k;
}

export function isCurseForgeConfigured(): boolean {
  return Boolean(apiKey());
}

async function cfGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const key = apiKey();
  if (!key) throw new Error('CurseForge API key not configured');
  const url = new URL(API + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'x-api-key': key,
    },
  });
  if (!res.ok) throw new Error(`CurseForge error ${res.status}`);
  return res.json() as Promise<T>;
}

export async function searchBedrockMods(opts: {
  query?: string;
  page?: number;
  pageSize?: number;
  sortField?: number;
}): Promise<{ data: CfMod[]; pagination: { index: number; pageSize: number; totalCount: number } }> {
  const pageSize = opts.pageSize ?? 20;
  const index = ((opts.page ?? 0) * pageSize);
  const body = await cfGet<{ data: CfMod[]; pagination: { index: number; pageSize: number; totalCount: number } }>(
    '/mods/search',
    {
      gameId: CF_BEDROCK_GAME_ID,
      searchFilter: opts.query || '',
      pageSize,
      index,
      sortField: opts.sortField ?? 2, // popularity
      sortOrder: 'desc',
    }
  );
  return body;
}

export async function getMod(modId: number): Promise<CfMod> {
  const body = await cfGet<{ data: CfMod }>(`/mods/${modId}`);
  return body.data;
}

export async function getModFiles(modId: number): Promise<CfFile[]> {
  const body = await cfGet<{ data: CfFile[] }>(`/mods/${modId}/files`, { pageSize: 20 });
  return body.data || [];
}
