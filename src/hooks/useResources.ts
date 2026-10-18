import { useState, useEffect, useMemo } from 'react';
import type { Resource, ResourcesData, SortOption, PlatformFilter } from '../types/resource';

export function useResources() {
  const [data, setData] = useState<ResourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        // Avoid serving a cached catalogue after GitHub Actions publishes a new sync.
        const resourcesUrl = `${import.meta.env.BASE_URL}data/resources.json`;
        const separator = resourcesUrl.includes('?') ? '&' : '?';
        const [res, curseforgeRes] = await Promise.all([
          fetch(`${resourcesUrl}${separator}t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`${import.meta.env.BASE_URL}data/curseforge.json?t=${Date.now()}`, { cache: 'no-store' }).catch(() => null),
        ]);
        if (!res.ok) throw new Error(`Failed to load resources (${res.status})`);
        const json: ResourcesData = await res.json();
        // Merge the repository's existing CurseForge creator sync into the same catalogue.
        // The source is link metadata only; downloads and compatibility are not invented.
        if (curseforgeRes?.ok) {
          try {
            const cf = await curseforgeRes.json() as { resources?: Array<{id?:string;title?:string;description?:string;url?:string;icon?:string|null;category?:string;edition?:string;updated?:string}> };
            const known = new Set(json.resources.map(item => item.url));
            const imported = (cf.resources ?? []).filter(item => item.title && item.url && !known.has(item.url)).map(item => ({
              id: item.id || `curseforge-${item.title!.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
              platform: 'custom' as const, platformId: item.id || item.url!, slug: item.id || item.title!.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              title: item.title!, description: item.description || 'Minecraft resource listed on CurseForge.', icon: item.icon || null, gallery: [],
              categories: [item.category || 'mods'], loaders: item.edition ? [item.edition] : [], gameVersions: [], version: '', downloads: 0,
              published: item.updated || '', updated: item.updated || '', url: item.url!, downloadUrl: item.url!, featured: false, hidden: false,
            }));
            json.resources = [...json.resources, ...imported];
          } catch (e) { console.warn('CurseForge catalogue could not be parsed; showing primary catalogue only.', e); }
        }
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error, resources: data?.resources ?? [] };
}

export function useFilteredResources(
  resources: Resource[],
  search: string,
  platform: PlatformFilter,
  category: string,
  sort: SortOption
) {
  return useMemo(() => {
    let list = resources.filter((r) => !r.hidden);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.categories.some((c) => c.toLowerCase().includes(q))
      );
    }

    if (platform !== 'all') list = list.filter((r) => r.platform === platform);
    if (category && category !== 'all') list = list.filter((r) => r.categories.includes(category));

    return [...list].sort((a, b) => {
      switch (sort) {
        case 'newest': return new Date(b.published).getTime() - new Date(a.published).getTime();
        case 'updated': return new Date(b.updated).getTime() - new Date(a.updated).getTime();
        case 'downloads': return b.downloads - a.downloads;
        case 'alphabetical': return a.title.localeCompare(b.title);
        default: return 0;
      }
    });
  }, [resources, search, platform, category, sort]);
}
