import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Boxes, Puzzle, Server, Palette, Sun, Package, Database, Search, Sparkles,
} from 'lucide-react';
import { useResources } from '../hooks/useResources';
import { ProjectCard } from '../components/ProjectCard';
import { SolarSystemBackground } from '../components/SolarSystemBackground';

const categories = [
  { to: '/mods', icon: Boxes, title: 'Mods', text: 'Java & Bedrock via Modrinth.' },
  { to: '/plugins', icon: Puzzle, title: 'Plugins', text: 'Spigot & Modrinth plugins.' },
  { to: '/servers', icon: Server, title: 'Servers', text: 'Minehut + popular networks.' },
  { to: '/resourcepacks', icon: Palette, title: 'Resource Packs', text: 'Textures from Modrinth.' },
  { to: '/shaders', icon: Sun, title: 'Shaders', text: 'Visual packs from Modrinth.' },
  { to: '/modpacks', icon: Package, title: 'Modpacks', text: 'Ready-to-play packs.' },
  { to: '/datapacks', icon: Database, title: 'Data Packs', text: 'Vanilla-friendly packs.' },
];

export function Home() {
  const navigate = useNavigate();
  const { resources, loading } = useResources();
  const [q, setQ] = useState('');
  const featured = resources.filter((r) => r.featured && !r.hidden).slice(0, 6);
  const latest = [...resources]
    .filter((r) => !r.hidden)
    .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
    .slice(0, 6);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/mods/catalog?q=${encodeURIComponent(term)}` : '/mods');
  };

  return (
    <div className="relative">
      <section className="relative min-h-[72vh] flex items-center pt-16 overflow-hidden">
        <SolarSystemBackground className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-mc-black via-mc-black/88 to-mc-black/35 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-mc-black via-transparent to-mc-black/40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 w-full">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-mc-surface/80 border border-mc-border text-[11px] text-mc-muted mb-4 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Minecraft content platform
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-mc-white leading-tight tracking-tight max-w-xl">
              Discover Your Next <span className="text-mc-red">Minecraft</span> Adventure
            </h1>
            <p className="mt-3 text-base text-mc-muted max-w-lg leading-relaxed">
              Mods, plugins, resource packs, shaders, and servers — search and download from trusted sources.
            </p>
            <form onSubmit={onSearch} className="mt-5 max-w-lg">
              <div className="flex items-center gap-2 bg-mc-surface/90 border border-mc-border rounded-xl p-1.5 backdrop-blur-md focus-within:border-mc-red/60">
                <Search className="w-4 h-4 text-mc-muted ml-2 shrink-0" />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Search mods, packs, and more..."
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-mc-white placeholder:text-mc-muted py-2" />
                <button type="submit" className="px-3.5 py-2 rounded-lg bg-mc-red text-white text-sm font-medium hover:bg-mc-red-bright shrink-0">Search</button>
              </div>
            </form>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {categories.slice(0, 5).map((c) => (
                <Link key={c.to} to={c.to} className="px-2.5 py-1 rounded-full bg-mc-surface/70 border border-mc-border text-[11px] text-mc-muted hover:text-mc-white hover:border-mc-red/40 transition-colors">
                  {c.title}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-mc-red mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Discover
            </div>
            <h2 className="text-xl font-bold text-mc-white">Browse by category</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {categories.map((c, i) => (
            <motion.div key={c.to} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}>
              <Link to={c.to} className="block h-full bg-mc-surface border border-mc-border rounded-xl p-3.5 hover:border-mc-red/50 transition-all group">
                <c.icon className="w-5 h-5 text-mc-red mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-mc-white text-sm">{c.title}</h3>
                <p className="text-[11px] text-mc-muted mt-0.5 leading-snug">{c.text}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-mc-white">Featured projects</h2>
            <p className="text-xs text-mc-muted mt-0.5">From the CubeNest catalogue</p>
          </div>
          <Link to="/plugins" className="text-xs text-mc-red hover:text-mc-red-bright flex items-center gap-1">Plugins <ArrowRight className="w-3 h-3" /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(featured.length ? featured : latest).map((r, i) => (
              <ProjectCard key={r.id} resource={r} index={i} />
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-mc-surface border border-mc-border rounded-xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle at 90% 20%, rgba(192,57,43,0.25), transparent 50%)' }} />
          <div className="relative max-w-lg">
            <h2 className="text-xl font-bold text-mc-white">Join the CubeNest community</h2>
            <p className="text-mc-muted mt-1.5 text-sm leading-relaxed">
              Discover content and servers. Downloads are provided by Modrinth, SpigotMC, and other official hosts.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/contact" className="px-4 py-2 rounded-lg bg-mc-red text-white text-sm font-medium hover:bg-mc-red-bright">Contact</Link>
              <Link to="/about" className="px-4 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm hover:border-mc-red/40">About</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
