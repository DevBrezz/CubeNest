import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Copy, Check, Server, Globe } from 'lucide-react';
import { copyToClipboard } from '../lib/utils';

/** Curated / example server directory — no fake online player counts. */
const SERVERS = [
  {
    id: 'demo-survival',
    name: 'CubeNest Survival Showcase',
    description: 'Example listing for the servers directory. Replace with real community servers when submissions are enabled.',
    address: 'play.example-cubenest.net',
    edition: 'Java' as const,
    version: '1.21+',
    categories: ['Survival', 'Community'],
    website: '',
  },
];

export function Servers() {
  const [search, setSearch] = useState('');
  const [edition, setEdition] = useState<'all' | 'Java' | 'Bedrock'>('all');
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return SERVERS.filter((s) => {
      if (edition !== 'all' && s.edition !== edition) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
    });
  }, [search, edition]);

  const onCopy = async (addr: string) => {
    const ok = await copyToClipboard(addr);
    if (ok) {
      setCopied(addr);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-mc-white">Minecraft Servers</h1>
          <p className="text-mc-muted mt-1 text-sm">
            Community server directory. Addresses are listed as provided — CubeNest does not display live player counts unless a verified status integration is configured.
          </p>
        </div>

        <div className="bg-mc-surface border border-mc-border rounded-xl p-4 mb-8 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted" />
            <input
              type="search"
              placeholder="Search servers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-mc-red"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'Java', 'Bedrock'] as const).map((e) => (
              <button key={e} type="button" onClick={() => setEdition(e)} className={`px-3 py-1.5 rounded-lg text-xs border ${edition === e ? 'bg-mc-red border-mc-red text-white' : 'bg-mc-gray border-mc-border text-mc-text'}`}>
                {e === 'all' ? 'All editions' : e}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-mc-muted">
            <Server className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No servers match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((s, i) => (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-mc-surface border border-mc-border rounded-xl p-5 hover:border-mc-red/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-mc-gray flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-mc-red" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-mc-white">{s.name}</h2>
                    <p className="text-xs text-mc-muted mt-0.5">{s.edition} · {s.version}</p>
                    <p className="text-sm text-mc-muted mt-2 leading-relaxed">{s.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {s.categories.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded bg-mc-gray text-[10px] text-mc-muted">{c}</span>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <code className="text-sm font-mono text-mc-red bg-mc-gray px-2 py-1 rounded">{s.address}</code>
                      <button
                        type="button"
                        onClick={() => onCopy(s.address)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-mc-gray border border-mc-border text-xs hover:border-mc-red/50"
                      >
                        {copied === s.address ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === s.address ? 'Copied' : 'Copy IP'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
