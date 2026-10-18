import { useMemo, useState } from 'react';
import { Search, Package } from 'lucide-react';
import { useResources, useFilteredResources } from '../hooks/useResources';
import { ProjectCard } from '../components/ProjectCard';
import type { SortOption, PlatformFilter } from '../types/resource';

type PluginSource = 'global' | 'spigot' | 'modrinth';

/** Plugins: Global (default) = all sources, or Spigot / Modrinth only */
export function Plugins() {
  const { resources, loading, error, data } = useResources();
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<PluginSource>('global');
  const [sort, setSort] = useState<SortOption>('updated');

  const pluginResources = useMemo(
    () => resources.filter((r) => !r.hidden && (r.platform === 'spigot' || r.platform === 'modrinth')),
    [resources]
  );

  const platformFilter: PlatformFilter =
    source === 'global' ? 'all' : source === 'spigot' ? 'spigot' : 'modrinth';

  const filtered = useFilteredResources(pluginResources, search, platformFilter, 'all', sort);

  return (
    <div className="pt-24 pb-16 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-mc-white">Plugins</h1>
          <p className="text-mc-muted mt-1 text-sm">
            Server plugins — Global combines SpigotMC and Modrinth. {pluginResources.length} in catalogue
            {data?.lastSynced ? ` · Synced ${new Date(data.lastSynced).toLocaleString()}` : ''}
          </p>
        </div>

        <div className="bg-mc-surface border border-mc-border rounded-xl p-4 mb-8 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted" />
            <input
              type="search"
              placeholder="Search plugins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-mc-red"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {([
              { id: 'global' as const, label: 'Global' },
              { id: 'spigot' as const, label: 'SpigotMC' },
              { id: 'modrinth' as const, label: 'Modrinth' },
            ]).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSource(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  source === opt.id
                    ? 'bg-mc-red border-mc-red text-white'
                    : 'bg-mc-gray border-mc-border text-mc-text hover:border-mc-red/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-lg bg-mc-gray border border-mc-border text-xs text-mc-text ml-auto"
            >
              <option value="updated">Recently updated</option>
              <option value="newest">Newest</option>
              <option value="downloads">Downloads</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
            <span className="text-xs text-mc-muted">{filtered.length} results</span>
          </div>
        </div>

        {error && <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-xl p-4 mb-6 text-sm">{error}</div>}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-mc-muted">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No plugins match your filters.</p>
            <p className="text-xs mt-2">If this is empty on the live site, ensure /data/resources.json is deployed (GitHub Actions build).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((r, i) => <ProjectCard key={r.id} resource={r} index={i} />)}
          </div>
        )}

        <p className="mt-8 text-xs text-mc-muted text-center">
          Downloads are hosted by SpigotMC or Modrinth. CubeNest links to official release pages.
        </p>
      </div>
    </div>
  );
}
