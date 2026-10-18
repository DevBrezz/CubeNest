/** Official Modrinth API v2 client — public endpoints only, no secrets. */

const API = 'https://api.modrinth.com/v2';
const UA = 'CubeNest/1.0 (https://github.com; content discovery)';

export type ModrinthProjectType = 'mod' | 'plugin' | 'resourcepack' | 'shader' | 'modpack' | 'datapack';

export interface ModrinthHit {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  categories: string[];
  display_categories?: string[];
  client_side?: string;
  server_side?: string;
  project_type: string;
  downloads: number;
  follows?: number;
  icon_url: string | null;
  author?: string;
  date_created?: string;
  date_modified?: string;
  latest_version?: string;
  license?: string;
  gallery?: string[];
  versions?: string[];
}

export interface ModrinthSearchResult {
  hits: ModrinthHit[];
  offset: number;
  limit: number;
  total_hits: number;
}

export interface ModrinthProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  categories: string[];
  project_type: string;
  downloads: number;
  followers: number;
  icon_url: string | null;
  published: string;
  updated: string;
  license?: { id?: string; name?: string };
  gallery?: Array<{ url: string; title?: string; description?: string; featured?: boolean }>;
  loaders?: string[];
  game_versions?: string[];
  source_url?: string | null;
  issues_url?: string | null;
  discord_url?: string | null;
  team?: string;
}

export interface ModrinthVersion {
  id: string;
  name: string;
  version_number: string;
  changelog?: string;
  date_published: string;
  downloads: number;
  version_type: string;
  loaders: string[];
  game_versions: string[];
  files: Array<{
    url: string;
    filename: string;
    primary: boolean;
    size: number;
  }>;
}

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'User-Agent': UA,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Modrinth ${res.status}: ${text.slice(0, 120) || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function searchProjects(opts: {
  query?: string;
  projectType?: ModrinthProjectType;
  loaders?: string[];
  versions?: string[];
  categories?: string[];
  index?: 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated';
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<ModrinthSearchResult> {
  const facets: string[][] = [];
  if (opts.projectType) facets.push([`project_type:${opts.projectType}`]);
  if (opts.loaders?.length) facets.push(opts.loaders.map((l) => `categories:${l}`));
  if (opts.versions?.length) facets.push(opts.versions.map((v) => `versions:${v}`));
  if (opts.categories?.length) facets.push(opts.categories.map((c) => `categories:${c}`));

  const params = new URLSearchParams();
  if (opts.query) params.set('query', opts.query);
  if (facets.length) params.set('facets', JSON.stringify(facets));
  params.set('index', opts.index || 'relevance');
  params.set('offset', String(opts.offset ?? 0));
  params.set('limit', String(Math.min(opts.limit ?? 20, 100)));

  return get<ModrinthSearchResult>(`/search?${params}`, { signal: opts.signal });
}

export async function getProject(idOrSlug: string, signal?: AbortSignal): Promise<ModrinthProject> {
  return get<ModrinthProject>(`/project/${encodeURIComponent(idOrSlug)}`, { signal });
}

export async function getProjectVersions(idOrSlug: string, signal?: AbortSignal): Promise<ModrinthVersion[]> {
  return get<ModrinthVersion[]>(`/project/${encodeURIComponent(idOrSlug)}/version`, { signal });
}

export function projectUrl(slug: string) {
  return `https://modrinth.com/project/${slug}`;
}
