import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Download, ExternalLink, Package, AlertCircle, RefreshCw } from 'lucide-react';
import { searchProjects, type ModrinthHit, type ModrinthProjectType } from '../lib/modrinth';
import { formatNumber } from '../lib/utils';

const TYPE_META: Record<string, { title: string; blurb: string; type: ModrinthProjectType }> = {
  mods: { title: 'Mods', blurb: 'Minecraft mods from Modrinth — search and download.', type: 'mod' },
  resourcepacks: { title: 'Resource Packs', blurb: 'Textures, styles, and skin packs from Modrinth.', type: 'resourcepack' },
  shaders: { title: 'Shaders', blurb: 'Lighting and visual packs from Modrinth.', type: 'shader' },
  modpacks: { title: 'Modpacks', blurb: 'Curated packs from Modrinth.', type: 'modpack' },
  datapacks: { title: 'Data Packs', blurb: 'Vanilla-friendly packs from Modrinth.', type: 'datapack' },
  modrinthplugins: { title: 'Modrinth Plugins', blurb: 'Server plugins published on Modrinth — inspect versions and download files.', type: 'plugin' },
};

export function Catalog({ category }: { category: keyof typeof TYPE_META }) {
  const meta = TYPE_META[category];
  const [params, setParams] = useSearchParams();
  const q0 = params.get('q') || '';
  const platform = params.get('platform') || '';
  const [query, setQuery] = useState(q0);
  const [hits, setHits] = useState<ModrinthHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'relevance' | 'downloads' | 'updated' | 'newest'>('relevance');
  const [offset, setOffset] = useState(0);
  const limit = 24;

  // Merge platform hint into search for bedrock
  const effectiveQuery = useMemo(() => {
    const parts = [query.trim()];
    if (platform === 'bedrock' && query && !/bedrock/i.test(query)) parts.push('bedrock');
    if (platform === 'bedrock' && !query) parts.push('bedrock');
    return parts.filter(Boolean).join(' ');
  }, [query, platform]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setParams((p) => {
        const next = new URLSearchParams(p);
        if (query) next.set('q', query); else next.delete('q');
        if (platform) next.set('platform', platform);
        return next;
      }, { replace: true });
    }, 280);
    return () => clearTimeout(t);
  }, [query, platform, setParams]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    searchProjects({
      query: effectiveQuery || undefined,
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
  }, [effectiveQuery, sort, offset, meta.type]);

  const pages = useMemo(() => Math.ceil(total / limit) || 1, [total]);
  const detailBase = category === 'mods' ? '/mods' : category === 'modrinthplugins' ? '/modrinth-plugins' : `/${category}`;

  return (
    <div className="pt-20 pb-12 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-mc-white">{meta.title}</h1>
            {platform && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${platform === 'bedrock' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-mc-red/20 text-mc-red'}`}>
                {platform}
              </span>
            )}
          </div>
          <p className="text-mc-muted mt-1 text-sm">{meta.blurb}</p>
        </div>

        <div className="bg-mc-surface border border-mc-border rounded-xl p-3 mb-6 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted" />
            <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setOffset(0); }}
              placeholder={`Search ${meta.title.toLowerCase()} on Modrinth...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-mc-red" />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={sort} onChange={(e) => { setSort(e.target.value as typeof sort); setOffset(0); }}
              className="px-3 py-1.5 rounded-lg bg-mc-gray border border-mc-border text-xs text-mc-text">
              <option value="relevance">Relevance</option>
              <option value="downloads">Downloads</option>
              <option value="updated">Recently updated</option>
              <option value="newest">Newest</option>
            </select>
            <span className="text-xs text-mc-muted ml-auto">{total.toLocaleString()} results</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-xl p-4 mb-5 text-sm flex gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-medium">Could not load catalog</p>
              <p className="mt-1 opacity-80">{error}</p>
              <button type="button" className="mt-2 text-mc-red hover:underline inline-flex items-center gap-1" onClick={() => setOffset((o) => o)}>
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-xl" />)}
          </div>
        ) : hits.length === 0 ? (
          <div className="text-center py-16 text-mc-muted">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No projects found on Modrinth.</p>
            <p className="text-sm mt-1">Try another search term.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hits.map((h, i) => (
                <motion.article key={h.project_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.2) }}
                  className="group bg-mc-surface border border-mc-border rounded-xl overflow-hidden hover:border-mc-red/50 transition-colors">
                  <Link to={`${detailBase}/${h.slug}`} className="block">
                    <div className="aspect-[16/10] bg-mc-gray flex items-center justify-center relative">
                      {h.icon_url ? <img src={h.icon_url} alt="" className="w-16 h-16 rounded-xl object-cover group-hover:scale-105 transition-transform" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement?.querySelector('[data-image-fallback]')?.classList.remove('hidden'); }} /> : null}<Package data-image-fallback className={`w-10 h-10 text-mc-muted ${h.icon_url ? 'hidden' : ''}`} />
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-green-600/90 text-white">Modrinth</span>
                        {platform === 'bedrock' && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/90 text-white">Bedrock</span>}
                        {platform === 'java' && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-red-600/90 text-white">Java</span>}
                        {!platform && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-mc-gray/90 text-mc-muted border border-mc-border">Java-first</span>}
                      </div>
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-semibold text-mc-white text-sm line-clamp-1 group-hover:text-mc-red-bright">{h.title}</h3>
                      <p className="mt-1 text-xs text-mc-muted line-clamp-2">{h.description}</p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-mc-muted border-t border-mc-border pt-2.5">
                        <span className="flex items-center gap-1"><Download className="w-3 h-3" />{formatNumber(h.downloads)}</span>
                        <span className="flex items-center gap-1">Details <ExternalLink className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
            {pages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
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
