import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ExternalLink, Boxes, Map, Palette, Sun, User, AlertCircle, Download } from 'lucide-react';

/** Bedrock category shortcuts into the local CubeNest catalog. */
const CATEGORIES = [
  { id: 'addons', title: 'Mods / Add-ons', category: 'addons', icon: Boxes, q: 'addon' },
  { id: 'maps', title: 'Maps', category: 'maps', icon: Map, q: 'map' },
  { id: 'textures', title: 'Texture packs', category: 'textures', icon: Palette, q: 'texture' },
  { id: 'shaders', title: 'Shaders', category: 'shaders', icon: Sun, q: 'shader' },
  { id: 'skins', title: 'Skin packs', category: 'skins', icon: User, q: 'skin' },
];

export function BedrockHub() {
  const [q, setQ] = useState('');

  const searchUrl = (query: string) =>
    `/bedrock/catalog?q=${encodeURIComponent(query)}`;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    window.location.assign(searchUrl(term));
  };

  return (
    <div className="pt-20 pb-12 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-mc-white">Bedrock content</h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-400">Bedrock</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-mc-gray text-mc-muted border border-mc-border">CurseForge</span>
        </div>
        <p className="text-sm text-mc-muted max-w-2xl mb-5">
          Browse Bedrock add-ons, maps, texture packs, shaders and skins in CubeNest. Each category opens its own filtered catalog, with direct downloads when the publisher provides a file URL.
        </p>

        <form onSubmit={onSearch} className="mb-6 max-w-xl">
          <div className="flex items-center gap-2 bg-mc-surface border border-mc-border rounded-xl p-1.5 focus-within:border-emerald-500/50">
            <Search className="w-4 h-4 text-mc-muted ml-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Bedrock resources..."
              className="flex-1 bg-transparent border-0 outline-none text-sm text-mc-white py-2 placeholder:text-mc-muted" />
            <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 inline-flex items-center gap-1">
              Search <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map((c, i) => {
            const Icon = c.icon;
            const href = `/bedrock/catalog?category=${c.category}`;
            return (
              <motion.a key={c.id} href={href}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-emerald-500/45 transition-colors group block">
                <Icon className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <h2 className="font-semibold text-mc-white text-sm flex items-center gap-1">{c.title} <ExternalLink className="w-3 h-3 text-mc-muted" /></h2>
                <p className="text-xs text-mc-muted mt-1">Browse matching resources in CubeNest</p>
                <span className="inline-flex items-center gap-1 mt-3 text-[11px] text-emerald-400"><Download className="w-3 h-3" /> Browse downloads</span>
              </motion.a>
            );
          })}
        </div>

        <div className="mt-6">
          <Link to="/bedrock/catalog" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500">
            Browse all Bedrock downloads in CubeNest
          </Link>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-mc-muted bg-mc-surface border border-mc-border rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            Direct download depends on whether CurseForge exposes a valid file URL for that resource. If it does not, CubeNest uses the official project page instead. Third-party files are not copied onto CubeNest servers. Player skins (PNG) are available under <Link to="/skins" className="text-mc-red hover:underline">Skins</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
