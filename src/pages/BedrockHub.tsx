import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ExternalLink, Boxes, Map, Palette, Sun, UserRound, Download, ArrowUpRight, ShieldCheck, Gamepad2 } from 'lucide-react';

const CATEGORIES = [
  { id: 'addons', title: 'Add-ons', desc: 'New mobs, items and gameplay mechanics.', icon: Boxes, href: '/bedrock/catalog?q=addon' },
  { id: 'maps', title: 'Worlds & Maps', desc: 'Adventure maps, parkour and survival worlds.', icon: Map, href: '/bedrock/catalog?q=map' },
  { id: 'textures', title: 'Texture Packs', desc: 'Change the look of blocks and items.', icon: Palette, href: '/bedrock/catalog?q=texture' },
  { id: 'shaders', title: 'Visuals', desc: 'Visual enhancements and atmosphere packs.', icon: Sun, href: '/bedrock/catalog?q=shader' },
  { id: 'skins', title: 'Skins', desc: 'Find a new look for your character.', icon: UserRound, href: '/skins' },
];

export function BedrockHub() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const onSearch = (e: FormEvent) => { e.preventDefault(); navigate(`/bedrock/catalog${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); };

  return (
    <div className="pt-20 pb-16 min-h-screen mc-grid-bg overflow-hidden">
      <section className="relative border-b border-mc-border/70 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/5" />
        <div className="absolute -right-24 -top-20 w-80 h-80 rounded-full bg-emerald-400/[.07] blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold tracking-[.18em] text-emerald-200 uppercase"><Gamepad2 className="w-3.5 h-3.5"/> Bedrock edition library</div>
            <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.04] text-mc-white">Make Bedrock<br/><span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">feel brand new.</span></h1>
            <p className="mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-mc-muted">Browse add-ons, worlds, textures and more for Minecraft Bedrock. CubeNest indexes public project information and links you to available official downloads.</p>
            <form onSubmit={onSearch} className="mt-7 max-w-2xl"><div className="flex items-center gap-2 rounded-2xl border border-mc-border bg-mc-surface/90 p-2 shadow-xl shadow-black/20 focus-within:border-emerald-300/50 transition-colors"><Search className="w-5 h-5 ml-2 text-mc-muted shrink-0"/><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Bedrock add-ons, maps, textures..." className="min-w-0 flex-1 bg-transparent py-3 text-sm text-mc-white outline-none placeholder:text-mc-muted"/><button type="submit" className="rounded-xl bg-emerald-400 px-4 sm:px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-300">Search</button></div></form>
            <div className="mt-5 flex flex-wrap gap-2">{['Add-ons', 'Maps', 'Textures', 'Shaders'].map((term) => <button key={term} type="button" onClick={() => navigate(`/bedrock/catalog?q=${encodeURIComponent(term.toLowerCase())}`)} className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5 text-xs text-mc-muted hover:text-white hover:border-emerald-300/40 transition-colors">{term}</button>)}</div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5"><div><p className="text-[10px] uppercase tracking-[.2em] font-bold text-emerald-300">Explore by type</p><h2 className="text-2xl font-bold text-mc-white mt-2">Find your next download</h2></div><p className="max-w-sm text-xs text-mc-muted leading-relaxed">Downloads are provided by each source. File availability and format depend on the project publisher.</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map((c, i) => <motion.div key={c.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .05 }}><Link to={c.href} className="group flex items-start gap-4 h-full rounded-2xl border border-mc-border bg-mc-surface/80 p-5 transition-all hover:-translate-y-1 hover:border-emerald-300/40 hover:shadow-lg hover:shadow-black/20"><span className="w-12 h-12 shrink-0 rounded-xl border border-emerald-300/10 bg-emerald-300/10 text-emerald-200 grid place-items-center group-hover:scale-105 transition-transform"><c.icon className="w-5 h-5"/></span><span className="flex-1"><span className="flex items-center gap-2 font-bold text-mc-white">{c.title}<ArrowUpRight className="w-3.5 h-3.5 text-mc-muted group-hover:text-emerald-300"/></span><span className="block text-xs leading-relaxed text-mc-muted mt-2">{c.desc}</span><span className="inline-flex items-center gap-1 mt-4 text-[11px] font-semibold text-emerald-300">Browse collection <Download className="w-3 h-3"/></span></span></Link></motion.div>)}
          <motion.a href="https://www.curseforge.com/minecraft-bedrock" target="_blank" rel="noopener noreferrer" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: .25 }} className="group flex items-start gap-4 h-full rounded-2xl border border-mc-border bg-gradient-to-br from-orange-500/10 to-mc-surface p-5 transition-all hover:-translate-y-1 hover:border-orange-300/40"><span className="w-12 h-12 shrink-0 rounded-xl bg-orange-400/10 text-orange-200 grid place-items-center"><ExternalLink className="w-5 h-5"/></span><span><span className="font-bold text-mc-white">More on CurseForge</span><span className="block text-xs leading-relaxed text-mc-muted mt-2">Open the official Bedrock project library to explore more content.</span><span className="inline-flex items-center gap-1 mt-4 text-[11px] font-semibold text-orange-200">Open source <ArrowUpRight className="w-3 h-3"/></span></span></motion.a>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-4"><div className="flex items-start gap-3 rounded-xl border border-mc-border bg-mc-surface/60 p-4 text-xs text-mc-muted leading-relaxed"><ShieldCheck className="w-4 h-4 shrink-0 text-emerald-300 mt-0.5"/><p><strong className="text-mc-white">Safer source links.</strong> CubeNest does not claim to host files that it has not stored itself. When a project provides a direct file URL, the catalogue can offer a direct download; otherwise, use the publisher’s official project page.</p></div></section>
    </div>
  );
}
