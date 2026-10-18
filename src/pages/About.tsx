import { motion } from 'framer-motion';
import { Boxes, Puzzle, Server, Search, Download, Shield, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function About() {
  const pillars = [
    { icon: Search, title: 'Discover', desc: 'Browse mods, plugins, resource packs, shaders, and more with clear Java and Bedrock context.' },
    { icon: Download, title: 'Download from the source', desc: 'Files come from official platforms such as Modrinth and SpigotMC — CubeNest links you there.' },
    { icon: Server, title: 'Find servers', desc: 'Explore public and community server lists with copy-IP and basic status when available.' },
    { icon: Shield, title: 'Transparent', desc: 'We label sources, platforms, and limitations clearly. No fake stats or pretend affiliation with Mojang.' },
  ];

  const catalog = [
    { icon: Boxes, title: 'Mods & packs', text: 'Modrinth-powered catalogs for mods, textures, shaders, modpacks, and datapacks.' },
    { icon: Puzzle, title: 'Plugins', text: 'Global plugin catalogue combining SpigotMC and Modrinth listings.' },
    { icon: Users, title: 'Community', text: 'Built for players, creators, and server teams who need a clean place to explore content.' },
  ];

  return (
    <div className="pt-20 pb-14 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> About CubeNest
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-mc-white leading-tight max-w-2xl">
            A place to discover Minecraft content — clearly labeled for <span className="text-mc-red">Java</span> & <span className="text-emerald-400">Bedrock</span>.
          </h1>
          <p className="mt-3 text-mc-muted max-w-2xl text-sm sm:text-base leading-relaxed">
            CubeNest is a Minecraft content discovery platform. Search mods and packs, browse plugins, and find servers.
            Downloads are hosted by their original platforms. CubeNest is not affiliated with Mojang, Microsoft, Modrinth, or SpigotMC.
          </p>
        </motion.section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {pillars.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
              className="bg-mc-surface border border-mc-border rounded-xl p-4">
              <p.icon className="w-5 h-5 text-mc-red mb-2" />
              <h2 className="font-semibold text-mc-white text-sm">{p.title}</h2>
              <p className="text-xs text-mc-muted mt-1 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-mc-white mb-3">What you can explore</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {catalog.map((c) => (
              <div key={c.title} className="bg-mc-surface border border-mc-border rounded-xl p-4">
                <c.icon className="w-5 h-5 text-emerald-400 mb-2" />
                <h3 className="font-semibold text-mc-white text-sm">{c.title}</h3>
                <p className="text-xs text-mc-muted mt-1">{c.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-mc-surface border border-mc-border rounded-xl p-5 sm:p-6">
          <h2 className="text-lg font-bold text-mc-white mb-2">Platform badges</h2>
          <p className="text-sm text-mc-muted mb-3">Look for these labels so you know which edition content is aimed at:</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-mc-red/20 text-mc-red">Java</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-emerald-500/20 text-emerald-400">Bedrock</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-green-600/20 text-green-400">Modrinth</span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-orange-500/20 text-orange-300">SpigotMC</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/mods" className="px-4 py-2 rounded-lg bg-mc-red text-white text-sm font-medium hover:bg-mc-red-bright">Browse mods</Link>
            <Link to="/plugins" className="px-4 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm">Plugins</Link>
            <Link to="/contact" className="px-4 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm">Contact team</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
