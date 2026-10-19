import { useEffect, useMemo, useState } from 'react';
import { Search, Package, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { useResources } from '../hooks/useResources';
import type { Resource } from '../types/resource';

type Source = 'global' | 'modrinth' | 'spigot' | 'pocketmine';
type ExternalPlugin = {
  id: string; title: string; description: string; icon: string | null; downloads: number;
  source: Exclude<Source, 'global'>; pageUrl: string; downloadUrl: string;
};

const MODRINTH_API = 'https://api.modrinth.com/v2';
const SPIGET_API = 'https://api.spiget.org/v2';

async function loadModrinth(query: string): Promise<ExternalPlugin[]> {
  const params = new URLSearchParams({ query, facets: JSON.stringify([['project_type:plugin']]), index: 'downloads', limit: '30' });
  const response = await fetch(`${MODRINTH_API}/search?${params}`);
  if (!response.ok) throw new Error(`Modrinth API error (${response.status})`);
  const data = await response.json();
  return Promise.all((data.hits || []).map(async (hit: any) => {
    let downloadUrl = `https://modrinth.com/plugin/${hit.slug}`;
    try {
      const versionsResponse = await fetch(`${MODRINTH_API}/project/${encodeURIComponent(hit.project_id)}/version`);
      if (versionsResponse.ok) {
        const versions = await versionsResponse.json();
        const version = versions.find((v: any) => v.files?.some((f: any) => f.primary)) || versions[0];
        const file = version?.files?.find((f: any) => f.primary) || version?.files?.[0];
        if (file?.url) downloadUrl = file.url;
      }
    } catch { /* Keep official project page as safe fallback. */ }
    return { id: `modrinth-${hit.project_id}`, title: hit.title, description: hit.description || '', icon: hit.icon_url || null,
      downloads: hit.downloads || 0, source: 'modrinth' as const, pageUrl: `https://modrinth.com/plugin/${hit.slug}`, downloadUrl };
  }));
}

async function loadSpigot(query: string): Promise<ExternalPlugin[]> {
  const params = new URLSearchParams({ size: '30', sort: '-downloads' });
  if (query.trim()) params.set('query', query.trim());
  const response = await fetch(`${SPIGET_API}/search/resources/${encodeURIComponent(query.trim() || 'minecraft')}/?${params}`);
  if (!response.ok) throw new Error(`Spigot search API error (${response.status})`);
  const data = await response.json();
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: `spigot-${item.id}`, title: item.name || 'Spigot resource', description: item.tag || item.description || 'Community plugin from SpigotMC.',
    icon: item.icon?.url ? (item.icon.url.startsWith('http') ? item.icon.url : `https://www.spigotmc.org${item.icon.url}`) : null,
    downloads: item.downloads || 0, source: 'spigot' as const,
    pageUrl: `https://www.spigotmc.org/resources/${item.id}/`, downloadUrl: `https://api.spiget.org/v2/resources/${item.id}/download`
  }));
}

async function loadPocketMine(query: string): Promise<ExternalPlugin[]> {
  // Poggit is the established community catalogue for PocketMine-MP plugins.
  const response = await fetch('https://poggit.pmmp.io/plugins.json?fields=id,name,version,description,downloads,icon');
  if (!response.ok) throw new Error(`Poggit catalogue error (${response.status})`);
  const data = await response.json();
  const rows = Array.isArray(data) ? data : (data.plugins || []);
  const q = query.trim().toLowerCase();
  return rows.filter((item: any) => !q || `${item.name || ''} ${item.description || ''}`.toLowerCase().includes(q))
    .slice(0, 60).map((item: any) => ({
      id: `pocketmine-${item.id}`, title: item.name || 'PocketMine plugin', description: item.description || 'Community plugin for PocketMine-MP.',
      icon: typeof item.icon === 'string' ? item.icon : item.icon?.url || null, downloads: item.downloads || 0, source: 'pocketmine' as const,
      pageUrl: `https://poggit.pmmp.io/p/${item.id}`, downloadUrl: `https://poggit.pmmp.io/r/${item.id}`
    }));
}

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, { notation: value >= 1000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
}

export function Plugins() {
  const { resources, loading: localLoading, error: localError, data } = useResources();
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<Source>('global');
  const [external, setExternal] = useState<ExternalPlugin[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState('');

  const ownResources = useMemo(() => resources.filter((r) => !r.hidden && (r.platform === 'spigot' || r.platform === 'modrinth') &&
    (!search.trim() || `${r.title} ${r.description} ${r.categories.join(' ')}`.toLowerCase().includes(search.toLowerCase()))), [resources, search]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setExternalLoading(true); setExternalError('');
      try {
        const requests: Promise<ExternalPlugin[]>[] = [];
        if (source === 'global' || source === 'modrinth') requests.push(loadModrinth(search));
        if (source === 'global' || source === 'spigot') requests.push(loadSpigot(search));
        if (source === 'global' || source === 'pocketmine') requests.push(loadPocketMine(search));
        const settled = await Promise.allSettled(requests);
        if (!active) return;
        const good: ExternalPlugin[] = [];
        const failed: string[] = [];
        settled.forEach((result) => result.status === 'fulfilled' ? good.push(...result.value) : failed.push(result.reason instanceof Error ? result.reason.message : 'Source unavailable'));
        setExternal(good);
        setExternalError(failed.length ? `Some sources could not load: ${failed.join(' · ')}` : '');
      } catch (error) {
        if (active) { setExternal([]); setExternalError(error instanceof Error ? error.message : 'Could not load community plugins.'); }
      } finally { if (active) setExternalLoading(false); }
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, source]);

  const shownExternal = useMemo(() => {
    const ownIds = new Set(ownResources.map((r) => `${r.platform}-${r.platformId}`));
    return external.filter((p) => !ownIds.has(p.id)).sort((a, b) => b.downloads - a.downloads);
  }, [external, ownResources]);
  const shownOwn = source === 'pocketmine' ? [] : ownResources.filter((r) => source === 'global' || r.platform === source);
  const isLoading = localLoading || externalLoading;

  return <div className="pt-24 pb-16 min-h-screen mc-grid-bg"><div className="max-w-6xl mx-auto px-4 sm:px-6">
    <div className="mb-8"><h1 className="text-3xl font-bold text-mc-white">Global Plugins</h1>
      <p className="text-mc-muted mt-1 text-sm">Temukan plugin komunitas dari Modrinth, SpigotMC, dan PocketMine-MP. Download tersedia langsung dari sumber resmi.</p>
      {data?.lastSynced && <p className="text-xs text-mc-muted mt-2">CubeNest catalogue synced {new Date(data.lastSynced).toLocaleString()}</p>}
    </div>
    <div className="bg-mc-surface border border-mc-border rounded-xl p-4 mb-8 space-y-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted" />
      <input type="search" placeholder="Search community plugins..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-mc-red" /></div>
      <div className="flex flex-wrap gap-2 items-center">{([{ id: 'global', label: 'Global' }, { id: 'modrinth', label: 'Modrinth' }, { id: 'spigot', label: 'SpigotMC' }, { id: 'pocketmine', label: 'PocketMine-MP' }] as const).map((opt) => <button key={opt.id} type="button" onClick={() => setSource(opt.id)} className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${source === opt.id ? 'bg-mc-red border-mc-red text-white' : 'bg-mc-gray border-mc-border text-mc-text hover:border-mc-red/40'}`}>{opt.label}</button>)}
        <span className="text-xs text-mc-muted ml-auto">{shownExternal.length + shownOwn.length} results</span></div></div>
    {externalError && <div className="bg-yellow-900/20 border border-yellow-700/50 text-yellow-100 rounded-xl p-3 mb-5 text-sm">{externalError} <button className="underline ml-1" onClick={() => setSearch((v) => `${v}`)}>Retry</button></div>}
    {isLoading ? <div className="flex items-center justify-center gap-2 py-16 text-mc-muted"><RefreshCw className="w-4 h-4 animate-spin" /> Loading community plugins…</div> : shownExternal.length + shownOwn.length === 0 ? <div className="text-center py-20 text-mc-muted"><Package className="w-10 h-10 mx-auto mb-3 opacity-50" /><p>No plugins found for this search.</p><p className="text-xs mt-2">Try another keyword or switch source.</p></div> :
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{shownExternal.map((p) => <article key={p.id} className="bg-mc-surface border border-mc-border rounded-xl p-4 flex flex-col min-h-60 hover:border-mc-red/50 transition-colors">
        <div className="flex gap-3 items-start">{p.icon ? <img src={p.icon} alt="" loading="lazy" className="w-12 h-12 rounded-lg object-cover bg-mc-gray" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <div className="w-12 h-12 rounded-lg bg-mc-gray flex items-center justify-center"><Package className="w-5 h-5 text-mc-muted" /></div>}
          <div className="min-w-0 flex-1"><h2 className="font-semibold text-mc-white line-clamp-2">{p.title}</h2><span className="text-xs text-mc-red">{p.source === 'pocketmine' ? 'PocketMine-MP · Poggit' : p.source === 'spigot' ? 'SpigotMC' : 'Modrinth'}</span></div></div>
        <p className="text-sm text-mc-muted mt-3 line-clamp-3 flex-1">{p.description}</p><p className="text-xs text-mc-muted mt-3">{formatCount(p.downloads)} downloads</p>
        <div className="flex gap-2 mt-4"><a href={p.downloadUrl} target="_blank" rel="noreferrer" className="flex-1 inline-flex justify-center items-center gap-2 rounded-lg bg-mc-red text-white text-sm font-medium px-3 py-2 hover:opacity-90"><Download className="w-4 h-4" /> Download</a><a href={p.pageUrl} target="_blank" rel="noreferrer" aria-label={`Open ${p.title} source page`} className="inline-flex items-center justify-center rounded-lg border border-mc-border text-mc-text px-3 py-2 hover:border-mc-red/50"><ExternalLink className="w-4 h-4" /></a></div></article>)}
      {shownOwn.map((r: Resource) => <article key={r.id} className="bg-mc-surface border border-mc-border rounded-xl p-4 flex flex-col min-h-60">{r.icon && <img src={r.icon} alt="" className="w-12 h-12 rounded-lg object-cover mb-3" />}<h2 className="font-semibold text-mc-white">{r.title}</h2><span className="text-xs text-mc-red">CubeNest catalogue · {r.platform}</span><p className="text-sm text-mc-muted mt-3 line-clamp-3 flex-1">{r.description}</p><p className="text-xs text-mc-muted mt-3">{formatCount(r.downloads)} downloads</p><div className="flex gap-2 mt-4"><a href={r.downloadUrl || r.url} target="_blank" rel="noreferrer" className="flex-1 inline-flex justify-center items-center gap-2 rounded-lg bg-mc-red text-white text-sm font-medium px-3 py-2"><Download className="w-4 h-4" /> Download</a><a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg border border-mc-border px-3 py-2"><ExternalLink className="w-4 h-4" /></a></div></article>)}</div>}
    <p className="mt-8 text-xs text-mc-muted text-center">Community resources remain hosted by their original platforms. Download links open the official file endpoint where supported.</p>
  </div></div>;
}
