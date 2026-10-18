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
  { to: '/mods', icon: Boxes, title: 'Mods', text: 'Gameplay and content mods from Modrinth.' },
  { to: '/plugins', icon: Puzzle, title: 'Plugins', text: 'Paper, Spigot, and server plugins.' },
  { to: '/servers', icon: Server, title: 'Servers', text: 'Find community Minecraft servers.' },
  { to: '/resourcepacks', icon: Palette, title: 'Resource Packs', text: 'Textures and visual styles.' },
  { to: '/shaders', icon: Sun, title: 'Shaders', text: 'Lighting and cinematic looks.' },
  { to: '/modpacks', icon: Package, title: 'Modpacks', text: 'Ready-to-play mod collections.' },
  { to: '/datapacks', icon: Database, title: 'Data Packs', text: 'Vanilla-friendly gameplay packs.' },
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
    if (!term) {
      navigate('/mods');
      return;
    }
    navigate(`/mods?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="relative">
      {/* Hero with Earth */}
      <section className="relative min-h-[88vh] flex items-center pt-16 overflow-hidden">
        <SolarSystemBackground className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-mc-black via-mc-black/85 to-mc-black/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-mc-black via-transparent to-mc-black/50 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 w-full">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mc-surface/80 border border-mc-border text-xs text-mc-muted mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-mc-grass animate-pulse" />
              Minecraft content platform
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-mc-white leading-tight tracking-tight max-w-2xl">
              Discover Your Next{' '}
              <span className="text-mc-red">Minecraft</span> Adventure
            </h1>

            <p className="mt-5 text-lg text-mc-muted max-w-xl leading-relaxed">
              Explore mods, plugins, resource packs, shaders, modpacks, and Minecraft servers—all in one place.
            </p>

            <form onSubmit={onSearch} className="mt-8 max-w-xl">
              <div className="flex items-center gap-2 bg-mc-surface/90 border border-mc-border rounded-xl p-1.5 backdrop-blur-md focus-within:border-mc-red/60 transition-colors">
                <Search className="w-5 h-5 text-mc-muted ml-2 shrink-0" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search mods, plugins, servers, and more..."
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-mc-white placeholder:text-mc-muted py-2.5"
                />
                <button type="submit" className="px-4 py-2 rounded-lg bg-mc-red text-white text-sm font-medium hover:bg-mc-red-bright transition-colors shrink-0">
                  Search
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {categories.slice(0, 5).map((c) => (
                <Link key={c.to} to={c.to} className="px-3 py-1.5 rounded-full bg-mc-surface/70 border border-mc-border text-xs text-mc-muted hover:text-mc-white hover:border-mc-red/40 transition-colors backdrop-blur-sm">
                  {c.title}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-mc-red mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Discover
            </div>
            <h2 className="text-2xl font-bold text-mc-white">Browse by category</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((c, i) => (
            <motion.div key={c.to} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
              <Link to={c.to} className="block h-full bg-mc-surface border border-mc-border rounded-xl p-5 hover:border-mc-red/50 hover:-translate-y-0.5 transition-all group">
                <c.icon className="w-7 h-7 text-mc-red mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-mc-white">{c.title}</h3>
                <p className="text-sm text-mc-muted mt-1 leading-relaxed">{c.text}</p>
                <span className="inline-flex items-center gap-1 text-xs text-mc-red mt-3">Explore <ArrowRight className="w-3.5 h-3.5" /></span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured from local catalogue */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-mc-white">Featured projects</h2>
            <p className="text-sm text-mc-muted mt-1">From the CubeNest catalogue</p>
          </div>
          <Link to="/plugins" className="text-sm text-mc-red hover:text-mc-red-bright flex items-center gap-1">View plugins <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(featured.length ? featured : latest).map((r, i) => (
              <ProjectCard key={r.id} resource={r} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Community */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-mc-surface border border-mc-border rounded-2xl p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle at 90% 20%, rgba(192,57,43,0.25), transparent 50%)' }} />
          <div className="relative max-w-xl">
            <h2 className="text-2xl font-bold text-mc-white">Join the CubeNest community</h2>
            <p className="text-mc-muted mt-2 text-sm leading-relaxed">
              Discover content, share servers, and build better Minecraft experiences. Content downloads are provided by their original platforms.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/contact" className="px-5 py-2.5 rounded-lg bg-mc-red text-white text-sm font-medium hover:bg-mc-red-bright transition-colors">Contact</Link>
              <Link to="/about" className="px-5 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm hover:border-mc-red/40 transition-colors">About CubeNest</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
