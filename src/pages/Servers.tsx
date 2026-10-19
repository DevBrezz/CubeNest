import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Copy, Check, Server, Users, RefreshCw, Wifi, WifiOff,
  Gamepad2, Sparkles, ChevronLeft, ChevronRight, ImageOff,
} from 'lucide-react';
import { copyToClipboard, formatNumber } from '../lib/utils';

interface ServerMedia {
  iconUrl?: string | null;
  bannerUrl?: string | null;
  motdImageUrl?: string | null;
}

interface ApiServer {
  id: string;
  slug: string;
  name: string;
  classification?: {
    tags?: string[];
    gameMode?: string;
    genreIds?: string[];
    primaryGenreIds?: string[];
    crossplay?: boolean;
  };
  media?: ServerMedia;
  primaryConnection?: {
    edition?: string;
    host?: string;
    port?: number;
    latest?: {
      outcome?: string;
      playersOnline?: number;
      playersMax?: number;
      versionName?: string;
      motdPlain?: string;
      latencyMs?: number;
    };
  };
  availableEditions?: string[];
  award?: { kind?: string; position?: number };
}

const EMOJIS = ['🔥', '❤️', '👍', '😎', '⚔️', '🏠', '💎', '🐉'];
const API = 'https://newminecraftservers.net/api/v1/servers';

function reactionsKey(id: string) {
  return `cubenest-react-${id}`;
}

function loadReaction(id: string): string | null {
  try {
    const raw = localStorage.getItem(reactionsKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { emoji?: string } | string;
    if (typeof parsed === 'string') return parsed;
    return parsed.emoji || null;
  } catch {
    return null;
  }
}

function saveReactionOnce(id: string, emoji: string): boolean {
  if (loadReaction(id)) return false;
  localStorage.setItem(reactionsKey(id), JSON.stringify({ emoji, at: Date.now() }));
  return true;
}

function tagsOf(s: ApiServer): string[] {
  const fromTags = s.classification?.tags || [];
  const fromGenres = s.classification?.primaryGenreIds || s.classification?.genreIds || [];
  const merged = [...fromTags, ...fromGenres].map(String).filter(Boolean);
  return [...new Set(merged)].slice(0, 6);
}

function ServerBanner({ server }: { server: ApiServer }) {
  const [failed, setFailed] = useState(false);
  const banner = server.media?.bannerUrl;
  const icon = server.media?.iconUrl;
  const online = server.primaryConnection?.latest?.outcome === 'online';

  if (banner && !failed) {
    return (
      <div className="relative aspect-[468/60] sm:aspect-[5/1] w-full overflow-hidden bg-gradient-to-br from-slate-900 via-mc-gray to-emerald-950">
        <img
          src={banner}
          alt={`${server.name} banner`}
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
          onError={() => setFailed(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur ${online ? 'bg-emerald-500/90 text-slate-950' : 'bg-black/60 text-mc-muted'}`}>
            {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    );
  }

  // Animated gradient fallback when no GIF/banner is available
  return (
    <div className="relative aspect-[468/60] sm:aspect-[5/1] w-full overflow-hidden bg-gradient-to-r from-emerald-950 via-cyan-950 to-violet-950">
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(52,211,153,0.35), transparent 40%), radial-gradient(circle at 80% 40%, rgba(34,211,238,0.25), transparent 35%)',
      }} />
      <div className="absolute inset-0 flex items-center gap-3 px-4">
        {icon ? (
          <img src={icon} alt="" className="h-10 w-10 rounded-lg border border-white/10 shadow-lg object-cover bg-black/40" loading="lazy" />
        ) : (
          <div className="h-10 w-10 rounded-lg border border-white/10 bg-black/30 flex items-center justify-center">
            <ImageOff className="w-4 h-4 text-mc-muted" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate drop-shadow">{server.name}</p>
          <p className="text-[11px] text-emerald-200/80 flex items-center gap-1">
            {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {online ? 'Live server' : 'Status unknown'} · banner not provided
          </p>
        </div>
      </div>
    </div>
  );
}

export function Servers() {
  const [search, setSearch] = useState('');
  const [edition, setEdition] = useState<'all' | 'java' | 'bedrock'>('all');
  const [copied, setCopied] = useState<string | null>(null);
  const [servers, setServers] = useState<ApiServer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactTick, setReactTick] = useState(0);
  const [selected, setSelected] = useState<ApiServer | null>(null);

  const load = useCallback((p = page) => {
    setLoading(true);
    setError(null);
    const ac = new AbortController();
    const params = new URLSearchParams({ page: String(p), sort: 'ranked' });
    fetch(`${API}?${params}`, { signal: ac.signal, headers: { Accept: 'application/json' } })
      .then((r) => {
        if (!r.ok) throw new Error(`Server list unavailable (${r.status})`);
        return r.json();
      })
      .then((json) => {
        const data = json.data || json;
        setServers(Array.isArray(data.items) ? data.items : []);
        setTotalPages(Number(data.totalPages) || 1);
        setTotal(Number(data.total) || 0);
        setPage(Number(data.page) || p);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Failed to load');
        setServers([]);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [page]);

  useEffect(() => {
    const cancel = load(page);
    return cancel;
  }, [page, load]);

  const filtered = useMemo(() => {
    return servers.filter((s) => {
      const ed = (s.primaryConnection?.edition || '').toLowerCase();
      if (edition !== 'all' && ed && ed !== edition) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const host = s.primaryConnection?.host || '';
      const tagHay = tagsOf(s).join(' ').toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        host.toLowerCase().includes(q) ||
        tagHay.includes(q)
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
    if (!saveReactionOnce(id, emoji)) return;
    setReactTick((x) => x + 1);
  };

  void reactTick;

  return (
    <div className="pt-20 pb-28 min-h-screen mc-grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/90 via-mc-surface to-violet-950/50 p-6 sm:p-9 mb-7"
        >
          <div className="absolute -right-16 -top-24 w-72 h-72 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 bottom-0 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
              <Sparkles className="w-3.5 h-3.5" /> Live public listings · stay on CubeNest
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-mc-white mt-4">
              Minecraft <span className="text-cyan-300">Servers</span>
            </h1>
            <p className="text-sm sm:text-base text-mc-muted mt-3 max-w-2xl leading-relaxed">
              Browse ranked Java &amp; Bedrock servers with full banners when the source provides them.
              Copy the IP in one tap — no redirects to external server lists.
            </p>
            <div className="flex flex-wrap gap-3 mt-5 text-xs text-mc-muted">
              <span className="rounded-lg bg-black/25 px-3 py-2 border border-white/5">
                {formatNumber(total || filtered.length)} servers indexed
              </span>
              <span className="rounded-lg bg-black/25 px-3 py-2 border border-white/5">
                Page {page} / {Math.max(totalPages, 1)}
              </span>
            </div>
          </div>
        </motion.section>

        {/* Controls */}
        <div className="bg-mc-surface/90 border border-mc-border rounded-2xl p-3 sm:p-4 mb-6 backdrop-blur">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted" />
            <input
              type="search"
              placeholder="Search by name, IP, or tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {(['all', 'java', 'bedrock'] as const).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEdition(e)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border capitalize transition-colors ${
                  edition === e
                    ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                    : 'bg-mc-gray border-mc-border text-mc-text hover:border-cyan-500/40'
                }`}
              >
                {e === 'all' ? 'All editions' : e}
              </button>
            ))}
            <button
              type="button"
              onClick={() => load(page)}
              className="ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-mc-gray border border-mc-border hover:border-cyan-500/40"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <span className="text-xs text-mc-muted">{filtered.length} on this page</span>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-amber-800 bg-amber-900/20 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-56 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-mc-muted bg-mc-surface border border-mc-border rounded-2xl">
            <Server className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-mc-white font-semibold">No servers match</p>
            <p className="text-sm mt-1">Try another edition filter or clear the search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((s, i) => {
              const addr = addressOf(s);
              const online = s.primaryConnection?.latest?.outcome === 'online';
              const players = s.primaryConnection?.latest?.playersOnline;
              const max = s.primaryConnection?.latest?.playersMax;
              const ed = s.primaryConnection?.edition || 'java';
              const version = s.primaryConnection?.latest?.versionName;
              const motd = s.primaryConnection?.latest?.motdPlain;
              const myReact = loadReaction(s.id);
              const tags = tagsOf(s);

              return (
                <motion.article
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.18) }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-mc-border bg-mc-surface shadow-lg shadow-black/20 hover:border-cyan-500/45 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <ServerBanner server={s} />

                  <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
                    <div className="flex items-start gap-3">
                      {s.media?.iconUrl ? (
                        <img
                          src={s.media.iconUrl}
                          alt=""
                          className="w-12 h-12 rounded-xl border border-white/10 object-cover bg-black/30 shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl border border-white/10 bg-mc-gray flex items-center justify-center shrink-0">
                          <Gamepad2 className="w-5 h-5 text-mc-muted" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold text-mc-white text-base truncate">{s.name}</h2>
                          {s.award?.position != null && (
                            <span className="text-[10px] font-bold uppercase tracking-wide rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5">
                              #{s.award.position} {s.award.kind || 'ranked'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-mc-muted mt-0.5 capitalize flex flex-wrap gap-x-2">
                          <span>{ed}</span>
                          {version && <span className="truncate max-w-[14rem]">{version}</span>}
                          {s.classification?.crossplay && <span className="text-cyan-300/90">Crossplay</span>}
                        </p>
                      </div>
                      {players != null && (
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-mc-white tabular-nums flex items-center gap-1 justify-end">
                            <Users className="w-3.5 h-3.5 text-cyan-300" />
                            {formatNumber(players)}
                            {max != null ? <span className="text-mc-muted font-normal">/{formatNumber(max)}</span> : null}
                          </p>
                          <p className="text-[10px] text-mc-muted">{online ? 'players online' : 'last known'}</p>
                        </div>
                      )}
                    </div>

                    {motd && (
                      <p className="text-xs text-mc-muted leading-relaxed line-clamp-2 rounded-xl bg-black/20 border border-white/5 px-3 py-2">
                        {motd}
                      </p>
                    )}

                    {!!tags.length && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((t) => (
                          <span key={t} className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md bg-mc-gray border border-mc-border text-mc-muted">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      {addr ? (
                        <>
                          <code className="text-xs font-mono text-cyan-200 bg-black/30 border border-cyan-500/20 px-2.5 py-1.5 rounded-lg max-w-full truncate">
                            {addr}
                          </code>
                          <button
                            type="button"
                            onClick={() => void onCopy(addr)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors"
                          >
                            {copied === addr ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied === addr ? 'Copied' : 'Copy IP'}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-mc-muted">No public address listed</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelected(s)}
                        className="ml-auto text-xs font-semibold text-cyan-300 hover:text-cyan-200 px-2 py-1.5"
                      >
                        Details
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 items-center border-t border-mc-border pt-3">
                      {myReact ? (
                        <span className="text-xs text-mc-muted">Your reaction: <span className="text-base ml-1">{myReact}</span></span>
                      ) : (
                        <>
                          <span className="text-[10px] text-mc-muted mr-1">React</span>
                          {EMOJIS.map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => onReact(s.id, em)}
                              className="px-1.5 py-0.5 rounded-md bg-mc-gray border border-mc-border text-sm hover:border-cyan-500/40 hover:scale-110 transition-transform"
                              title="One reaction per server on this device"
                            >
                              {em}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex flex-wrap justify-center items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-mc-surface border border-mc-border text-sm font-semibold disabled:opacity-40 hover:border-cyan-500/40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="px-4 py-2 text-sm text-mc-muted tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-mc-surface border border-mc-border text-sm font-semibold disabled:opacity-40 hover:border-cyan-500/40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* In-app detail sheet — no external navigation */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-mc-border bg-mc-surface shadow-2xl"
            >
              <ServerBanner server={selected} />
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  {selected.media?.iconUrl && (
                    <img src={selected.media.iconUrl} alt="" className="w-14 h-14 rounded-xl border border-white/10 object-cover" />
                  )}
                  <div className="min-w-0">
                    <h2 className="text-xl font-black text-mc-white">{selected.name}</h2>
                    <p className="text-xs text-mc-muted capitalize mt-1">
                      {(selected.primaryConnection?.edition || 'java')}
                      {selected.primaryConnection?.latest?.versionName
                        ? ` · ${selected.primaryConnection.latest.versionName}`
                        : ''}
                    </p>
                  </div>
                </div>
                {selected.primaryConnection?.latest?.motdPlain && (
                  <p className="text-sm text-mc-muted leading-relaxed rounded-xl bg-black/25 border border-white/5 px-3 py-2">
                    {selected.primaryConnection.latest.motdPlain}
                  </p>
                )}
                {addressOf(selected) && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <code className="text-sm font-mono text-cyan-200 bg-black/30 border border-cyan-500/20 px-3 py-2 rounded-xl">
                      {addressOf(selected)}
                    </code>
                    <button
                      type="button"
                      onClick={() => void onCopy(addressOf(selected))}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-sm font-bold"
                    >
                      {copied === addressOf(selected) ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      Copy IP
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-mc-gray border border-mc-border p-3">
                    <p className="text-[11px] text-mc-muted">Players</p>
                    <p className="font-bold text-mc-white mt-0.5">
                      {selected.primaryConnection?.latest?.playersOnline ?? '—'}
                      {selected.primaryConnection?.latest?.playersMax != null
                        ? ` / ${selected.primaryConnection.latest.playersMax}`
                        : ''}
                    </p>
                  </div>
                  <div className="rounded-xl bg-mc-gray border border-mc-border p-3">
                    <p className="text-[11px] text-mc-muted">Status</p>
                    <p className="font-bold text-mc-white mt-0.5 capitalize">
                      {selected.primaryConnection?.latest?.outcome || 'unknown'}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-mc-muted leading-relaxed">
                  Everything stays inside CubeNest. Join by pasting the IP in Minecraft — we do not send you to external server list websites.
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="w-full py-3 rounded-xl border border-mc-border text-sm font-semibold text-mc-white hover:border-cyan-500/40"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
