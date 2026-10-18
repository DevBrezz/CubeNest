import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ExternalLink, Boxes, Map, Palette, Sun, User, AlertCircle, Download } from 'lucide-react';

/** MCPEDL has no public API — we deep-link search/categories. Downloads stay on MCPEDL. */
const CATEGORIES = [
  { id: 'addons', title: 'Mods / Add-ons', path: 'category/addons/', icon: Boxes, q: 'addon' },
  { id: 'maps', title: 'Maps', path: 'category/maps/', icon: Map, q: 'map' },
  { id: 'textures', title: 'Texture packs', path: 'category/texture-packs/', icon: Palette, q: 'texture' },
  { id: 'shaders', title: 'Shaders', path: 'category/shaders/', icon: Sun, q: 'shader' },
  { id: 'skins', title: 'Skin packs', path: 'category/skins/', icon: User, q: 'skin' },
];

export function BedrockHub() {
  const [q, setQ] = useState('');

  const searchUrl = (query: string) =>
    `https://mcpedl.com/?s=${encodeURIComponent(query)}`;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    window.open(searchUrl(term), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="pt-20 pb-12 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-mc-white">Bedrock content</h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-400">Bedrock</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-mc-gray text-mc-muted border border-mc-border">MCPEDL</span>
        </div>
        <p className="text-sm text-mc-muted max-w-2xl mb-5">
          Browse and download Bedrock add-ons, maps, textures, shaders, and skins on{' '}
          <a href="https://mcpedl.com/" className="text-emerald-400 hover:underline" target="_blank" rel="noreferrer">MCPEDL</a>.
          MCPEDL does not offer a public API, so search opens their site where you can download files directly.
        </p>

        <form onSubmit={onSearch} className="mb-6 max-w-xl">
          <div className="flex items-center gap-2 bg-mc-surface border border-mc-border rounded-xl p-1.5 focus-within:border-emerald-500/50">
            <Search className="w-4 h-4 text-mc-muted ml-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search MCPEDL..."
              className="flex-1 bg-transparent border-0 outline-none text-sm text-mc-white py-2 placeholder:text-mc-muted" />
            <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 inline-flex items-center gap-1">
              Search <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map((c, i) => {
            const Icon = c.icon;
            const href = `https://mcpedl.com/${c.path}`;
            return (
              <motion.a key={c.id} href={href} target="_blank" rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-emerald-500/45 transition-colors group block">
                <Icon className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <h2 className="font-semibold text-mc-white text-sm flex items-center gap-1">{c.title} <ExternalLink className="w-3 h-3 text-mc-muted" /></h2>
                <p className="text-xs text-mc-muted mt-1">Open category on MCPEDL — download there</p>
                <span className="inline-flex items-center gap-1 mt-3 text-[11px] text-emerald-400"><Download className="w-3 h-3" /> Download on MCPEDL</span>
              </motion.a>
            );
          })}
        </div>

        <div className="mt-6">
          <Link to="/bedrock/catalog" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500">
            Browse CurseForge catalog in CubeNest
          </Link>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-mc-muted bg-mc-surface border border-mc-border rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            CubeNest cannot legally re-host or proxy MCPEDL files (no public API + Cloudflare protection).
            Use Search / category cards to open MCPEDL, then download with their official buttons.
            Player skins (PNG) are available in-site under <Link to="/skins" className="text-mc-red hover:underline">Skins</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
