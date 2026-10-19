import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Package, Download, X, RefreshCw, Puzzle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useResources } from '../hooks/useResources';
import { searchProjects, getProject, getProjectVersions, type ModrinthHit, type ModrinthProject, type ModrinthVersion } from '../lib/modrinth';
import type { Resource } from '../types/resource';

type Source = 'all' | 'modrinth' | 'spigot' | 'pocketmine';
type Plugin = Resource & { author?: string; sourceName: string; raw?: ModrinthHit; full?: ModrinthProject; versions?: ModrinthVersion[]; currentFile?: string; filename?: string };
const LOADING_GIF = 'https://i.imgur.com/cFLg43W.gif';
const POGGIT_API = 'https://poggit.pmmp.io/plugins.json';
const SPIGET_API = 'https://api.spiget.org/v2/resources?size=36&sort=-downloads&fields=id,name,tag,description,downloads,releaseDate,updateDate,icon,author,testedVersions,external&fields=*&page=0';

function safeDate(value?: string) { const n = value ? Date.parse(value) : 0; return Number.isFinite(n) ? n : 0; }
function humanDate(value?: string) { const n = safeDate(value); return n ? new Date(n).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not provided'; }
function textOnly(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ').replace(/\[url=(https?:\/\/[^\]]+)\]([\s\S]*?)\[\/url\]/gi, '$2 ($1)')
    .replace(/\[\/?(?:b|i|u|s|center|left|right|quote|list|\*|hr|code|php|html|spoiler)[^\]]*\]/gi, '')
    .replace(/\[img\](https?:\/\/[^\[]+)\[\/img\]/gi, '[Image]').replace(/\[\/?[a-z*]+(?:=[^\]]*)?\]/gi, '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').trim();
}
function normalizeModrinth(h: ModrinthHit): Plugin {
  return { id: `modrinth-${h.project_id}`, platform: 'modrinth', platformId: h.project_id, slug: h.slug, title: h.title,
    description: h.description || 'No description provided.', body: h.description || '', icon: h.icon_url || null, gallery: [],
    categories: h.display_categories || h.categories || [], loaders: ['paper', 'purpur', 'spigot', 'bukkit'], gameVersions: [],
    version: h.latest_version || '', downloads: Number(h.downloads) || 0, published: h.date_created || '', updated: h.date_modified || '',
    url: `https://modrinth.com/plugin/${h.slug}`, downloadUrl: '', featured: false, hidden: false,
    author: h.author || 'Modrinth creator', sourceName: 'Modrinth', raw: h };
}
function normalizePoggit(item: any, index = 0): Plugin {
  const id = String(item.id ?? item.name ?? `poggit-${index}`);
  return { id: `poggit-${id}`, platform: 'custom', platformId: id, slug: id, title: String(item.name || 'Untitled plugin'),
    description: String(item.description || 'No description provided.'), body: String(item.description || ''), icon: typeof item.icon === 'string' ? item.icon : null,
    gallery: [], categories: [], loaders: ['PocketMine-MP'], gameVersions: Array.isArray(item.mcpe_version) ? item.mcpe_version.map(String) : item.mcpe_version ? [String(item.mcpe_version)] : [],
    version: String(item.version || ''), downloads: Number(item.downloads) || 0, published: '', updated: '', url: String(item.plugin_url || `https://poggit.pmmp.io/plugins`),
    downloadUrl: String(item.artifact_url || item.download_url || item.downloadUrl || ''), featured: false, hidden: false,
    author: Array.isArray(item.authors) ? item.authors.map((a: any) => typeof a === 'string' ? a : a.name || '').filter(Boolean).join(', ') : String(item.authors || 'Poggit author'),
    sourceName: 'PocketMine-MP / Poggit' };
}

function normalizeSpiget(item: any): Plugin {
  const id = String(item.id ?? item.resourceId ?? '');
  const author = typeof item.author === 'string' ? item.author : item.author?.name;
  const icon = typeof item.icon === 'string' ? item.icon : item.icon?.url;
  const updated = item.updateDate ? new Date(Number(item.updateDate)).toISOString() : '';
  const published = item.releaseDate ? new Date(Number(item.releaseDate)).toISOString() : '';
  const tested = Array.isArray(item.testedVersions) ? item.testedVersions.map(String) : [];
  return { id: `spiget-${id}`, platform: 'spigot', platformId: id, slug: id, title: String(item.name || 'Untitled resource'),
    description: String(item.description || item.tag || 'No description provided.'), body: String(item.description || ''), icon: icon ? (icon.startsWith('http') ? icon : `https://www.spigotmc.org/${icon.replace(/^\//, '')}`) : null,
    gallery: [], categories: Array.isArray(item.category) ? item.category.map(String) : [], loaders: ['Spigot', 'Bukkit'], gameVersions: tested,
    version: String(item.version || item.tag || ''), downloads: Number(item.downloads) || 0, published, updated,
    url: `https://www.spigotmc.org/resources/${id}/`, downloadUrl: `https://api.spiget.org/v2/resources/${id}/download`, featured: false, hidden: false,
    author: author || 'SpigotMC creator', sourceName: 'SpigotMC' };
}

async function fetchJsonWithFallback(url: string, fallbackPath: string, signal: AbortSignal) {
  try {
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (signal.aborted) throw error;
    const fallback = await fetch(`${import.meta.env.BASE_URL}${fallbackPath}`, { signal, headers: { Accept: 'application/json' } });
    if (!fallback.ok) throw new Error(`Live API failed and synced fallback returned HTTP ${fallback.status}.`);
    return await fallback.json();
  }
}

export function Plugins() {
  const { resources, loading: catalogLoading, error: catalogError } = useResources();
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<Source>('all');
  const [sort, setSort] = useState<'relevance'|'newest'|'downloads'|'alphabetical'>('relevance');
  const [page, setPage] = useState(0);
  const [remote, setRemote] = useState<Plugin[]>([]);
  const [total, setTotal] = useState(0);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState('');
  const [selected, setSelected] = useState<Plugin | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [downloadState, setDownloadState] = useState('');
  const [downloadChallenge, setDownloadChallenge] = useState<Plugin | null>(null);
  const [humanChecked, setHumanChecked] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const localSpigot = useMemo(() => resources.filter(r => !r.hidden && r.platform === 'spigot').map(r => ({...r, sourceName:'SpigotMC', author:'Creator listed by source'} as Plugin)), [resources]);

  const loadRemote = useCallback(async (signal: AbortSignal) => {
    setRemoteLoading(true); setRemoteError('');
    try {
      if (source === 'pocketmine') {
        const payload = await fetchJsonWithFallback(POGGIT_API, 'data/poggit-plugins.json', signal);
        const list = Array.isArray(payload) ? payload : Array.isArray(payload.plugins) ? payload.plugins : Array.isArray(payload.data) ? payload.data : payload && typeof payload === 'object' ? Object.values(payload) : null;
        if (!list) throw new Error('Poggit response format was not recognized.');
        const plugins = list.filter((item: any) => item && typeof item === 'object' && (item.name || item.id)).map(normalizePoggit);
        if (!plugins.length) throw new Error('Poggit returned no usable plugin records. Try again later.');
        setRemote(plugins); setTotal(plugins.length);
      } else if (source === 'spigot') {
        const payload = await fetchJsonWithFallback(SPIGET_API, 'data/spigot-plugins.json', signal);
        const list = Array.isArray(payload) ? payload : Array.isArray(payload.resources) ? payload.resources : Array.isArray(payload.data) ? payload.data : null;
        if (!list) throw new Error('Spiget response format was not recognized.');
        const plugins = list.filter((item: any) => item && item.id && item.name).map(normalizeSpiget)
          .filter((item: Plugin) => !search.trim() || `${item.title} ${item.description} ${item.author}`.toLowerCase().includes(search.trim().toLowerCase()));
        setRemote(plugins); setTotal(plugins.length);
        if (!plugins.length) setRemoteError('No SpigotMC resources matched. Try a broader search or retry.');
      } else if (source === 'modrinth' || source === 'all') {
        const result = await searchProjects({ query: search.trim() || undefined, projectType: 'plugin', index: sort === 'relevance' ? 'relevance' : sort === 'downloads' ? 'downloads' : sort === 'newest' ? 'newest' : 'relevance', offset: page * 24, limit: 24, signal });
        const hits = result.hits.map(normalizeModrinth);
        if (source === 'all') {
          const local = localSpigot.filter(r => !search.trim() || `${r.title} ${r.description}`.toLowerCase().includes(search.trim().toLowerCase()));
          setRemote([...hits, ...local]); setTotal(result.total_hits + local.length);
        } else { setRemote(hits); setTotal(result.total_hits); }
      } else {
        const local = localSpigot.filter(r => !search.trim() || `${r.title} ${r.description}`.toLowerCase().includes(search.trim().toLowerCase()));
        setRemote(local); setTotal(local.length);
        if (!local.length) setRemoteError('SpigotMC live discovery is unavailable without an approved API. Showing synced catalogue entries only.');
      }
    } catch (e) {
      if (signal.aborted) return;
      setRemote([]); setTotal(0); setRemoteError(e instanceof Error ? e.message : 'Unable to load plugin resources.');
    } finally { if (!signal.aborted) setRemoteLoading(false); }
  }, [source, search, sort, page, localSpigot, reloadKey]);

  useEffect(() => { const ac = new AbortController(); const t = setTimeout(() => void loadRemote(ac.signal), 350); return () => { clearTimeout(t); ac.abort(); }; }, [loadRemote]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);

  const displayed = useMemo(() => {
    let list = [...remote];
    if (source === 'all' && search.trim()) list = list.filter(p => `${p.title} ${p.description} ${p.author || ''} ${p.categories.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()));
    if (sort === 'downloads') list.sort((a,b)=>b.downloads-a.downloads);
    if (sort === 'newest') list.sort((a,b)=>safeDate(b.published)-safeDate(a.published));
    if (sort === 'alphabetical') list.sort((a,b)=>a.title.localeCompare(b.title));
    return list;
  }, [remote, source, search, sort]);

  const openDetail = async (plugin: Plugin) => {
    setSelected(plugin); setDetailLoading(true); setDownloadState('');
    try {
      if (plugin.platform === 'modrinth') {
        const [full, versions] = await Promise.all([getProject(plugin.platformId), getProjectVersions(plugin.platformId)]);
        setSelected(current => current?.id === plugin.id ? {...plugin, full, versions, body: full.body || full.description, icon: full.icon_url || plugin.icon, gallery: (full.gallery || []).map(g=>g.url), gameVersions: full.game_versions || [], loaders: full.loaders || [], author: plugin.author} : current);
      }
    } catch (e) { setDownloadState(`Details could not be fully loaded: ${e instanceof Error ? e.message : 'network error'}`); }
    finally { setDetailLoading(false); }
  };

  const executeDownload = async (plugin: Plugin) => {
    setDownloadBusy(true); setDownloadState('Preparing download…');
    try {
      let url = plugin.downloadUrl; let filename = `${plugin.slug || 'plugin'}.jar`;
      if (plugin.platform === 'modrinth') {
        const versions = plugin.versions || await getProjectVersions(plugin.platformId);
        const version = versions.find(v => v.version_type === 'release') || versions[0];
        const file = version?.files.find(f => f.primary) || version?.files[0];
        if (!file?.url) throw new Error('No downloadable file is available for this project.');
        url = file.url; filename = file.filename || filename;
      }
      if (!url) throw new Error('This source did not provide a direct file URL.');
      const response = await fetch(url);
      if (!response.ok) throw new Error(`File host returned HTTP ${response.status}.`);
      const blob = await response.blob();
      if (blob.size < 32 || blob.type.includes('text/html')) throw new Error('The source returned an error page instead of a plugin file. The host may block browser downloads (CORS).');
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = objectUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
      setDownloadState('Download initiated by your browser.');
    } catch (e) { setDownloadState(`${e instanceof Error ? e.message : 'Download failed'} The source may block direct browser downloads (CORS). CubeNest will not redirect you to an external project page.`); }
    finally { setDownloadBusy(false); }
  };

  const beginDownload = (plugin: Plugin) => { setDownloadState(''); setHumanChecked(false); setDownloadChallenge(plugin); };

  return <div className="pt-24 pb-16 min-h-screen mc-grid-bg">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <section className="rounded-3xl border border-mc-border bg-mc-surface p-6 sm:p-9 mb-7">
        <div className="text-xs font-bold tracking-[.18em] uppercase text-mc-red-bright mb-3">CUBENEST RESOURCE DISCOVERY</div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-mc-white">Discover <span className="text-mc-red-bright">Minecraft Plugins</span></h1>
        <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-mc-muted">Discover community-made Java plugins from Modrinth and SpigotMC, plus PocketMine-MP releases from Poggit. Browse details and attempt direct downloads without leaving CubeNest.</p>
      </section>
      <section className="rounded-2xl border border-mc-border bg-mc-surface p-4 sm:p-5 mb-7 space-y-4">
        <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted"/><input type="search" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} placeholder="Search plugins, features, or creators…" className="w-full pl-11 pr-4 py-3 rounded-xl bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted"/></div>
        <div className="flex flex-wrap gap-2 items-center">
          {([{id:'all',label:'All sources'},{id:'modrinth',label:'Modrinth'},{id:'spigot',label:'SpigotMC'},{id:'pocketmine',label:'PocketMine-MP / Poggit'}] as const).map(o=><button key={o.id} onClick={()=>{setSource(o.id);setPage(0)}} className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border ${source===o.id?'bg-mc-red border-mc-red text-white':'bg-mc-gray border-mc-border text-mc-text hover:border-mc-red/50'}`}>{o.label}</button>)}
          <select value={sort} onChange={e=>setSort(e.target.value as typeof sort)} className="sm:ml-auto px-3 py-2 rounded-xl bg-mc-gray border border-mc-border text-xs text-mc-text"><option value="relevance">Relevance</option><option value="newest">Newest</option><option value="downloads">Most downloads</option><option value="alphabetical">Name A–Z</option></select>
          <button onClick={()=>setReloadKey(k=>k+1)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-mc-border text-xs"><RefreshCw size={14}/> Retry</button>
          <span className="text-xs text-mc-muted">{remoteLoading?'Loading…':`${displayed.length} shown · ${total.toLocaleString()} total`}</span>
        </div>
      </section>
      {catalogError && source==='spigot' && <p className="mb-4 text-sm text-amber-200">Synced catalogue unavailable: {catalogError}</p>}
      {remoteError && <div className="mb-5 flex gap-3 rounded-xl border border-amber-700/50 bg-amber-950/20 p-4 text-sm text-amber-100"><AlertCircle className="shrink-0 mt-0.5" size={17}/><div className="flex-1">{remoteError}</div><button onClick={()=>setReloadKey(k=>k+1)} className="underline">Retry</button></div>}
      {remoteLoading ? <div className="min-h-[300px] flex flex-col items-center justify-center rounded-2xl border border-mc-border bg-mc-surface/70 p-8"><img src={LOADING_GIF} alt="" className="w-24 h-24 object-contain" /><p className="mt-4 font-semibold text-mc-white">Loading plugin resources…</p><p className="mt-1 text-sm text-mc-muted">Contacting the selected public source.</p></div>
      : !displayed.length ? <div className="text-center py-16 rounded-2xl border border-mc-border bg-mc-surface/50 text-mc-muted"><Package className="w-10 h-10 mx-auto mb-3 opacity-50"/><p className="font-semibold text-mc-white">No plugins found</p><p className="text-xs mt-2">Try another search or source.</p></div>
      : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{displayed.map(p=><article key={p.id} className="rounded-2xl border border-mc-border bg-mc-surface p-4 transition-all hover:-translate-y-1 hover:border-mc-red/50">
        <button onClick={()=>void openDetail(p)} className="w-full text-left"><div className="flex gap-3"><div className="w-14 h-14 shrink-0 rounded-xl bg-mc-gray border border-mc-border overflow-hidden flex items-center justify-center">{p.icon?<img src={p.icon} alt="" loading="lazy" className="w-full h-full object-cover"/>:<Puzzle className="text-mc-red" size={24}/>}</div><div className="min-w-0"><h2 className="font-bold text-mc-white line-clamp-2">{p.title}</h2><p className="mt-1 text-xs text-mc-muted">{p.author || 'Community creator'}</p></div></div><p className="mt-4 text-sm text-mc-muted line-clamp-3">{textOnly(p.description || '') || 'No description provided.'}</p><div className="mt-4 flex flex-wrap gap-1.5">{p.loaders.slice(0,3).map(x=><span key={x} className="text-[10px] px-2 py-1 rounded-md bg-mc-gray text-mc-muted">{x}</span>)}<span className="text-[10px] px-2 py-1 rounded-md border border-mc-border text-mc-muted">{p.sourceName}</span></div></button>
        <div className="mt-4 pt-3 border-t border-mc-border flex items-center justify-between gap-2"><span className="text-xs text-mc-muted">{p.downloads.toLocaleString()} downloads</span><button onClick={()=>void openDetail(p)} className="text-xs font-semibold text-mc-red-bright hover:underline">View details</button></div>
      </article>)}</div>}
      {(source==='modrinth'||source==='all') && <div className="flex justify-center gap-3 mt-7"><button disabled={page===0||remoteLoading} onClick={()=>setPage(p=>Math.max(0,p-1))} className="px-4 py-2 rounded-lg border border-mc-border disabled:opacity-40">Previous</button><span className="self-center text-xs text-mc-muted">Page {page+1}</span><button disabled={remoteLoading||displayed.length<24} onClick={()=>setPage(p=>p+1)} className="px-4 py-2 rounded-lg border border-mc-border disabled:opacity-40">Load more</button></div>}
      <p className="mt-8 text-center text-xs text-mc-muted">Source availability and browser CORS rules vary. CubeNest does not fabricate download success or redirect failed downloads.</p>
    </div>
    {selected && <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={`Details for ${selected.title}`} onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-mc-border bg-mc-surface shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-mc-border bg-mc-surface p-4"><div className="flex items-center gap-3 min-w-0">{selected.icon&&<img src={selected.icon} alt="" className="w-11 h-11 rounded-xl object-cover"/>}<div className="min-w-0"><h2 className="font-bold text-mc-white truncate">{selected.title}</h2><p className="text-xs text-mc-muted">{selected.sourceName} · {selected.downloads.toLocaleString()} downloads</p></div></div><button onClick={()=>setSelected(null)} className="p-2 rounded-lg hover:bg-mc-gray" aria-label="Close details"><X size={20}/></button></div>
      <div className="p-5 sm:p-7"><p className="text-sm text-mc-muted mb-4">By {selected.author || 'Community creator'} · Updated {humanDate(selected.updated)}</p>{detailLoading&&<p className="flex items-center gap-2 text-sm text-mc-muted mb-4"><img src={LOADING_GIF} alt="" className="w-8 h-8"/>Loading full description and releases…</p>}
        <p className="text-sm leading-7 text-mc-text whitespace-pre-wrap">{textOnly(selected.body || selected.description || 'No description provided.')}</p>
        {selected.gallery.length>0&&<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">{selected.gallery.slice(0,8).map((url,i)=><img key={url+i} src={url} loading="lazy" alt={`${selected.title} screenshot ${i+1}`} className="w-full rounded-lg border border-mc-border object-cover"/>)}</div>}
        <div className="flex flex-wrap gap-2 mt-5">{selected.gameVersions.slice(0,20).map(v=><span key={v} className="rounded-md bg-mc-gray border border-mc-border px-2 py-1 text-xs text-mc-muted">MC {v}</span>)}{selected.loaders.slice(0,8).map(v=><span key={v} className="rounded-md bg-mc-gray border border-mc-border px-2 py-1 text-xs text-mc-muted">{v}</span>)}</div>
        {selected.versions?.[0]&&<div className="mt-5 rounded-xl bg-mc-gray p-3"><p className="text-sm font-semibold">{selected.versions[0].name}</p><p className="text-xs text-mc-muted mt-1">{selected.versions[0].version_number} · Published {humanDate(selected.versions[0].date_published)} · {selected.versions[0].files.length} file(s)</p>{selected.versions[0].changelog&&<p className="text-sm mt-3 whitespace-pre-wrap">{textOnly(selected.versions[0].changelog).slice(0,3000)}</p>}</div>}
        <div className="flex flex-wrap gap-3 mt-7"><button onClick={()=>beginDownload(selected)} disabled={detailLoading} className="inline-flex items-center gap-2 rounded-xl bg-mc-red px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Download size={16}/>Download file</button>{selected.platform==='modrinth'&&selected.full?.license?.name&&<span className="self-center text-xs text-mc-muted">License: {selected.full.license.name}</span>}</div>
        {downloadState&&<p role="status" className={`mt-4 flex gap-2 text-sm ${downloadState.startsWith('Download initiated')?'text-emerald-300':'text-amber-200'}`}>{downloadState.startsWith('Download initiated')?<CheckCircle2 size={17}/>:<AlertCircle size={17}/>}<span>{downloadState}</span></p>}
        <p className="mt-4 text-xs text-mc-muted">Direct browser downloads require the file host to permit cross-origin requests. If blocked, CubeNest reports the failure and does not open an external page.</p>
      </div></div></div>}
    {downloadChallenge && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" role="dialog" aria-modal="true" aria-label="Human verification" onMouseDown={e=>{if(e.target===e.currentTarget&&!downloadBusy)setDownloadChallenge(null)}}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-mc-border bg-mc-surface shadow-2xl animate-[fadeIn_.22s_ease-out]">
        <div className="relative overflow-hidden border-b border-mc-border p-6"><div className="absolute inset-0 bg-gradient-to-br from-mc-red/20 via-transparent to-transparent pointer-events-none"/><div className="relative flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-mc-red/15 text-mc-red-bright"><Puzzle size={23}/></div><div><p className="text-xs uppercase tracking-[.2em] text-mc-red-bright font-bold">CubeNest Download</p><h2 className="mt-1 text-xl font-extrabold text-mc-white">Quick human check</h2></div><button disabled={downloadBusy} onClick={()=>setDownloadChallenge(null)} className="ml-auto rounded-xl p-2 hover:bg-mc-gray disabled:opacity-40" aria-label="Close verification"><X size={19}/></button></div><p className="relative mt-4 text-sm leading-6 text-mc-muted">Confirm the checkbox to continue downloading <span className="font-semibold text-mc-white">{downloadChallenge.title}</span>.</p></div>
        <div className="p-6"><label className={`group flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all duration-300 ${humanChecked?'border-emerald-500/60 bg-emerald-500/10':'border-mc-border bg-mc-gray/70 hover:border-mc-red/50'}`}><input type="checkbox" checked={humanChecked} disabled={downloadBusy} onChange={e=>setHumanChecked(e.target.checked)} className="peer sr-only"/><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 transition-all duration-300 ${humanChecked?'scale-105 border-emerald-400 bg-emerald-500 text-white':'border-mc-muted bg-transparent group-hover:border-mc-red-bright'}`}>{humanChecked&&<CheckCircle2 size={20} className="animate-[popIn_.22s_ease-out]"/>}</span><span className="min-w-0 flex-1"><span className="block font-semibold text-mc-white">I'm not a robot</span><span className="mt-1 block text-xs text-mc-muted">A quick on-page confirmation before download.</span></span><span className="text-[10px] font-bold tracking-widest text-mc-muted">CN</span></label>
          <div className="mt-5 flex gap-3"><button disabled={downloadBusy} onClick={()=>setDownloadChallenge(null)} className="flex-1 rounded-xl border border-mc-border px-4 py-3 text-sm font-semibold text-mc-text hover:bg-mc-gray disabled:opacity-40">Cancel</button><button disabled={!humanChecked||downloadBusy} onClick={()=>void executeDownload(downloadChallenge)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-mc-red px-4 py-3 text-sm font-bold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">{downloadBusy?<><RefreshCw size={16} className="animate-spin"/> Preparing…</>:<><Download size={16}/> Continue</>}</button></div>
          <p className="mt-4 text-[11px] leading-5 text-mc-muted">This is a lightweight confirmation UI, not a security CAPTCHA. Download availability still depends on the resource host and its browser access policy.</p>
        </div>
      </div>
    </div>}
  </div>;
}
