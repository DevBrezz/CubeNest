import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Download, ExternalLink, Package, AlertCircle, RefreshCw, ArrowLeft, ShieldCheck } from 'lucide-react';
import { formatNumber } from '../lib/utils';

type BedrockItem = {
  id: number;
  slug: string;
  name: string;
  summary: string;
  downloadCount: number;
  logo: string | null;
  url: string;
  downloadUrl?: string | null;
  fileName?: string | null;
  authors?: string[];
  categories?: string[];
};

type BedrockData = {
  lastSynced: string | null;
  gameId?: number;
  resources: BedrockItem[];
  error?: string;
};

export function BedrockCatalog() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [data, setData] = useState<BedrockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}data/bedrock-curseforge.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`Catalog missing (${r.status}). Run sync-bedrock-curseforge in CI.`);
        return r.json();
      })
      .then((j: BedrockData) => {
        if (!cancelled) {
          setData(j);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setParams((p) => {
        const n = new URLSearchParams(p);
        if (query) n.set('q', query);
        else n.delete('q');
        return n;
      }, { replace: true });
    }, 200);
    return () => clearTimeout(t);
  }, [query, setParams]);

  const filtered = useMemo(() => {
    const list = data?.resources || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        (m.categories || []).some((c) => c.toLowerCase().includes(q)) ||
        (m.authors || []).some((a) => a.toLowerCase().includes(q))
    );
  }, [data, query]);

  return (
    <div className="pt-20 pb-20 min-h-screen mc-grid-bg overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Link to="/bedrock" className="inline-flex items-center gap-1.5 text-xs text-mc-muted hover:text-emerald-300 mb-5"><ArrowLeft className="w-3.5 h-3.5"/> Bedrock library</Link>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-300/20 bg-gradient-to-br from-emerald-500/10 via-mc-surface to-cyan-500/5 p-5 sm:p-8 mb-6">
          <div className="absolute -right-12 -top-20 w-64 h-64 rounded-full bg-emerald-300/[.07] blur-3xl"/>
          <div className="relative flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/10 border border-emerald-300/20 text-emerald-200">Bedrock edition</span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-400/10 border border-orange-300/20 text-orange-200">CurseForge</span>
          </div>
          <h1 className="relative mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-mc-white">Bedrock downloads</h1>
          <p className="relative text-sm text-mc-muted mt-2 max-w-2xl leading-relaxed">Discover add-ons, maps and textures from CurseForge. If a direct file link is available from the publisher, use Download; otherwise, CubeNest sends you to the official project page.</p>
        {data?.lastSynced && (
          <p className="relative text-xs text-mc-muted mt-3">Last synced: {new Date(data.lastSynced).toLocaleString()} · {(data.resources || []).length.toLocaleString()} projects indexed</p>
        )}
        </div>

        <div className="bg-mc-surface/90 border border-mc-border rounded-2xl p-3 sm:p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter addons..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3"><p className="text-xs text-mc-muted">Showing <strong className="text-mc-white">{filtered.length}</strong> of {(data?.resources || []).length} projects</p><span className="inline-flex items-center gap-1 text-[10px] text-emerald-300"><ShieldCheck className="w-3 h-3"/> Publisher source links</span></div>
        </div>

        {error && (
          <div className="flex gap-2 text-sm text-amber-200 mb-4 bg-amber-900/20 border border-amber-800 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div>
              <p>{error}</p>
              <p className="mt-1 text-xs opacity-80">
                The Bedrock index is empty or could not sync. Configure the <code>CURSEFORGE_API_KEY</code> GitHub secret and run the resource sync workflow. Keep API keys server-side; never expose them in browser code.
              </p>
              <a href="https://mcpedl.com/" className="text-emerald-400 text-xs inline-flex items-center gap-1 mt-2" target="_blank" rel="noreferrer">
                Open MCPEDL <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="skeleton h-48 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-mc-muted">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-semibold text-mc-white">No Bedrock projects found</p>
            <Link to="/bedrock" className="text-sm text-emerald-400 mt-2 inline-block">
              Bedrock hub / MCPEDL
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m, i) => (
              <motion.article
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.025, 0.25) }}
                className="group bg-mc-surface border border-mc-border rounded-2xl overflow-hidden hover:border-emerald-300/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 transition-all"
              >
                <div className="aspect-[16/10] bg-mc-gray flex items-center justify-center relative">
                  {m.logo ? (
                    <img src={m.logo} alt="" className="w-16 h-16 rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <Package className="w-10 h-10 text-mc-muted" />
                  )}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-600/90 text-white">Bedrock</span>
                </div>
                <div className="p-3.5">
                  <h3 className="font-semibold text-mc-white text-sm line-clamp-1 group-hover:text-emerald-200 transition-colors">{m.name}</h3>
                  <p className="text-xs text-mc-muted mt-1 line-clamp-2">{m.summary}</p>
                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-mc-muted border-t border-mc-border pt-3">
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />{formatNumber(m.downloadCount || 0)}</span>
                    <a href={m.downloadUrl || m.url} target={m.downloadUrl ? undefined : '_blank'} rel="noopener noreferrer" download={m.downloadUrl ? true : undefined} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-2 font-bold text-slate-950 hover:bg-emerald-300 transition-colors">
                      <Download className="w-3.5 h-3.5"/>{m.downloadUrl ? 'Direct download' : 'Get file'}{!m.downloadUrl && <ExternalLink className="w-3 h-3"/>}
                    </a>
                  </div>
                  {m.fileName && <p className="mt-2 text-[10px] text-mc-muted truncate">File: {m.fileName}</p>}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
