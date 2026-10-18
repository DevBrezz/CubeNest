import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Copy, Check, Server, Users, RefreshCw, ExternalLink, ThumbsUp } from 'lucide-react';
import { copyToClipboard } from '../lib/utils';

interface ApiServer {
  id: string;
  slug: string;
  name: string;
  classification?: { tags?: string[]; gameMode?: string };
  primaryConnection?: {
    edition?: string;
    host?: string;
    port?: number;
    latest?: { outcome?: string; playersOnline?: number; playersMax?: number };
  };
}

const EMOJIS = ['🔥', '❤️', '👍', '😎', '⚔️', '🏠'];

function reactionsKey(id: string) {
  return `cubenest-react-${id}`;
}

function loadReactions(id: string): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(reactionsKey(id)) || '{}');
  } catch {
    return {};
  }
}

function saveReaction(id: string, emoji: string) {
  const cur = loadReactions(id);
  cur[emoji] = (cur[emoji] || 0) + 1;
  localStorage.setItem(reactionsKey(id), JSON.stringify(cur));
  return cur;
}

export function Servers() {
  const [search, setSearch] = useState('');
  const [edition, setEdition] = useState<'all' | 'java' | 'bedrock'>('all');
  const [copied, setCopied] = useState<string | null>(null);
  const [servers, setServers] = useState<ApiServer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactTick, setReactTick] = useState(0);

  const load = (p = page) => {
    setLoading(true);
    setError(null);
    const ac = new AbortController();
    const params = new URLSearchParams({ page: String(p), sort: 'ranked' });
    fetch(`https://newminecraftservers.net/api/v1/servers?${params}`, { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Server list unavailable (${r.status})`);
        return r.json();
      })
      .then((json) => {
        const data = json.data || json;
        setServers(data.items || []);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || p);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Failed to load');
        setServers([]);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  };

  useEffect(() => {
    const cancel = load(page);
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filtered = useMemo(() => {
    return servers.filter((s) => {
      const ed = (s.primaryConnection?.edition || '').toLowerCase();
      if (edition !== 'all' && ed && ed !== edition) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const host = s.primaryConnection?.host || '';
      return (
        s.name.toLowerCase().includes(q) ||
        host.toLowerCase().includes(q) ||
        (s.classification?.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [servers, search, edition]);

  const addressOf = (s: ApiServer) => {
    const c = s.primaryConnection;
    if (!c?.host) return '';
    const port = c.port && c.port !== 25565 && c.port !== 19132 ? `:${c.port}` : '';
    return `${c.host}${port}`;
  };

  const onCopy = async (addr: string) => {
    if (await copyToClipboard(addr)) {
      setCopied(addr);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const onReact = (id: string, emoji: string) => {
    saveReaction(id, emoji);
    setReactTick((x) => x + 1);
  };

  return (
    <div className="pt-20 pb-12 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-mc-white">Minecraft Servers</h1>
            <p className="text-sm text-mc-muted mt-1">
              Live listings (public server API). Copy IP, react with emoji, or open external lists to vote.
            </p>
          </div>
          <div className="flex gap-2">
            <a href="https://minecraft-serverlist.com/" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-mc-surface border border-mc-border hover:border-mc-red/40">
              minecraft-serverlist.com <ExternalLink className="w-3 h-3" />
            </a>
            <button type="button" onClick={() => load(page)} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-mc-surface border border-mc-border">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        <div className="bg-mc-surface border border-mc-border rounded-xl p-3 mb-5 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted" />
            <input type="search" placeholder="Search servers..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-mc-red" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'java', 'bedrock'] as const).map((e) => (
              <button key={e} type="button" onClick={() => setEdition(e)}
                className={`px-3 py-1.5 rounded-lg text-xs border capitalize ${edition === e ? 'bg-mc-red border-mc-red text-white' : 'bg-mc-gray border-mc-border text-mc-text'}`}>
                {e === 'all' ? 'All editions' : e}
              </button>
            ))}
            <span className="text-xs text-mc-muted ml-auto self-center">{filtered.length} on page</span>
          </div>
        </div>

        {error && <div className="text-sm text-red-300 mb-4">{error}</div>}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-mc-muted">
            <Server className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No servers match.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((s, i) => {
              const addr = addressOf(s);
              const online = s.primaryConnection?.latest?.outcome === 'online';
              const players = s.primaryConnection?.latest?.playersOnline;
              const max = s.primaryConnection?.latest?.playersMax;
              const ed = s.primaryConnection?.edition || 'java';
              const reacts = loadReactions(s.id);
              void reactTick;
              return (
                <motion.article key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.12) }}
                  className="bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-mc-red/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-mc-white text-sm">{s.name}</h2>
                      <p className="text-[11px] text-mc-muted mt-0.5 capitalize">
                        {ed}
                        {online ? ' · Online' : ' · Status unknown'}
                        {(s.classification?.tags || []).slice(0, 3).map((t) => ` · ${t}`).join('')}
                      </p>
                    </div>
                    {players != null && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-mc-muted shrink-0">
                        <Users className="w-3 h-3" /> {players}{max != null ? `/${max}` : ''}
                      </span>
                    )}
                  </div>
                  {addr && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <code className="text-xs font-mono text-mc-red bg-mc-gray px-2 py-1 rounded">{addr}</code>
                      <button type="button" onClick={() => onCopy(addr)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-mc-gray border border-mc-border text-[11px]">
                        {copied === addr ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        {copied === addr ? 'Copied' : 'Copy IP'}
                      </button>
                      <a href={`https://minecraft-serverlist.com/search?q=${encodeURIComponent(s.name)}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-mc-gray border border-mc-border text-[11px] hover:border-mc-red/40">
                        <ThumbsUp className="w-3 h-3" /> Vote on ServerList
                      </a>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {EMOJIS.map((em) => (
                      <button key={em} type="button" onClick={() => onReact(s.id, em)}
                        className="px-2 py-0.5 rounded-md bg-mc-gray border border-mc-border text-xs hover:border-mc-red/40">
                        {em} {(reacts[em] || 0) > 0 ? reacts[em] : ''}
                      </button>
                    ))}
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg bg-mc-surface border border-mc-border text-sm disabled:opacity-40">Previous</button>
            <span className="px-3 py-2 text-sm text-mc-muted">{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg bg-mc-surface border border-mc-border text-sm disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
