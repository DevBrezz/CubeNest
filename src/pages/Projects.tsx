import { useState } from 'react';
import { Search, Filter, Blocks, ArrowUpRight } from 'lucide-react';
import { useResources, useFilteredResources } from '../hooks/useResources';
import { ProjectCard } from '../components/ProjectCard';
import type { SortOption, PlatformFilter } from '../types/resource';

function ModrinthMark({ className = 'w-5 h-5' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" role="img" aria-label="Modrinth" fill="currentColor"><path d="M4.2 3.2 2 5.4v3.1l5.5 5.5 2.2-2.2L4.2 6.3V3.2Zm5.1 0L7.1 5.4v3.1l5.5 5.5 2.2-2.2-5.5-5.5V3.2Zm5.1 0-2.2 2.2v3.1l5.5 5.5 2.2-2.2-5.5-5.5V3.2ZM2 12.6v3.1l5.5 5.5 2.2-2.2-5.5-5.5-2.2-.9Zm5.1 0v3.1l5.5 5.5 2.2-2.2-5.5-5.5-2.2-.9Zm5.1 0v3.1l5.5 5.5 2.2-2.2-5.5-5.5-2.2-.9Z"/></svg>;
}

export function Projects() {
  const { resources, loading, error, data } = useResources();
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortOption>('updated');

  const filtered = useFilteredResources(resources, search, platform, category, sort);

  const categories = Array.from(
    new Set(resources.flatMap((r) => r.categories))
  ).sort();

  return (
    <div className="pt-24 pb-16 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="projects-heading mb-8">
          <div className="eyebrow">THE KINGBREZZ CATALOGUE</div>
          <h1 className="section-heading mt-3">Projects & <span>plugins.</span></h1>
          <p className="text-mc-muted mt-3 text-sm max-w-2xl">Browse the projects in the portfolio catalogue. Choose a platform below to filter its resources.</p>
          <div className="platform-picks mt-6" role="group" aria-label="Filter projects by platform">
            <button type="button" onClick={() => setPlatform('modrinth')} className={`platform-pick ${platform === 'modrinth' ? 'is-active' : ''}`} aria-pressed={platform === 'modrinth'}><span className="platform-logo modrinth-logo"><ModrinthMark className="w-6 h-6"/></span><span><strong>Modrinth</strong><small>Projects & releases</small></span><ArrowUpRight className="platform-arrow" size={16}/></button>
            <button type="button" onClick={() => setPlatform('spigot')} className={`platform-pick ${platform === 'spigot' ? 'is-active' : ''}`} aria-pressed={platform === 'spigot'}><span className="platform-logo spigot-logo"><Blocks size={24}/></span><span><strong>SpigotMC</strong><small>Plugins & resources</small></span><ArrowUpRight className="platform-arrow" size={16}/></button>
            <button type="button" onClick={() => setPlatform('all')} className={`platform-pick platform-pick-all ${platform === 'all' ? 'is-active' : ''}`} aria-pressed={platform === 'all'}><span className="platform-logo all-logo"><Filter size={22}/></span><span><strong>All platforms</strong><small>Combined catalogue</small></span><ArrowUpRight className="platform-arrow" size={16}/></button>
          </div>
          <p className="text-mc-muted mt-4 text-xs">{resources.length} resources · Last synced {data ? new Date(data.lastSynced).toLocaleString() : '—'}</p>
        </div>

        {/* Filters */}
        <div className="bg-mc-surface border border-mc-border rounded-xl p-4 mb-8 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted" />
            <input
              type="search"
              placeholder="Search by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-mc-red"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-mc-muted" />
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as PlatformFilter)}
              className="px-3 py-1.5 rounded-lg bg-mc-gray border border-mc-border text-xs text-mc-text focus:outline-none focus:border-mc-red"
            >
              <option value="all">All Platforms</option>
              <option value="modrinth">Modrinth</option>
              <option value="spigot">SpigotMC</option>
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-mc-gray border border-mc-border text-xs text-mc-text focus:outline-none focus:border-mc-red"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-lg bg-mc-gray border border-mc-border text-xs text-mc-text focus:outline-none focus:border-mc-red"
            >
              <option value="updated">Recently Updated</option>
              <option value="newest">Newest</option>
              <option value="downloads">Most Downloads</option>
              <option value="alphabetical">Alphabetical</option>
            </select>

            <span className="text-xs text-mc-muted ml-auto">{filtered.length} results</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-xl p-4 mb-6 text-sm">
            Failed to load resources: {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="skeleton h-64 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-mc-muted">
            <p className="text-lg">No resources match your filters.</p>
            <button
              onClick={() => { setSearch(''); setPlatform('all'); setCategory('all'); }}
              className="mt-3 text-sm text-mc-red hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((r, i) => (
              <ProjectCard key={r.id} resource={r} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
