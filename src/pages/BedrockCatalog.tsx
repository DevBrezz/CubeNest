import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Download, ExternalLink, Package, AlertCircle } from 'lucide-react';
import { isCurseForgeConfigured, searchBedrockMods, type CfMod } from '../lib/curseforge';
import { formatNumber } from '../lib/utils';

export function BedrockCatalog() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [page, setPage] = useState(0);
  const [mods, setMods] = useState<CfMod[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isCurseForgeConfigured();

  useEffect(() => {
    if (!configured) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    searchBedrockMods({ query: query.trim() || undefined, page, pageSize: 24 })
      .then((res) => {
        setMods(res.data || []);
        setTotal(res.pagination?.totalCount || 0);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Search failed');
        setMods([]);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [query, page, configured]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setParams((p) => {
        const n = new URLSearchParams(p);
        if (query) n.set('q', query);
        else n.delete('q');
        return n;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [query, setParams]);

  if (!configured) {
    return (
      <div className="pt-20 pb-28 min-h-screen px-4">
        <div className="max-w-lg mx-auto bg-mc-surface border border-mc-border rounded-xl p-6">
          <h1 className="text-xl font-bold text-mc-white flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400">Bedrock</span>
            CurseForge catalog
          </h1>
          <p className="text-sm text-mc-muted mt-3">
            To search and download Bedrock addons inside CubeNest, add a free CurseForge API key:
          </p>
          <ol className="text-sm text-mc-muted mt-3 list-decimal list-inside space-y-1">
            <li>Open console.curseforge.com and create an API key</li>
            <li>Set <code className="text-mc-red">VITE_CURSEFORGE_API_KEY</code> in <code>.env</code></li>
            <li>Rebuild the site</li>
          </ol>
          <a href="https://mcpedl.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-4 text-sm text-emerald-400">
            Meanwhile browse MCPEDL <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Link to="/bedrock" className="block mt-3 text-sm text-mc-muted hover:text-mc-white">← Bedrock hub</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-28 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-mc-white">Bedrock addons</h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-400">Bedrock</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-orange-500/20 text-orange-300">CurseForge</span>
        </div>
        <p className="text-sm text-mc-muted mb-4">Search and open official CurseForge pages to download.</p>

        <div className="bg-mc-surface border border-mc-border rounded-xl p-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder="Search Bedrock addons on CurseForge..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <p className="text-xs text-mc-muted mt-2">{total.toLocaleString()} results</p>
        </div>

        {error && (
          <div className="flex gap-2 text-sm text-red-300 mb-4 bg-red-900/20 border border-red-800 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
          </div>
        ) : mods.length === 0 ? (
          <div className="text-center py-16 text-mc-muted">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
            No addons found.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mods.map((m, i) => {
                const href = m.links?.websiteUrl || `https://www.curseforge.com/minecraft-bedrock/addons/${m.slug}`;
                const icon = m.logo?.thumbnailUrl || m.logo?.url;
                return (
                  <motion.a
                    key={m.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.2) }}
                    className="block bg-mc-surface border border-mc-border rounded-xl overflow-hidden hover:border-emerald-500/45 transition-colors"
                  >
                    <div className="aspect-[16/10] bg-mc-gray flex items-center justify-center relative">
                      {icon ? <img src={icon} alt="" className="w-16 h-16 rounded-xl object-cover" loading="lazy" /> : <Package className="w-10 h-10 text-mc-muted" />}
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-600/90 text-white">Bedrock</span>
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-semibold text-mc-white text-sm line-clamp-1">{m.name}</h3>
                      <p className="text-xs text-mc-muted mt-1 line-clamp-2">{m.summary}</p>
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-mc-muted border-t border-mc-border pt-2.5">
                        <span className="flex items-center gap-1"><Download className="w-3 h-3" />{formatNumber(m.downloadCount || 0)}</span>
                        <span className="flex items-center gap-1 text-emerald-400">Download <ExternalLink className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </motion.a>
                );
              })}
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <button type="button" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="px-4 py-2 rounded-lg bg-mc-surface border border-mc-border text-sm disabled:opacity-40">Previous</button>
              <span className="px-3 py-2 text-sm text-mc-muted">Page {page + 1}</span>
              <button type="button" disabled={(page + 1) * 24 >= total} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-lg bg-mc-surface border border-mc-border text-sm disabled:opacity-40">Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
