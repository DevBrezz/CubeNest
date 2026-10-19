import { useMemo, useState } from 'react';
import { Search, Package, Download, ExternalLink, X, Layers3, Sparkles, ArrowUpRight } from 'lucide-react';
import { useResources, useFilteredResources } from '../hooks/useResources';
import { ProjectCard } from '../components/ProjectCard';
import type { Resource, SortOption, PlatformFilter } from '../types/resource';

type PluginSource = 'global' | 'spigot' | 'modrinth' | 'pocketmine';
const LOADING_GIF = 'https://i.imgur.com/cFLg43W.gif';

function formatBBCode(input: string) {
  // Render common BBCode as readable text without injecting untrusted HTML.
  return input
    .replace(/\[br\s*\/?\]/gi, '\n')
    .replace(/\[\/?(?:b|i|u|s|center|left|right|quote|list|\*|hr)[^\]]*\]/gi, '')
    .replace(/\[url=(https?:\/\/[^\]]+)\]([\s\S]*?)\[\/url\]/gi, '$2 ($1)')
    .replace(/\[img\]([\s\S]*?)\[\/img\]/gi, '[Image: $1]')
    .replace(/\[color=[^\]]+\]([\s\S]*?)\[\/color\]/gi, '$1')
    .replace(/\[size=[^\]]+\]([\s\S]*?)\[\/size\]/gi, '$1')
    .replace(/\[\/?(?:spoiler|code|php|html|youtube|media)[^\]]*\]/gi, '')
    .replace(/\[\/?[a-z*]+(?:=[^\]]*)?\]/gi, '')
    .trim();
}

export function Plugins() {
  const { resources, loading, error, data } = useResources();
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<PluginSource>('global');
  const [sort, setSort] = useState<SortOption>('updated');
  const [selected, setSelected] = useState<Resource | null>(null);

  const pluginResources = useMemo(
    () => resources.filter((r) => !r.hidden && (r.platform === 'spigot' || r.platform === 'modrinth')),
    [resources]
  );
  const platformFilter: PlatformFilter = source === 'spigot' ? 'spigot' : source === 'modrinth' ? 'modrinth' : 'all';
  const filtered = useFilteredResources(pluginResources, search, platformFilter, 'all', sort);
  const shown = source === 'pocketmine' ? [] : filtered;

  return (
    <div className="pt-24 pb-16 min-h-screen mc-grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <section className="relative overflow-hidden rounded-3xl border border-mc-border bg-gradient-to-br from-mc-surface via-mc-gray to-mc-surface p-6 sm:p-10 mb-8">
          <div className="absolute -right-8 -top-12 w-56 h-56 rounded-full bg-mc-red/10 blur-3xl pointer-events-none" />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-mc-red/30 bg-mc-red/10 px-3 py-1 text-xs text-mc-red-bright mb-4"><Sparkles size={14}/> CUBENEST RESOURCE HUB</div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-mc-white">Discover <span className="text-mc-red-bright">Plugins</span></h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-mc-muted">Temukan plugin server Minecraft dari katalog CubeNest, Modrinth, dan SpigotMC. Buka detail untuk melihat informasi dan menuju download resmi.</p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-mc-muted">
              <span className="inline-flex items-center gap-2 rounded-lg border border-mc-border bg-black/10 px-3 py-2"><Layers3 size={14}/>{pluginResources.length.toLocaleString()} resource tersinkron</span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-mc-border bg-black/10 px-3 py-2"><Download size={14}/> Sumber download resmi</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-mc-border bg-mc-surface/90 p-4 sm:p-5 mb-8 space-y-4">
          <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mc-muted"/><input type="search" placeholder="Cari nama plugin, deskripsi, kategori..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl bg-mc-gray border border-mc-border text-sm text-mc-white placeholder:text-mc-muted focus:outline-none focus:border-mc-red"/></div>
          <div className="flex flex-wrap gap-2 items-center">
            {([{id:'global',label:'Semua sumber'},{id:'spigot',label:'SpigotMC'},{id:'modrinth',label:'Modrinth'},{id:'pocketmine',label:'PocketMine-MP'}] as const).map(opt=><button key={opt.id} type="button" onClick={()=>setSource(opt.id)} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${source===opt.id?'bg-mc-red border-mc-red text-white shadow-lg shadow-mc-red/20':'bg-mc-gray border-mc-border text-mc-text hover:border-mc-red/50'}`}>{opt.label}</button>)}
            <select value={sort} onChange={e=>setSort(e.target.value as SortOption)} className="sm:ml-auto px-3 py-2 rounded-xl bg-mc-gray border border-mc-border text-xs text-mc-text"><option value="updated">Terbaru diperbarui</option><option value="newest">Paling baru</option><option value="downloads">Download terbanyak</option><option value="alphabetical">Nama A–Z</option></select>
            <span className="text-xs text-mc-muted">{source==='pocketmine'?'Poggit':shown.length.toLocaleString()+' hasil'}</span>
          </div>
        </section>

        {error && <div className="rounded-xl border border-red-700/60 bg-red-950/30 text-red-200 p-4 mb-6 text-sm">Katalog lokal gagal dimuat: {error}</div>}
        {loading ? <div className="min-h-[320px] flex flex-col items-center justify-center text-center rounded-2xl border border-mc-border bg-mc-surface/70 p-8"><img src={LOADING_GIF} alt="" className="w-28 h-28 object-contain rounded-xl"/><p className="mt-4 text-lg font-bold text-mc-white">Loading plugins<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span></p><p className="mt-2 text-sm text-mc-muted">Lagi mengambil katalog resource, tunggu sebentar ya.</p></div>
          : source === 'pocketmine' ? <div className="rounded-2xl border border-mc-border bg-mc-surface p-8 sm:p-12 text-center"><Package className="mx-auto w-10 h-10 text-mc-muted mb-4"/><h2 className="text-xl font-bold text-mc-white">Katalog PocketMine-MP</h2><p className="max-w-xl mx-auto mt-2 text-sm text-mc-muted">Katalog PocketMine-MP belum tersedia di file sinkron CubeNest. Buka katalog Poggit untuk mencari plugin dan mengunduh file PHAR dari sumber resminya.</p><a className="inline-flex items-center gap-2 mt-5 px-5 py-3 rounded-xl bg-mc-red text-white font-semibold text-sm hover:opacity-90" href="https://poggit.pmmp.io/plugins" target="_blank" rel="noreferrer">Jelajahi Poggit <ArrowUpRight size={16}/></a></div>
          : shown.length===0 ? <div className="text-center py-20 rounded-2xl border border-mc-border bg-mc-surface/50 text-mc-muted"><Package className="w-10 h-10 mx-auto mb-3 opacity-50"/><p className="font-semibold">Belum ada plugin yang cocok.</p><p className="text-xs mt-2">Coba kata pencarian atau platform lain.</p></div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{shown.map((r,i)=><div key={r.id} className="relative" onDoubleClick={()=>setSelected(r)}><ProjectCard resource={r} index={i}/><button type="button" onClick={()=>setSelected(r)} className="mt-2 w-full rounded-lg border border-mc-border bg-mc-surface px-3 py-2.5 text-xs font-semibold text-mc-text hover:border-mc-red/60 hover:text-mc-white transition-colors">Lihat detail plugin</button></div>)}</div>}
        <p className="mt-8 text-center text-xs text-mc-muted">Kredit dan distribusi file mengikuti ketentuan masing-masing platform. CubeNest mengarahkan download ke sumber resmi.</p>
      </div>
      {selected && <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={`Detail ${selected.title}`} onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-mc-border bg-mc-surface shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-mc-border bg-mc-surface/95 backdrop-blur p-4"><div className="flex items-center gap-3 min-w-0">{selected.icon&&<img src={selected.icon} alt="" className="w-11 h-11 rounded-xl object-cover"/>}<div className="min-w-0"><h2 className="font-bold text-mc-white truncate">{selected.title}</h2><p className="text-xs text-mc-muted">{selected.platform} · {selected.downloads.toLocaleString()} downloads</p></div></div><button onClick={()=>setSelected(null)} className="p-2 rounded-lg hover:bg-mc-gray text-mc-muted" aria-label="Tutup detail"><X size={20}/></button></div><div className="p-5 sm:p-7"><p className="text-sm leading-7 text-mc-text whitespace-pre-wrap">{formatBBCode(selected.body || selected.description || 'Deskripsi belum tersedia.')}</p><div className="flex flex-wrap gap-2 mt-5">{selected.gameVersions.slice(0,12).map(v=><span key={v} className="rounded-md bg-mc-gray border border-mc-border px-2 py-1 text-xs text-mc-muted">MC {v}</span>)}{selected.loaders.slice(0,8).map(v=><span key={v} className="rounded-md bg-mc-gray border border-mc-border px-2 py-1 text-xs text-mc-muted">{v}</span>)}</div><div className="flex flex-wrap gap-3 mt-7"><a href={selected.downloadUrl||selected.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-mc-red px-5 py-3 text-sm font-bold text-white"><Download size={16}/>Download plugin <ExternalLink size={14}/></a><a href={selected.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-mc-border px-5 py-3 text-sm font-semibold text-mc-text">Halaman resmi <ExternalLink size={14}/></a></div><p className="mt-4 text-xs text-mc-muted">Download akan diambil dari tautan rilis yang disediakan sumber plugin.</p></div></div></div>}
    </div>
  );
}
