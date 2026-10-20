import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Download, ExternalLink, Package, AlertCircle, Palette, Map, Boxes, Sun, User, Layers } from 'lucide-react';
import { formatNumber } from '../lib/utils';
import { downloadBedrockItem, canDownloadBedrockItem } from '../lib/bedrockDownload';

type Category = 'all' | 'addons' | 'maps' | 'textures' | 'shaders' | 'skins';
type BedrockItem = {
  id: number | string; slug: string; name: string; summary: string; downloadCount: number;
  logo: string | null; url: string; authors?: string[]; categories?: string[];
  category?: Exclude<Category, 'all'> | 'other'; categoryLabel?: string;
  downloadUrl?: string | null; fileName?: string | null; fileId?: number | null; latestFileId?: number | null; updated?: string | null;
  source?: string;
};
type BedrockData = { lastSynced: string | null; gameId?: number; total?: number; resources: BedrockItem[]; error?: string };
const CATEGORIES: { id: Category; label: string; icon: typeof Boxes; description: string }[] = [
  { id: 'all', label: 'All resources', icon: Layers, description: 'Every Bedrock resource' },
  { id: 'addons', label: 'Add-ons', icon: Boxes, description: 'Behavior packs, mobs, items and gameplay' },
  { id: 'maps', label: 'Maps', icon: Map, description: 'Worlds, adventures and minigames' },
  { id: 'textures', label: 'Texture packs', icon: Palette, description: 'Textures, UI and visual packs' },
  { id: 'shaders', label: 'Shaders', icon: Sun, description: 'Visual effects and lighting' },
  { id: 'skins', label: 'Skins', icon: User, description: 'Character skins and skin packs' },
];

function inferCategory(item: BedrockItem): Exclude<Category, 'all'> | 'other' {
  const explicit = String(item.category || '').toLowerCase().replace(/[ _-]+/g, '');
  if (['addons', 'addon', 'behaviorpacks', 'behaviourpacks'].includes(explicit)) return 'addons';
  if (['maps', 'worlds', 'world'].includes(explicit)) return 'maps';
  if (['textures', 'texturepacks', 'resourcepacks', 'resourcepack'].includes(explicit)) return 'textures';
  if (['shaders', 'shader'].includes(explicit)) return 'shaders';
  if (['skins', 'skinpacks', 'skin'].includes(explicit)) return 'skins';
  const text = [item.name, item.summary, item.categoryLabel, ...(item.categories || [])].filter(Boolean).join(' ').toLowerCase();
  if (/\b(shader|lighting|render dragon|deferred rendering)\b/.test(text)) return 'shaders';
  if (/\b(skin|skin pack|character creator)\b/.test(text)) return 'skins';
  if (/\b(map|world|adventure|skyblock|parkour|survival world|minigame)\b/.test(text)) return 'maps';
  if (/\b(texture|resource pack|visual pack|ui pack|faithful|pbr)\b/.test(text)) return 'textures';
  if (/\b(add.?on|behavior pack|behaviour pack|mob|creature|weapon|item|dimension|furniture|gameplay)\b/.test(text)) return 'addons';
  return 'other';
}

export function BedrockCatalog() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const initialCategory = (params.get('category') || 'all') as Category;
  const [category, setCategory] = useState<Category>(CATEGORIES.some(c => c.id === initialCategory) ? initialCategory : 'all');
  const [data, setData] = useState<BedrockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadBusyId, setDownloadBusyId] = useState<string | number | null>(null);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  const handleDownload = useCallback(async (item: BedrockItem) => {
    setDownloadBusyId(item.id);
    setDownloadMessage(null);
    try {
      await downloadBedrockItem(item);
      setDownloadMessage(`Download started for “${item.name}”. You stayed on CubeNest.`);
    } catch (e) {
      setDownloadMessage(e instanceof Error ? e.message : 'Download failed.');
    } finally {
      setDownloadBusyId(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const bust = Date.now();
    Promise.allSettled([
      fetch(`${import.meta.env.BASE_URL}data/bedrock-curseforge.json?t=${bust}`, { cache: 'no-store' }).then(async (r) => {
        if (!r.ok) throw new Error(`CurseForge catalog unavailable (${r.status})`);
        return r.json() as Promise<BedrockData>;
      }),
      fetch(`${import.meta.env.BASE_URL}data/9minecraft-bedrock.json?t=${bust}`, { cache: 'no-store' }).then(async (r) => {
        if (!r.ok) return { lastSynced: null, resources: [] } as BedrockData;
        return r.json() as Promise<BedrockData>;
      }),
    ]).then((results) => {
      if (cancelled) return;
      const curse = results[0].status === 'fulfilled' ? results[0].value : null;
      const nine = results[1].status === 'fulfilled' ? results[1].value : null;
      const curseResources = (curse?.resources || []).map((item) => ({ ...item, source: item.source || 'CurseForge' }));
      const nineResources = (nine?.resources || []).map((item) => ({ ...item, source: item.source || '9Minecraft' }));
      const merged = [...curseResources, ...nineResources];
      if (!merged.length) {
        setError(
          curse?.error ||
            (results[0].status === 'rejected' ? (results[0].reason instanceof Error ? results[0].reason.message : 'Catalog unavailable') : 'Catalog is empty'),
        );
        setData({ lastSynced: null, resources: [] });
        return;
      }
      const timestamps = [curse?.lastSynced, nine?.lastSynced].filter(Boolean).map((value) => Date.parse(String(value))).filter((n) => Number.isFinite(n));
      const lastSynced = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : curse?.lastSynced || nine?.lastSynced || null;
      setData({ lastSynced, total: merged.length, resources: merged });
      setError(null);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setParams(p => {
        const n = new URLSearchParams(p);
        query.trim() ? n.set('q', query.trim()) : n.delete('q');
        category !== 'all' ? n.set('category', category) : n.delete('category');
        return n;
      }, { replace: true });
    }, 180);
    return () => clearTimeout(t);
  }, [query, category, setParams]);

  const counts = useMemo(() => {
    const out: Record<Category, number> = { all: 0, addons: 0, maps: 0, textures: 0, shaders: 0, skins: 0 };
    for (const item of data?.resources || []) {
      out.all++;
      const inferred = inferCategory(item);
      if (inferred !== 'other') out[inferred]++;
    }
    return out;
  }, [data]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.resources || []).filter(m => {
      const categoryMatches = category === 'all' || inferCategory(m) === category;
      const queryMatches = !q || m.name.toLowerCase().includes(q) || m.summary.toLowerCase().includes(q) || (m.categories || []).some(c => c.toLowerCase().includes(q)) || (m.authors || []).some(a => a.toLowerCase().includes(q));
      return categoryMatches && queryMatches;
    });
  }, [data, query, category]);

  return <div className="pt-20 pb-28 min-h-screen mc-grid-bg">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/80 via-mc-surface to-cyan-950/40 p-6 sm:p-9 mb-7">
        <div className="absolute -right-10 -top-20 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Minecraft Bedrock Edition</span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-mc-white mt-4">Bedrock <span className="text-emerald-400">Library</span></h1>
          <p className="text-sm sm:text-base text-mc-muted mt-3 max-w-2xl">Find add-ons, worlds, texture packs, shaders and skins in one catalog. Downloads are streamed through CubeNest when a direct file URL is available.</p>
          <div className="flex flex-wrap gap-3 mt-5 text-xs text-mc-muted"><span className="rounded-lg bg-black/20 px-3 py-2">{formatNumber(data?.resources?.length || 0)} resources indexed</span>{data?.lastSynced && <span className="rounded-lg bg-black/20 px-3 py-2">Updated {new Date(data.lastSynced).toLocaleDateString()}</span>}</div>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {CATEGORIES.map((c, i) => { const Icon = c.icon; const active = category === c.id; return <motion.button key={c.id} type="button" onClick={() => setCategory(c.id)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .035 }} className={`text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5 ${active ? 'border-emerald-400/50 bg-emerald-500/10 shadow-lg shadow-emerald-950/20' : 'border-mc-border bg-mc-surface hover:border-emerald-500/30'}`}>
          <Icon className={`w-5 h-5 mb-3 ${active ? 'text-emerald-300' : 'text-mc-muted'}`} /><div className="font-semibold text-sm text-mc-white">{c.label}</div><div className="text-[11px] text-mc-muted mt-1">{formatNumber(counts[c.id])} items</div>
        </motion.button>; })}
      </div>

      <div className="bg-mc-surface border border-mc-border rounded-2xl p-3 mb-5">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${category === 'all' ? 'all Bedrock resources' : CATEGORIES.find(c => c.id === category)?.label.toLowerCase()}...`} className="w-full pl-10 pr-4 py-3 rounded-xl bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-emerald-500/50" /></div>
        <div className="flex items-center justify-between mt-3 px-1 text-xs text-mc-muted"><span>{loading ? 'Loading catalog…' : `${filtered.length} resources found`}</span><span>Sorted by popularity</span></div>
      </div>

      {error && <div className="flex gap-2 text-sm text-amber-200 mb-5 bg-amber-900/20 border border-amber-800 rounded-xl p-3"><AlertCircle className="w-4 h-4 shrink-0" /><div><p>{error}</p><p className="mt-1 text-xs opacity-80">Check the GitHub Actions sync log. Keep the API key in GitHub Secrets, never in frontend code.</p></div></div>}
      {downloadMessage && <div className="flex gap-2 text-sm text-emerald-100 mb-5 bg-emerald-900/20 border border-emerald-800 rounded-xl p-3"><AlertCircle className="w-4 h-4 shrink-0" /><p>{downloadMessage}</p></div>}
      {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}</div> : filtered.length === 0 ? <div className="text-center py-16 text-mc-muted bg-mc-surface border border-mc-border rounded-2xl"><Package className="w-10 h-10 mx-auto mb-3 opacity-50" /><p className="text-mc-white font-semibold">No resources in this category yet</p><p className="text-sm mt-1">Try another category or run the Bedrock sync workflow.</p><button onClick={() => { setCategory('all'); setQuery(''); }} className="text-sm text-emerald-400 mt-3">Show all resources</button></div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((m, i) => <motion.article key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * .012, .18) }} className="group flex flex-col overflow-hidden rounded-2xl border border-mc-border bg-mc-surface hover:border-emerald-500/45 hover:-translate-y-1 transition-all duration-200">
          <Link to={`/bedrock/resource/${m.id}`} className="relative aspect-[16/10] bg-mc-gray flex items-center justify-center overflow-hidden">
            {m.logo ? <img src={m.logo} alt={`${m.name} icon`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /> : <Package className="w-12 h-12 text-mc-muted" />}
            <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-black/65 text-emerald-300 backdrop-blur">{CATEGORIES.find(c => c.id === inferCategory(m))?.label || m.categoryLabel || 'Bedrock'}</span>
          </Link>
          <div className="p-4 flex flex-col flex-1">
            <h2 className="font-bold text-mc-white text-sm line-clamp-2 min-h-10">{m.name}</h2>
            <p className="text-xs text-mc-muted mt-2 line-clamp-3 flex-1">{m.summary || 'Minecraft Bedrock community resource.'}</p>
            <div className="flex items-center justify-between text-[11px] text-mc-muted border-t border-mc-border pt-3 mt-4"><span>{m.source === '9Minecraft' ? '9Minecraft' : `${formatNumber(m.downloadCount || 0)} downloads`}</span><span className="truncate max-w-28">{m.source === '9Minecraft' ? (m.authors?.[0] || '9Minecraft') : (m.authors?.[0] || 'Community creator')}</span></div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {canDownloadBedrockItem(m) ? (
                <button
                  type="button"
                  disabled={downloadBusyId === m.id}
                  onClick={() => void handleDownload(m)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-60"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadBusyId === m.id ? 'Downloading…' : 'Download'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="No download file is available for this resource"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-mc-gray px-3 py-2.5 text-xs font-bold text-mc-muted cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" /> Unavailable
                </button>
              )}
              <Link to={`/bedrock/resource/${m.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-mc-border px-3 py-2.5 text-xs font-semibold text-mc-white hover:border-emerald-500/40"><ExternalLink className="w-3.5 h-3.5" /> Details</Link>
            </div>
          </div>
        </motion.article>)}
      </div>}
    </div>
  </div>;
}
