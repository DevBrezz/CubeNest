import { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles, Box, Layers, Shirt, SlidersHorizontal, ArrowUpRight, RefreshCw, Gamepad2 } from 'lucide-react';
import './Mods.css';

type ModResource = { id: string; title: string; description: string; url: string; icon: string | null; category: string; edition: 'Java' | 'Bedrock' | 'Both' | 'Unknown'; updated?: string; downloads?: number };
type ModData = { lastSynced?: string; resources?: ModResource[] };
const TYPES = [
  { id: 'all', label: 'All resources', icon: Layers },
  { id: 'texture', label: 'Texture Packs', icon: Layers },
  { id: 'shaders', label: 'Shaders', icon: Sparkles },
  { id: 'mods', label: 'Mods', icon: Box },
  { id: 'addons', label: 'Addons', icon: Gamepad2 },
  { id: 'skins', label: 'Skins', icon: Shirt },
] as const;
export function Mods() {
  const [data, setData] = useState<ModData>({ resources: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edition, setEdition] = useState<'All' | 'Java' | 'Bedrock'>('All');
  const [type, setType] = useState<string>('all');
  const [search, setSearch] = useState('');
  useEffect(() => {
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}data/curseforge.json?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(`Catalogue unavailable (${r.status})`); return r.json(); })
      .then((json: ModData) => { if (alive) setData(json); })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Could not load resources'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  const all = data.resources ?? [];
  const filtered = useMemo(() => all.filter(r => {
    const q = search.trim().toLowerCase();
    return (!q || `${r.title} ${r.description} ${r.category}`.toLowerCase().includes(q)) &&
      (edition === 'All' || r.edition === edition || r.edition === 'Both' || r.edition === 'Unknown') &&
      (type === 'all' || r.category === type);
  }), [all, search, edition, type]);
  return <div className="mods-page pt-24 pb-20 min-h-screen">
    <section className="mods-hero max-w-6xl mx-auto px-4 sm:px-6">
      <div className="mods-hero-glow" />
      <div className="mods-eyebrow"><Sparkles size={14}/> KINGBREZZ RESOURCE HUB</div>
      <h1>Discover your next <span>world.</span></h1>
      <p>Explore Minecraft mods, texture packs, shaders, addons and skins published on CurseForge.</p>
      <div className="mods-meta"><span><span className="mods-live-dot"/> Auto-synced catalogue</span><span>{all.length} resources</span><span>CurseForge · KingBrezzX</span></div>
      <a className="mods-source-link" href="https://www.curseforge.com/members/kingbrezzx/projects" target="_blank" rel="noreferrer">View creator profile <ArrowUpRight size={16}/></a>
    </section>
    <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
      <div className="mods-editions" role="group" aria-label="Minecraft edition">
        {(['All','Java','Bedrock'] as const).map(v => <button key={v} onClick={() => setEdition(v)} className={edition === v ? 'active' : ''}>{v === 'All' ? 'All Editions' : `Minecraft ${v}`}</button>)}
      </div>
      <div className="mods-categories" role="group" aria-label="Resource category">
        {TYPES.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => setType(item.id)} className={type === item.id ? 'active' : ''}><Icon size={18}/><span>{item.label}</span></button>; })}
      </div>
      <div className="mods-toolbar"><div className="mods-search"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." aria-label="Search resources"/></div><div className="mods-count"><SlidersHorizontal size={15}/>{filtered.length} results</div></div>
      {error && <div className="mods-notice">The catalogue could not be loaded. You can still browse the <a href="https://www.curseforge.com/members/kingbrezzx/projects" target="_blank" rel="noreferrer">CurseForge profile</a>.</div>}
      {loading ? <div className="mods-grid">{Array.from({length:8},(_,i)=><div className="mods-skeleton" key={i}/>)}</div> : filtered.length ? <div className="mods-grid">{filtered.map((r,i)=><a className="mods-card" href={r.url} target="_blank" rel="noreferrer" key={r.id} style={{animationDelay:`${Math.min(i,8)*35}ms`}}><div className="mods-card-art">{r.icon ? <img src={r.icon} alt="" loading="lazy" decoding="async"/> : <div className="mods-placeholder"><Box size={32}/></div>}<span>{r.edition}</span></div><div className="mods-card-body"><div className="mods-card-category">{r.category}</div><h2>{r.title}</h2><p>{r.description || 'Minecraft resource by KingBrezzX.'}</p><div className="mods-card-bottom"><span>View on CurseForge</span><ArrowUpRight size={16}/></div></div></a>)}</div> : <div className="mods-empty"><RefreshCw size={25}/><h2>No resources found</h2><p>Try another category or search term.</p><button onClick={() => {setSearch('');setType('all');setEdition('All');}}>Reset filters</button></div>}
      <div className="mods-footnote">{data.lastSynced ? `Last catalogue sync: ${new Date(data.lastSynced).toLocaleString()}` : 'Catalogue syncs automatically through GitHub Actions.'} · Resource details and downloads are hosted by CurseForge.</div>
    </section>
  </div>;
}
