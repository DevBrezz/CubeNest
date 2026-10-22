import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Boxes, Puzzle, Server, Palette, Sun, Package, Database, Search, Sparkles, ShieldCheck, Gamepad2, Zap, Download, Paintbrush, UploadCloud, FileUp } from 'lucide-react';
import { useResources } from '../hooks/useResources';
import { ProjectCard } from '../components/ProjectCard';

const portals = [
  { to: '/servers', icon: Server, number: '01', title: 'Server Hub', text: 'Find your next world: survival, SMP, PvP, minigames and more.', tags: ['Java', 'Bedrock', 'Multiplayer'], tint: 'from-sky-500/20' },
  { to: '/mods', icon: Boxes, number: '02', title: 'Mods & Resources', text: 'Discover mods, texture packs, shaders and modpacks from trusted sources.', tags: ['Mods', 'Textures', 'Shaders'], tint: 'from-emerald-500/20' },
  { to: '/plugins', icon: Puzzle, number: '03', title: 'Plugin Center', text: 'Tools and server extensions for Paper, Spigot and compatible platforms.', tags: ['Paper', 'Spigot', 'Bukkit'], tint: 'from-violet-500/20' },
  { to: '/bedrock', icon: Gamepad2, number: '04', title: 'Bedrock Library', text: 'Add-ons, maps, texture packs and skins for Minecraft Bedrock.', tags: ['Add-ons', 'Maps', 'MCPE'], tint: 'from-orange-500/20' },
  { to: '/skin-creator', icon: Paintbrush, number: '05', title: 'Skin Creator', text: 'Paint classic or slim skins with a live 3D preview and export a ready PNG.', tags: ['Classic', 'Slim', '3D'], tint: 'from-fuchsia-500/20' },
];
const categories = [
  { to: '/cubenest-mods/mods', icon: Boxes, title: 'Mods', text: 'Java Edition mods and gameplay changes.', tint: 'from-emerald-500/15' },
  { to: '/cubenest-mods/plugins', icon: Puzzle, title: 'Plugins', text: 'Tools for Paper and compatible servers.', tint: 'from-violet-500/15' },
  { to: '/cubenest-mods/addons', icon: Gamepad2, title: 'Bedrock Add-ons', text: 'Add-ons made for Minecraft Bedrock.', tint: 'from-orange-500/15' },
  { to: '/cubenest-mods/resourcepacks', icon: Palette, title: 'Resource Packs', text: 'Explore textures and visual changes.', tint: 'from-sky-500/15' },
  { to: '/cubenest-mods/shaders', icon: Sun, title: 'Shaders', text: 'Visual enhancements for Java Edition.', tint: 'from-amber-500/15' },
  { to: '/cubenest-mods/skins', icon: Paintbrush, title: 'Skins', text: 'Find skins for your Minecraft character.', tint: 'from-fuchsia-500/15' },
  { to: '/cubenest-mods/modpacks', icon: Package, title: 'Modpacks', text: 'Discover collections of Java mods.', tint: 'from-cyan-500/15' },
  { to: '/skin-creator', icon: Paintbrush, title: 'Skin Creator', text: 'Create and preview your own skin in 3D.', tint: 'from-pink-500/15' },
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
        <img src="https://i.imgur.com/rvzwjx1.gif" alt="" aria-hidden="true" width="500" height="387" className="absolute inset-0 h-full w-full object-cover object-center" loading="eager" />
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-mc-black/90 via-mc-black/65 to-mc-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-mc-black via-transparent to-mc-black/20 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 w-full">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, ease: 'easeOut' }} className="max-w-3xl lg:max-w-[58%]">
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
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 -mt-7 sm:-mt-10 pb-12 sm:pb-16">
        <Link
          to="/upload"
          aria-label="Upload a Minecraft resource to CubeNest"
          className="group relative flex w-full min-h-[178px] sm:min-h-[206px] items-center gap-5 sm:gap-8 overflow-hidden rounded-3xl border border-emerald-300/35 bg-gradient-to-r from-emerald-950/95 via-slate-900 to-slate-950 p-5 sm:p-8 shadow-2xl shadow-emerald-950/25 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/70 hover:shadow-emerald-950/40"
        >
          <span aria-hidden="true" className="absolute -right-8 -top-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl transition-colors group-hover:bg-emerald-300/20" />
          <span className="relative grid h-20 w-20 sm:h-28 sm:w-28 shrink-0 place-items-center rounded-2xl sm:rounded-3xl border border-emerald-200/35 bg-emerald-400/15 text-emerald-200 shadow-lg shadow-emerald-950/40 transition-transform duration-300 group-hover:scale-105">
            <UploadCloud className="h-11 w-11 sm:h-16 sm:w-16" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-[.16em] text-emerald-200">
              <FileUp className="h-3.5 w-3.5" /> Creator upload
            </span>
            <span className="block text-2xl sm:text-4xl font-extrabold tracking-tight text-white">Share your creation</span>
            <span className="mt-2 block max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">Upload Minecraft mods, plugins, add-ons, skins, maps and other resources to CubeNest.</span>
            <span className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-950/30 transition-all group-hover:bg-emerald-200">
              Upload a resource <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </span>
        </Link>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div><div className="text-[10px] font-bold uppercase tracking-[.22em] text-emerald-300 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Choose your destination</div><h2 className="text-2xl sm:text-3xl font-bold text-mc-white mt-2">What are you looking for?</h2></div>
          <p className="text-xs sm:text-sm text-mc-muted max-w-sm leading-relaxed">Explore servers, tools, resources and creative tools for your Minecraft experience.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {portals.map((p, i) => <motion.div key={p.to} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ delay: i * .07, duration: .4 }}>
            <Link to={p.to} className={`group relative flex flex-col h-full min-h-[255px] overflow-hidden rounded-2xl border border-mc-border bg-gradient-to-br ${p.tint} to-mc-surface p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-300/40 hover:shadow-xl hover:shadow-black/20`}>
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/[.025] blur-2xl group-hover:bg-emerald-200/[.08] transition-colors" />
              <div className="relative flex items-center justify-between"><span className="text-[10px] font-bold tracking-[.2em] text-mc-muted">PORTAL / {p.number}</span><span className="w-11 h-11 rounded-xl bg-black/20 border border-white/10 grid place-items-center text-emerald-200 group-hover:scale-110 group-hover:rotate-3 transition-transform">{p.title === 'Server Hub' ? <img src="https://i.imgur.com/Fk0lHrF.gif" alt="Server Hub" loading="lazy" className="w-8 h-8 object-contain rounded-md" /> : <p.icon className="w-5 h-5" />}</span></div>
              <div className="relative mt-7 flex-1"><h3 className="text-xl font-bold text-mc-white">{p.title}</h3><p className="text-xs sm:text-sm text-mc-muted mt-2 leading-relaxed">{p.text}</p><div className="flex flex-wrap gap-1.5 mt-4">{p.tags.map((tag) => <span key={tag} className="text-[10px] px-2 py-1 rounded-md border border-white/10 bg-black/10 text-mc-muted">{tag}</span>)}</div></div>
              <div className="relative mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-mc-white"><span>Explore collection</span><span className="w-8 h-8 rounded-full border border-white/10 grid place-items-center text-emerald-200 group-hover:bg-emerald-300 group-hover:text-slate-950 group-hover:border-emerald-300 transition-all"><ArrowRight className="w-4 h-4" /></span></div>
            </Link>
          </motion.div>)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="mb-5">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-emerald-300">
            <Boxes className="h-3.5 w-3.5" /> CubeNest Library
          </div>
          <h2 className="mt-2 text-2xl font-bold text-mc-white sm:text-3xl">Explore by type</h2>
          <p className="mt-2 max-w-xl text-sm text-mc-muted">
            Choose a category to open its own page and browse community resources.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((c, i) => (
            <motion.div key={c.to} initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * .04 }}>
              <Link to={c.to} className={`group relative flex min-h-[155px] items-start gap-3 overflow-hidden rounded-2xl border border-mc-border bg-gradient-to-br ${c.tint} to-mc-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/40 hover:shadow-lg sm:p-5`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/20 text-emerald-200 transition-transform group-hover:scale-110">
                  <c.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-mc-white sm:text-base">{c.title}</span>
                  <span className="mt-2 block text-xs leading-relaxed text-mc-muted">{c.text}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                    Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="flex items-end justify-between gap-4 mb-5"><div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300 flex items-center gap-2"><Download className="w-3.5 h-3.5" /> From the catalogue</div><h2 className="text-2xl sm:text-3xl font-bold text-mc-white mt-2">Community picks</h2><p className="text-xs text-mc-muted mt-1">Resources currently indexed by CubeNest.</p></div><Link to="/mods" className="shrink-0 text-xs font-semibold text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1">Browse all <ArrowRight className="w-3.5 h-3.5" /></Link></div>
        {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}</div> : (featured.length || latest.length) ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{(featured.length ? featured : latest).map((r, i) => <ProjectCard key={r.id} resource={r} index={i} />)}</div> : <div className="rounded-2xl border border-mc-border bg-mc-surface/60 p-7 text-center"><Package className="w-8 h-8 text-mc-muted mx-auto mb-3"/><p className="text-sm text-mc-white font-semibold">The catalogue is getting ready</p><p className="text-xs text-mc-muted mt-1">Explore the source libraries while CubeNest syncs resources.</p><div className="mt-4 flex flex-wrap justify-center gap-2"><Link to="/mods" className="px-4 py-2 rounded-lg bg-emerald-400 text-slate-950 text-xs font-bold">Browse mods</Link><Link to="/bedrock" className="px-4 py-2 rounded-lg border border-mc-border text-xs">Bedrock library</Link></div></div>}
      </section>


    </div>
  );
}
