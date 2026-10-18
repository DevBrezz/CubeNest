import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Boxes, Puzzle, Server, Palette, Sun, Package, Database, Search, Sparkles, UploadCloud, ShieldCheck, Gamepad2, Zap, Download } from 'lucide-react';
import { useResources } from '../hooks/useResources';
import { ProjectCard } from '../components/ProjectCard';
import { SolarSystemBackground } from '../components/SolarSystemBackground';

const portals = [
  { to: '/servers', icon: Server, number: '01', title: 'Server Hub', text: 'Find your next world: survival, SMP, PvP, minigames and more.', tags: ['Java', 'Bedrock', 'Multiplayer'], tint: 'from-sky-500/20' },
  { to: '/mods', icon: Boxes, number: '02', title: 'Mods & Resources', text: 'Discover mods, texture packs, shaders and modpacks from trusted sources.', tags: ['Mods', 'Textures', 'Shaders'], tint: 'from-emerald-500/20' },
  { to: '/plugins', icon: Puzzle, number: '03', title: 'Plugin Center', text: 'Tools and server extensions for Paper, Spigot and compatible platforms.', tags: ['Paper', 'Spigot', 'Bukkit'], tint: 'from-violet-500/20' },
  { to: '/bedrock', icon: Gamepad2, number: '04', title: 'Bedrock Library', text: 'Add-ons, maps, texture packs and skins for Minecraft Bedrock.', tags: ['Add-ons', 'Maps', 'MCPE'], tint: 'from-orange-500/20' },
];
const categories = [
  { to: '/resourcepacks', icon: Palette, title: 'Resource Packs', text: 'Give every block a new look.' },
  { to: '/shaders', icon: Sun, title: 'Shaders', text: 'Refresh your world’s visuals.' },
  { to: '/modpacks', icon: Package, title: 'Modpacks', text: 'Big adventures, ready to play.' },
  { to: '/datapacks', icon: Database, title: 'Data Packs', text: 'More ways to play vanilla.' },
];

export function Home() {
  const navigate = useNavigate();
  const { resources, loading } = useResources();
  const [q, setQ] = useState('');
  const featured = resources.filter((r) => r.featured && !r.hidden).slice(0, 6);
  const latest = [...resources].filter((r) => !r.hidden).sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()).slice(0, 6);
  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/mods');
  };

  return (
    <div className="relative overflow-hidden">
      <section className="relative min-h-[620px] sm:min-h-[690px] flex items-center pt-20 overflow-hidden">
        <SolarSystemBackground className="absolute inset-0 w-full h-full opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-mc-black via-mc-black/90 to-mc-black/35 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-mc-black via-transparent to-mc-black/30 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 w-full">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, ease: 'easeOut' }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-300/20 text-[11px] sm:text-xs text-emerald-300 mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> YOUR NEXT MINECRAFT DISCOVERY STARTS HERE
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-mc-white leading-[1.02] tracking-tight max-w-3xl">
              Build your world.<br /><span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-400 bg-clip-text text-transparent">Play your way.</span>
            </h1>
            <p className="mt-6 text-sm sm:text-lg text-mc-muted max-w-2xl leading-relaxed">Explore Minecraft mods, Bedrock add-ons, server plugins, texture packs and multiplayer servers — all in one community-driven place.</p>
            <form onSubmit={onSearch} className="mt-8 max-w-2xl">
              <div className="flex items-center gap-2 bg-mc-surface/90 border border-mc-border rounded-2xl p-2 backdrop-blur-xl shadow-2xl shadow-black/20 focus-within:border-emerald-400/60 transition-colors">
                <Search className="w-5 h-5 text-mc-muted ml-2 sm:ml-3 shrink-0" />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search mods, add-ons, plugins, servers..." className="min-w-0 flex-1 bg-transparent border-0 outline-none text-sm sm:text-base text-mc-white placeholder:text-mc-muted py-3" />
                <button type="submit" className="px-4 sm:px-6 py-3 rounded-xl bg-emerald-400 text-slate-950 text-sm font-bold hover:bg-emerald-300 active:scale-[.98] transition-all">Search</button>
              </div>
            </form>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              {[['Bedrock add-ons', '/bedrock'], ['Popular mods', '/mods'], ['Server plugins', '/plugins'], ['Find a server', '/servers']].map(([label, to]) => <Link key={to} to={to} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[.04] text-mc-muted hover:text-white hover:border-emerald-300/40 transition-colors">{label} <span className="text-emerald-300">↗</span></Link>)}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-mc-muted">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-300" /> Source-aware downloads</span>
              <span className="inline-flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-300" /> Fast discovery</span>
              <span className="inline-flex items-center gap-2"><UploadCloud className="w-4 h-4 text-emerald-300" /> Creator-friendly</span>
            </div>
          </motion.div>
        </div>
        <motion.div aria-hidden="true" className="hidden xl:block absolute right-[8%] top-[23%] w-44 h-44 rounded-[2.5rem] border border-emerald-200/20 bg-gradient-to-br from-emerald-300/15 to-cyan-500/5 backdrop-blur-sm shadow-[0_0_100px_rgba(52,211,153,.12)]" animate={{ y: [0, -12, 0], rotate: [0, 3, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>
          <div className="absolute inset-5 rounded-[1.8rem] border border-white/10 grid place-items-center"><Boxes className="w-20 h-20 text-emerald-200/80" /></div>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div><div className="text-[10px] font-bold uppercase tracking-[.22em] text-emerald-300 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Choose your destination</div><h2 className="text-2xl sm:text-3xl font-bold text-mc-white mt-2">What are you looking for?</h2></div>
          <p className="text-xs sm:text-sm text-mc-muted max-w-sm leading-relaxed">Four ways to discover, build and upgrade your Minecraft experience.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {portals.map((p, i) => <motion.div key={p.to} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ delay: i * .07, duration: .4 }}>
            <Link to={p.to} className={`group relative flex flex-col h-full min-h-[255px] overflow-hidden rounded-2xl border border-mc-border bg-gradient-to-br ${p.tint} to-mc-surface p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-300/40 hover:shadow-xl hover:shadow-black/20`}>
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/[.025] blur-2xl group-hover:bg-emerald-200/[.08] transition-colors" />
              <div className="relative flex items-center justify-between"><span className="text-[10px] font-bold tracking-[.2em] text-mc-muted">PORTAL / {p.number}</span><span className="w-11 h-11 rounded-xl bg-black/20 border border-white/10 grid place-items-center text-emerald-200 group-hover:scale-110 group-hover:rotate-3 transition-transform"><p.icon className="w-5 h-5" /></span></div>
              <div className="relative mt-7 flex-1"><h3 className="text-xl font-bold text-mc-white">{p.title}</h3><p className="text-xs sm:text-sm text-mc-muted mt-2 leading-relaxed">{p.text}</p><div className="flex flex-wrap gap-1.5 mt-4">{p.tags.map((tag) => <span key={tag} className="text-[10px] px-2 py-1 rounded-md border border-white/10 bg-black/10 text-mc-muted">{tag}</span>)}</div></div>
              <div className="relative mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-mc-white"><span>Explore collection</span><span className="w-8 h-8 rounded-full border border-white/10 grid place-items-center text-emerald-200 group-hover:bg-emerald-300 group-hover:text-slate-950 group-hover:border-emerald-300 transition-all"><ArrowRight className="w-4 h-4" /></span></div>
            </Link>
          </motion.div>)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map((c, i) => <motion.div key={c.to} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .04 }}><Link to={c.to} className="group flex items-center gap-3 rounded-xl border border-mc-border bg-mc-surface/70 p-3 sm:p-4 hover:border-emerald-300/30 hover:bg-mc-surface transition-all"><span className="w-10 h-10 shrink-0 rounded-lg bg-emerald-400/10 grid place-items-center text-emerald-300 group-hover:scale-105 transition-transform"><c.icon className="w-5 h-5" /></span><span className="min-w-0"><span className="block text-xs sm:text-sm font-semibold text-mc-white">{c.title}</span><span className="block text-[10px] sm:text-xs text-mc-muted mt-1">{c.text}</span></span></Link></motion.div>)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="flex items-end justify-between gap-4 mb-5"><div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300 flex items-center gap-2"><Download className="w-3.5 h-3.5" /> From the catalogue</div><h2 className="text-2xl sm:text-3xl font-bold text-mc-white mt-2">Community picks</h2><p className="text-xs text-mc-muted mt-1">Resources currently indexed by CubeNest.</p></div><Link to="/mods" className="shrink-0 text-xs font-semibold text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1">Browse all <ArrowRight className="w-3.5 h-3.5" /></Link></div>
        {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}</div> : (featured.length || latest.length) ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{(featured.length ? featured : latest).map((r, i) => <ProjectCard key={r.id} resource={r} index={i} />)}</div> : <div className="rounded-2xl border border-mc-border bg-mc-surface/60 p-7 text-center"><Package className="w-8 h-8 text-mc-muted mx-auto mb-3"/><p className="text-sm text-mc-white font-semibold">The catalogue is getting ready</p><p className="text-xs text-mc-muted mt-1">Explore the source libraries while CubeNest syncs resources.</p><div className="mt-4 flex flex-wrap justify-center gap-2"><Link to="/mods" className="px-4 py-2 rounded-lg bg-emerald-400 text-slate-950 text-xs font-bold">Browse mods</Link><Link to="/bedrock" className="px-4 py-2 rounded-lg border border-mc-border text-xs">Bedrock library</Link></div></div>}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16"><div className="relative overflow-hidden rounded-2xl border border-emerald-300/20 bg-gradient-to-r from-emerald-400/10 via-cyan-500/5 to-transparent p-6 sm:p-9"><div className="absolute -right-10 -top-16 w-64 h-64 rounded-full bg-emerald-300/[.06] blur-3xl"/><div className="relative flex flex-col md:flex-row md:items-center gap-5"><div className="w-12 h-12 rounded-xl bg-emerald-300/10 text-emerald-200 grid place-items-center shrink-0"><UploadCloud className="w-6 h-6"/></div><div className="flex-1"><h2 className="text-xl sm:text-2xl font-bold text-mc-white">Made something worth sharing?</h2><p className="text-xs sm:text-sm text-mc-muted mt-2 max-w-2xl leading-relaxed">Help other players discover your work. Review the publishing flow and available upload options before submitting a resource.</p></div><Link to="/upload" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-400 text-slate-950 text-xs font-bold hover:bg-emerald-300 transition-colors shrink-0">Publish a resource <ArrowRight className="w-4 h-4"/></Link></div></div></section>
    </div>
  );
}
