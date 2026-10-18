import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Download, ExternalLink, Package, AlertCircle, RefreshCw } from 'lucide-react';
import { searchProjects, type ModrinthHit, type ModrinthProjectType } from '../lib/modrinth';
import { formatNumber } from '../lib/utils';

const TYPE_META: Record<string, { title: string; blurb: string; type: ModrinthProjectType; loaders?: string[] }> = {
  mods: { title: 'Mods', blurb: 'Discover Minecraft mods from Modrinth.', type: 'mod' },
  resourcepacks: { title: 'Resource Packs', blurb: 'Textures and styles for your world.', type: 'resourcepack' },
  shaders: { title: 'Shaders', blurb: 'Lighting and visual overhauls.', type: 'shader' },
  modpacks: { title: 'Modpacks', blurb: 'Curated packs ready to play.', type: 'modpack' },
  datapacks: { title: 'Data Packs', blurb: 'Gameplay tweaks without mods.', type: 'datapack' },
};

export function Catalog({ category }: { category: keyof typeof TYPE_META }) {
  const meta = TYPE_META[category];
  const [params, setParams] = useSearchParams();
  const q0 = params.get('q') || '';
  const [query, setQuery] = useState(q0);
  const [hits, setHits] = useState<ModrinthHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'relevance' | 'downloads' | 'updated' | 'newest'>('relevance');
  const [offset, setOffset] = useState(0);
  const limit = 24;

  useEffect(() => {
    const t = window.setTimeout(() => {
      setParams((p) => {
        const next = new URLSearchParams(p);
        if (query) next.set('q', query); else next.delete('q');
        return next;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [query, setParams]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    searchProjects({
      query: query || undefined,
      projectType: meta.type,
      index: sort,
      offset,
      limit,
      signal: ac.signal,
    })
      .then((res) => {
        setHits(res.hits);
        setTotal(res.total_hits);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Search failed');
        setHits([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [query, sort, offset, meta.type]);

  const pages = useMemo(() => Math.ceil(total / limit), [total]);

  return (
    <div className="pt-24 pb-16 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-mc-white">{meta.title}</h1>
          <p className="text-mc-muted mt-1 text-sm">{meta.blurb} Data from the official Modrinth API.</p>
        </div>

        <div className="bg-mc-surface border border-mc-border rounded-xl p-4 mb-8 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOffset(0); }}
              placeholder={`Search ${meta.title.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-mc-red"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value as typeof sort); setOffset(0); }}
              className="px-3 py-1.5 rounded-lg bg-mc-gray border border-mc-border text-xs text-mc-text"
            >
              <option value="relevance">Relevance</option>
              <option value="downloads">Downloads</option>
              <option value="updated">Recently updated</option>
              <option value="newest">Newest</option>
            </select>
            <span className="text-xs text-mc-muted ml-auto">{total.toLocaleString()} results</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-xl p-4 mb-6 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-medium">Could not load catalog</p>
              <p className="mt-1 opacity-80">{error}</p>
              <button type="button" className="mt-2 inline-flex items-center gap-1 text-mc-red hover:underline" onClick={() => setOffset((o) => o)}>
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-xl" />)}
          </div>
        ) : hits.length === 0 ? (
          <div className="text-center py-20 text-mc-muted">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-lg">No projects found</p>
            <p className="text-sm mt-1">Try a different search or sort option.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {hits.map((h, i) => (
                <motion.article
                  key={h.project_id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.25) }}
                  className="group bg-mc-surface border border-mc-border rounded-xl overflow-hidden hover:border-mc-red/50 transition-colors"
                >
                  <Link to={`/${category}/${h.slug}`} className="block">
                    <div className="aspect-[16/10] bg-mc-gray relative overflow-hidden flex items-center justify-center">
                      {h.icon_url ? (
                        <img src={h.icon_url} alt="" className="w-20 h-20 rounded-xl object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      ) : (
                        <Package className="w-12 h-12 text-mc-muted" />
                      )}
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-green-600/90 text-white">Modrinth</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-mc-white text-sm line-clamp-1 group-hover:text-mc-red-bright transition-colors">{h.title}</h3>
                      <p className="mt-1.5 text-xs text-mc-muted line-clamp-2">{h.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {(h.display_categories || h.categories || []).slice(0, 3).map((c) => (
                          <span key={c} className="px-1.5 py-0.5 rounded bg-mc-gray text-[10px] text-mc-muted capitalize">{c}</span>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-mc-border flex items-center justify-between text-[11px] text-mc-muted">
                        <span className="flex items-center gap-1"><Download className="w-3 h-3" />{formatNumber(h.downloads)}</span>
                        <span className="flex items-center gap-1">Details <ExternalLink className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
            {pages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button type="button" disabled={offset <= 0} onClick={() => setOffset(Math.max(0, offset - limit))} className="px-4 py-2 rounded-lg bg-mc-surface border border-mc-border text-sm disabled:opacity-40">Previous</button>
                <span className="px-3 py-2 text-sm text-mc-muted">{Math.floor(offset / limit) + 1} / {pages}</span>
                <button type="button" disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)} className="px-4 py-2 rounded-lg bg-mc-surface border border-mc-border text-sm disabled:opacity-40">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
