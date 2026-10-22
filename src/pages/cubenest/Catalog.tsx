import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpRight, Blocks, Boxes, ChevronLeft, ChevronRight, ExternalLink, Search, SlidersHorizontal } from 'lucide-react';
import { useResources } from '../../hooks/useResources';
import type { Resource } from '../../types/resource';

type Kind = 'resources' | 'plugins';
const pageSize = 12;

const API_BASE = String(
  import.meta.env.VITE_CUBENEST_UPLOAD_API ||
  import.meta.env.VITE_CUBENEST_API_URL || ''
).trim().replace(/\/+$/, '');

type CommunitySubmission = {
  id: number; title: string; kind: string; platform: string;
  category: string; version: string; description: string;
  original_name: string; size: number;
  image_filename?: string | null; created_at?: number;
};

function communityAsResource(item: CommunitySubmission): Resource {
  const id = `community-${item.id}`;
  const date = item.created_at
    ? new Date(item.created_at * 1000).toISOString()
    : new Date(0).toISOString();
  return {
    id, platform: 'custom', platformId: String(item.id), slug: id,
    title: item.title, description: item.description || '',
    body: item.description || '',
    icon: item.image_filename && API_BASE
      ? `${API_BASE}/api/cubenest-mods/${item.id}/image` : null,
    gallery: [], categories: [item.category || item.kind || 'Other'],
    loaders: [item.platform || 'Unknown'],
    gameVersions: item.version ? [item.version] : [],
    version: item.version || '', downloads: 0,
    published: date, updated: date,
    url: `/resource/${id}`,
    downloadUrl: API_BASE
      ? `${API_BASE}/api/cubenest-mods/${item.id}/download` : '',
    featured: false, hidden: false,
  };
}

function categoriesFor(kind: Kind) { return kind === 'plugins' ? ['All categories','Administration','Economy','Gameplay','Protection','Utility','World management'] : ['All categories','Mods','Texture Packs','Shaders','Addons','Skins']; }
function categoryOf(r: Resource): string {
 const text = `${r.categories.join(' ')} ${r.title} ${r.description} ${r.loaders.join(' ')}`.toLowerCase();
 if (/shader/.test(text)) return 'Shaders'; if (/texture|resource.?pack/.test(text)) return 'Texture Packs'; if (/skin/.test(text)) return 'Skins'; if (/addon|behavior pack|mcaddon/.test(text)) return 'Addons';
 if (r.platform === 'spigot' || /plugin/.test(text)) return 'Plugins'; return 'Mods';
}
export function Catalog({ kind }: { kind: Kind }) {
 const { resources, loading: catalogueLoading, error } = useResources();
 const [communityResources, setCommunityResources] = useState<Resource[]>([]);
 const [communityLoading, setCommunityLoading] = useState(true);
 const [params, setParams] = useSearchParams();

 useEffect(() => {
   let cancelled = false;
   async function loadCommunity() {
     if (!API_BASE) {
       setCommunityLoading(false);
       return;
     }
     try {
       const response = await fetch(`${API_BASE}/api/cubenest-mods`);
       const data = await response.json();
       if (!response.ok || data.success !== true) {
         throw new Error('Community API request failed');
       }
       const items: CommunitySubmission[] =
         Array.isArray(data.submissions) ? data.submissions : [];
       if (!cancelled) {
         setCommunityResources(items.map(communityAsResource));
       }
     } catch (err) {
       console.warn('Community catalogue unavailable:', err);
     } finally {
       if (!cancelled) setCommunityLoading(false);
     }
   }
   void loadCommunity();
   return () => { cancelled = true; };
 }, []);
 const [search, setSearch] = useState(params.get('q') || ''); const [edition, setEdition] = useState('All editions'); const [category, setCategory] = useState('All categories'); const [version, setVersion] = useState('All versions'); const [page, setPage] = useState(1);
 const plugins = kind === 'plugins';
 const allResources = useMemo(
   () => [...resources, ...communityResources],
   [resources, communityResources]
 );
 const loading = catalogueLoading || communityLoading;
 const list = useMemo(() => allResources.filter(r => !r.hidden).filter(r => plugins ? r.platform === 'spigot' : true).filter(r => {
   const q = search.trim().toLowerCase(); const text = `${r.title} ${r.description} ${r.categories.join(' ')} ${r.loaders.join(' ')}`.toLowerCase();
   if (q && !text.includes(q)) return false;
   if (category !== 'All categories') { if (plugins) { if (!text.includes(category.toLowerCase().split(' ')[0])) return false; } else if (categoryOf(r) !== category) return false; }
   if (edition !== 'All editions') { const isBedrock = /bedrock|mcpe|pocket edition|addon|mcaddon/.test(text); if (edition === 'Bedrock' && !isBedrock) return false; if (edition === 'Java' && isBedrock) return false; }
   if (version !== 'All versions' && !r.gameVersions.includes(version)) return false;
   return true;
 }).sort((a,b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()), [allResources, plugins, search, edition, category, version]);
 const versions = [...new Set(resources.flatMap(r => r.gameVersions))].filter(Boolean).sort((a,b)=>b.localeCompare(a, undefined, {numeric:true})).slice(0,40);
 const pages = Math.max(1, Math.ceil(list.length / pageSize)); const shown = list.slice((page-1)*pageSize, page*pageSize);
 const title = plugins ? 'Plugin Center' : 'Mods & Resources';
 return <div className="cn-page cn-catalog"><section className="cn-page-hero"><span className="cn-eyebrow"><Blocks size={14}/> CUBENEST DIRECTORY</span><h1>{title}<span>.</span></h1><p>{plugins ? 'Find server-side plugins for Paper, Spigot, and Bukkit. Check platform and Minecraft version compatibility before installing.' : 'Explore community Minecraft creations for Java and Bedrock Edition, from performance mods to world-changing addons.'}</p><div className="cn-catalog-search"><Search size={19}/><input aria-label={`Search ${title}`} value={search} onChange={e=>{setSearch(e.target.value);setPage(1);setParams(e.target.value?{q:e.target.value}:{})}} placeholder={plugins ? 'Search plugins, features, or creators…' : 'Search mods, shaders, packs, or creators…'}/><kbd>ENTER</kbd></div><div className="cn-catalog-meta"><span><b>{list.length}</b> catalogue entries currently available</span><span><SlidersHorizontal size={14}/> Refine your search</span></div></section>
 <section className="cn-catalog-layout"><aside className="cn-filters"><h2>Filters</h2><label>Edition / platform<select value={edition} onChange={e=>{setEdition(e.target.value);setPage(1)}}><option>All editions</option><option>Java</option><option>Bedrock</option></select></label><label>Category<select value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}>{categoriesFor(kind).map(c=><option key={c}>{c}</option>)}</select></label><label>Minecraft version<select value={version} onChange={e=>{setVersion(e.target.value);setPage(1)}}><option>All versions</option>{versions.map(v=><option key={v}>{v}</option>)}</select></label><button className="cn-clear-filters" onClick={()=>{setSearch('');setEdition('All editions');setCategory('All categories');setVersion('All versions');setPage(1);setParams({})}}>Clear all filters</button><div className="cn-filter-note">Compatibility is based on the source catalogue metadata. Always review the publisher's release notes.</div></aside>
 <div className="cn-results"><div className="cn-results-top"><div><span className="cn-eyebrow">BROWSE CATALOGUE</span><h2>{search ? `Results for “${search}”` : plugins ? 'Server essentials' : 'Find your next favourite'}</h2></div><span className="cn-result-count">{list.length} results</span></div>
 {loading ? <div className="cn-resource-grid">{Array.from({length:6},(_,i)=><div className="cn-skeleton" key={i}/>)}</div> : error ? <div className="cn-state cn-state-error"><h3>Catalogue couldn't load</h3><p>{error}</p><button className="cn-btn cn-btn-ghost" onClick={()=>window.location.reload()}>Try again</button></div> : shown.length ? <><div className="cn-resource-grid">{shown.map(r=><ResourceCard key={r.id} resource={r} plugins={plugins}/>)}</div><div className="cn-pagination"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} aria-label="Previous page"><ChevronLeft size={17}/></button><span>Page <b>{page}</b> of {pages}</span><button disabled={page>=pages} onClick={()=>setPage(p=>p+1)} aria-label="Next page"><ChevronRight size={17}/></button></div></> : <div className="cn-state"><div className="cn-state-icon"><Boxes size={26}/></div><h3>No matching resources yet</h3><p>Try a different keyword or clear one of the filters. New items appear after the source sync runs successfully.</p><button className="cn-btn cn-btn-ghost" onClick={()=>{setSearch('');setEdition('All editions');setCategory('All categories');setVersion('All versions');setPage(1)}}>Reset filters</button></div>}
 <p className="cn-source-note">{plugins ? 'Plugin listings are drawn from the existing synced Spigot resource catalogue. Java JAR plugins do not run directly on Bedrock servers.' : 'Existing Modrinth and Spigot catalogue data is retained. CurseForge creator resources are shown when the sync source provides them.'}</p></div></section></div>;
}
function ResourceCard({resource:r, plugins}:{resource:Resource;plugins:boolean}) {
 const edition = /bedrock|mcpe|pocket edition|addon|mcaddon/i.test(`${r.title} ${r.description} ${r.categories.join(' ')}`) ? 'Bedrock' : 'Java';
 return <article className="cn-resource-card"><Link to={`/resource/${encodeURIComponent(r.id)}`} className="cn-resource-image" aria-label={`View ${r.title} details`}>{r.icon ? <img src={r.icon} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/> : <div className="cn-resource-placeholder"><Blocks size={30}/></div>}<span className="cn-resource-type">{plugins ? 'PLUGIN' : categoryOf(r).toUpperCase()}</span></Link><div className="cn-resource-card-body"><div className="cn-resource-meta"><span>{r.platform === 'modrinth' ? 'Modrinth' : r.platform === 'spigot' ? 'Spigot' : 'Community'}</span><span>{edition}</span></div><Link to={`/resource/${encodeURIComponent(r.id)}`} className="cn-resource-title">{r.title}</Link><p>{r.description || 'Open the resource page to see publisher details and compatibility information.'}</p><div className="cn-resource-tags">{(r.loaders.length ? r.loaders.slice(0,2) : r.categories.slice(0,2)).map(tag=><span key={tag}>{tag}</span>)}{r.gameVersions[0] && <span>{r.gameVersions[0]}</span>}</div><div className="cn-resource-card-footer"><span><ArrowDownToLine size={14}/> {Number(r.downloads || 0).toLocaleString()} downloads</span><a href={r.url} target="_blank" rel="noreferrer" aria-label={`Open source page for ${r.title}`}><ExternalLink size={15}/></a></div></div></article>;
}
export function ResourceDetail() {
 const { resources, loading } = useResources();
 const id = decodeURIComponent(window.location.pathname.split('/').pop() || '');
 const isCommunity = /^community-\d+$/.test(id);
 const communityId = isCommunity ? Number(id.slice('community-'.length)) : 0;
 const r = resources.find(item => item.id === id);
 const [communityItem, setCommunityItem] = useState<CommunitySubmission | null>(null);
 const [communityLoading, setCommunityLoading] = useState(isCommunity);
 const [communityError, setCommunityError] = useState('');

 useEffect(() => {
  if (!isCommunity) {
   setCommunityLoading(false);
   return;
  }
  let cancelled = false;
  setCommunityLoading(true);
  setCommunityError('');
  fetch(`${API_BASE}/api/cubenest-mods`)
   .then(async response => {
    if (!response.ok) throw new Error('Gagal mengambil resource komunitas.');
    return response.json();
   })
   .then(data => {
    if (cancelled) return;
    const items = Array.isArray(data?.submissions) ? data.submissions : [];
    const found = items.find((item: CommunitySubmission) => Number(item.id) === communityId);
    setCommunityItem(found || null);
    if (!found) setCommunityError('Resource tidak ditemukan atau belum disetujui.');
   })
   .catch(() => {
    if (!cancelled) setCommunityError('Resource gagal dimuat. Periksa koneksi dan coba lagi.');
   })
   .finally(() => {
    if (!cancelled) setCommunityLoading(false);
   });
  return () => { cancelled = true; };
 }, [isCommunity, communityId]);

 if (isCommunity) {
  if (communityLoading) return <div className="cn-page"><div className="cn-state">Loading resource details…</div></div>;
  if (!communityItem) return <div className="cn-page"><div className="cn-state"><h1>Resource not found</h1><p>{communityError || 'Resource tidak tersedia.'}</p><Link className="cn-btn cn-btn-primary" to="/resources">Browse resources</Link></div></div>;

  const item = communityItem;
  const imageUrl = item.image_filename ? `${API_BASE}/api/cubenest-mods/${item.id}/image` : '';
  const downloadUrl = `${API_BASE}/api/cubenest-mods/${item.id}/download`;
  const updated = item.created_at ? new Date(item.created_at) : null;

  return <div className="cn-page cn-detail">
   <Link to="/resources" className="cn-back-link"><ChevronLeft size={16}/> Back to catalogue</Link>
   <section className="cn-detail-head">
    <div className="cn-detail-icon">{imageUrl ? <img src={imageUrl} alt={item.title} onError={e => { e.currentTarget.style.display = 'none'; }}/> : <Blocks size={40}/>}</div>
    <div>
     <span className="cn-eyebrow">COMMUNITY RESOURCE · {String(item.platform || 'Minecraft').toUpperCase()}</span>
     <h1>{item.title}</h1>
     <p>{item.description || 'No description provided.'}</p>
     <div className="cn-tags"><span>{item.category || item.kind || 'Community upload'}</span>{item.version ? <span>Version {item.version}</span> : null}</div>
     <div className="cn-detail-actions">
      <a className="cn-btn cn-btn-primary" href={downloadUrl}><ArrowDownToLine size={17}/> Download resource</a>
     </div>
    </div>
   </section>
   <div className="cn-detail-columns">
    <section className="cn-detail-panel">
     <h2>About this resource</h2>
     <p>{item.description || 'The creator has not supplied a longer description.'}</p>
     <h3>Compatibility</h3>
     <p>Platform: {item.platform || 'Not specified'}.</p>
     <p>Version: {item.version || 'Not provided'}.</p>
    </section>
    <aside className="cn-detail-panel cn-detail-facts">
     <h2>Resource info</h2>
     <dl>
      <dt>Creator / source</dt><dd>CubeNest Community</dd>
      <dt>File</dt><dd>{item.original_name || 'Community upload'}</dd>
      <dt>Size</dt><dd>{Number.isFinite(Number(item.size)) && Number(item.size) > 0 ? `${(Number(item.size) / 1024 / 1024).toFixed(2)} MB` : 'Not provided'}</dd>
      <dt>Uploaded</dt><dd>{updated && !Number.isNaN(updated.getTime()) ? updated.toLocaleDateString() : 'Not provided'}</dd>
     </dl>
     <Link to="/report" className="cn-report-link">Report this resource ↗</Link>
    </aside>
   </div>
  </div>;
 }

 if (loading) return <div className="cn-page"><div className="cn-state">Loading resource details…</div></div>;
 if (!r) return <div className="cn-page"><div className="cn-state"><h1>Resource not found</h1><p>This resource isn't in the current catalogue. It may have been removed or its ID may be incorrect.</p><Link className="cn-btn cn-btn-primary" to="/resources">Browse resources</Link></div></div>;
 return <div className="cn-page cn-detail"><Link to={r.platform==='spigot'?'/plugins':'/resources'} className="cn-back-link"><ChevronLeft size={16}/> Back to catalogue</Link><section className="cn-detail-head"><div className="cn-detail-icon">{r.icon?<img src={r.icon} alt=""/>:<Blocks size={40}/>}</div><div><span className="cn-eyebrow">{r.platform==='spigot'?'PLUGIN':'MINECRAFT RESOURCE'} · {r.platform.toUpperCase()}</span><h1>{r.title}</h1><p>{r.description}</p><div className="cn-tags">{r.loaders.map(x=><span key={x}>{x}</span>)}{r.gameVersions.map(x=><span key={x}>MC {x}</span>)}</div><div className="cn-detail-actions"><a className="cn-btn cn-btn-primary" href={r.downloadUrl || r.url} target="_blank" rel="noreferrer"><ArrowDownToLine size={17}/> Visit download source <ArrowUpRight size={15}/></a><a className="cn-btn cn-btn-ghost" href={r.url} target="_blank" rel="noreferrer">Publisher page <ExternalLink size={15}/></a></div></div></section><div className="cn-detail-columns"><section className="cn-detail-panel"><h2>About this resource</h2><p>{r.body || r.description || 'The publisher has not supplied a longer description in the synced catalogue.'}</p><h3>Compatibility</h3><p>Reported game versions: {r.gameVersions.length ? r.gameVersions.join(', ') : 'Not provided by source'}.</p><p>Loaders / platform: {r.loaders.length ? r.loaders.join(', ') : r.platform==='spigot'?'Spigot (Java server plugin)':'Not specified by source'}.</p></section><aside className="cn-detail-panel cn-detail-facts"><h2>Resource info</h2><dl><dt>Creator / source</dt><dd>{r.platform==='modrinth'?'Modrinth':r.platform==='spigot'?'Spigot':'Community source'}</dd><dt>Downloads</dt><dd>{Number(r.downloads||0).toLocaleString()}</dd><dt>Latest version</dt><dd>{r.version || 'Not provided'}</dd><dt>Last updated</dt><dd>{r.updated ? new Date(r.updated).toLocaleDateString() : 'Not provided'}</dd><dt>Changelog</dt><dd>See the publisher page for the official changelog.</dd></dl><Link to="/report" className="cn-report-link">Report this resource ↗</Link></aside></div></div>;
}
