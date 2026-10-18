import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Download, ExternalLink, Package, AlertCircle, RefreshCw } from 'lucide-react';
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
    <div className="pt-20 pb-28 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-mc-white">Bedrock addons</h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-400">Bedrock</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-orange-500/20 text-orange-300">CurseForge</span>
        </div>
        <p className="text-sm text-mc-muted mb-1">
          Browse Bedrock add-ons from CurseForge. A direct download opens when the API provides a verified file URL; otherwise the official project page opens.
        </p>
        {data?.lastSynced && (
          <p className="text-xs text-mc-muted mb-4">
            Last synced: {new Date(data.lastSynced).toLocaleString()} · {(data.resources || []).length} items
          </p>
        )}

        <div className="bg-mc-surface border border-mc-border rounded-xl p-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter addons..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <p className="text-xs text-mc-muted mt-2">{filtered.length} shown</p>
        </div>

        {error && (
          <div className="flex gap-2 text-sm text-amber-200 mb-4 bg-amber-900/20 border border-amber-800 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div>
              <p>{error}</p>
              <p className="mt-1 text-xs opacity-80">
                Add GitHub Secret <code>CURSEFORGE_API_KEY</code>, run workflow sync, then redeploy. API keys must not be called from the browser (403).
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
            <p>No addons in local catalogue yet.</p>
            <Link to="/bedrock" className="text-sm text-emerald-400 mt-2 inline-block">
              Bedrock hub / MCPEDL
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m, i) => (
              <motion.a
                key={m.id}
                href={m.downloadUrl || m.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.2) }}
                className="block bg-mc-surface border border-mc-border rounded-xl overflow-hidden hover:border-emerald-500/45 transition-colors"
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
                  <h3 className="font-semibold text-mc-white text-sm line-clamp-1">{m.name}</h3>
                  <p className="text-xs text-mc-muted mt-1 line-clamp-2">{m.summary}</p>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-mc-muted border-t border-mc-border pt-2.5">
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {formatNumber(m.downloadCount || 0)}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      {m.downloadUrl ? 'Direct download' : 'Official download page'} <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
