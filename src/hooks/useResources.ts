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
        const res = await fetch(`${resourcesUrl}${separator}t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load resources (${res.status})`);
        const json: ResourcesData = await res.json();
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
