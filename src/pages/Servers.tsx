import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Copy, Check, Server, Users, RefreshCw } from 'lucide-react';
import { copyToClipboard } from '../lib/utils';

interface ListedServer {
  id: string;
  name: string;
  address: string;
  description: string;
  edition: 'Java' | 'Bedrock' | 'Both';
  source: 'minehut' | 'popular';
  players?: number;
  maxPlayers?: number;
  online?: boolean;
  version?: string;
}

const POPULAR: Omit<ListedServer, 'players' | 'maxPlayers' | 'online' | 'version'>[] = [
  { id: 'hypixel', name: 'Hypixel', address: 'mc.hypixel.net', description: 'One of the largest Java minigame networks.', edition: 'Java', source: 'popular' },
  { id: 'cubecraft', name: 'CubeCraft', address: 'play.cubecraft.net', description: 'Minigames for Java and Bedrock.', edition: 'Both', source: 'popular' },
  { id: 'minehut', name: 'Minehut Lobby', address: 'minehut.com', description: 'Host and join community servers on Minehut.', edition: 'Java', source: 'popular' },
  { id: 'thehive', name: 'The Hive', address: 'play.hive.bedrock', description: 'Bedrock minigames network.', edition: 'Bedrock', source: 'popular' },
  { id: 'wynncraft', name: 'Wynncraft', address: 'play.wynncraft.com', description: 'MMORPG server on Java.', edition: 'Java', source: 'popular' },
];

export function Servers() {
  const [search, setSearch] = useState('');
  const [edition, setEdition] = useState<'all' | 'Java' | 'Bedrock'>('all');
  const [copied, setCopied] = useState<string | null>(null);
  const [servers, setServers] = useState<ListedServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    const ac = new AbortController();

    // Minehut public server list
    const minehut = fetch('https://api.minehut.com/servers', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Minehut unavailable'))))
      .then((data: { servers?: Array<{ name?: string; motd?: string; playerData?: { playerCount?: number; maxPlayers?: number }; staticInfo?: { platform?: string }; visibility?: boolean }> }) => {
        const list = (data.servers || []).slice(0, 40).map((s, i) => {
          const name = s.name || `Server ${i + 1}`;
          return {
            id: `mh-${name}`,
            name,
            address: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.minehut.gg`,
            description: (s.motd || '').replace(/<[^>]+>/g, '').slice(0, 160) || 'Minehut community server',
            edition: (s.staticInfo?.platform === 'bedrock' ? 'Bedrock' : 'Java') as ListedServer['edition'],
            source: 'minehut' as const,
            players: s.playerData?.playerCount,
            maxPlayers: s.playerData?.maxPlayers,
            online: true,
          };
        });
        return list;
      })
      .catch(() => [] as ListedServer[]);

    // Status for popular servers via mcsrvstat
    const popularStatuses = Promise.all(
      POPULAR.map(async (p) => {
        try {
          const host = p.address.includes('hive') ? 'geo.hivebedrock.network' : p.address;
          const r = await fetch(`https://api.mcsrvstat.us/2/${encodeURIComponent(host)}`, { signal: ac.signal });
          if (!r.ok) return { ...p } as ListedServer;
          const j = await r.json();
          return {
            ...p,
            online: Boolean(j.online),
            players: j.players?.online,
            maxPlayers: j.players?.max,
            version: typeof j.version === 'string' ? j.version : j.version?.name,
          } as ListedServer;
        } catch {
          return { ...p } as ListedServer;
        }
      })
    );

    Promise.all([minehut, popularStatuses])
      .then(([mh, pop]) => {
        setServers([...pop, ...mh]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load servers'))
      .finally(() => setLoading(false));

    return () => ac.abort();
  };

  useEffect(() => {
    const cancel = load();
    return cancel;
  }, []);

  const filtered = useMemo(() => {
    return servers.filter((s) => {
      if (edition === 'Java' && s.edition === 'Bedrock') return false;
      if (edition === 'Bedrock' && s.edition === 'Java') return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    });
  }, [servers, search, edition]);

  const onCopy = async (addr: string) => {
    if (await copyToClipboard(addr)) {
      setCopied(addr);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="pt-20 pb-12 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-mc-white">Minecraft Servers</h1>
            <p className="text-mc-muted mt-1 text-sm">
              Popular networks (status via mcsrvstat.us) + public Minehut list.
            </p>
          </div>
          <button type="button" onClick={() => load()} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-mc-surface border border-mc-border hover:border-mc-red/40">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="bg-mc-surface border border-mc-border rounded-xl p-3 mb-5 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted" />
            <input type="search" placeholder="Search servers..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-mc-red" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'Java', 'Bedrock'] as const).map((e) => (
              <button key={e} type="button" onClick={() => setEdition(e)}
                className={`px-3 py-1.5 rounded-lg text-xs border ${edition === e ? 'bg-mc-red border-mc-red text-white' : 'bg-mc-gray border-mc-border text-mc-text'}`}>
                {e === 'all' ? 'All' : e}
              </button>
            ))}
            <span className="text-xs text-mc-muted ml-auto self-center">{filtered.length} servers</span>
          </div>
        </div>

        {error && <div className="text-sm text-red-300 mb-4">{error}</div>}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-mc-muted">
            <Server className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No servers match.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((s, i) => (
              <motion.article key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.15) }}
                className="bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-mc-red/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-mc-white text-sm">{s.name}</h2>
                    <p className="text-[11px] text-mc-muted mt-0.5">
                      {s.edition} · {s.source === 'minehut' ? 'Minehut' : 'Popular'}
                      {s.version ? ` · ${s.version}` : ''}
                      {s.online === true ? ' · Online' : s.online === false ? ' · Offline' : ''}
                    </p>
                  </div>
                  {(s.players != null) && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-mc-muted shrink-0">
                      <Users className="w-3 h-3" /> {s.players}{s.maxPlayers != null ? `/${s.maxPlayers}` : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-mc-muted mt-2 line-clamp-2">{s.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <code className="text-xs font-mono text-mc-red bg-mc-gray px-2 py-1 rounded">{s.address}</code>
                  <button type="button" onClick={() => onCopy(s.address)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-mc-gray border border-mc-border text-[11px] hover:border-mc-red/50">
                    {copied === s.address ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied === s.address ? 'Copied' : 'Copy IP'}
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
