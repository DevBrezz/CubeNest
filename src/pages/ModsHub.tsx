import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Boxes, Map, Palette, Sun, User, ArrowLeft, Search, Smartphone, Monitor,
} from 'lucide-react';

type Platform = 'java' | 'bedrock';

/** All categories resolve to in-site Modrinth catalog (search + download). */
function catPath(platform: Platform, kind: string, q?: string) {
  const base =
    kind === 'mods' ? '/mods/catalog' :
    kind === 'textures' ? '/resourcepacks' :
    kind === 'shaders' ? '/shaders' :
    kind === 'maps' ? '/mods/catalog' :
    kind === 'skins' ? '/resourcepacks' :
    '/mods/catalog';
  const params = new URLSearchParams();
  params.set('platform', platform);
  if (kind === 'maps') params.set('q', q || 'map world adventure');
  if (kind === 'skins') params.set('q', q || 'skin');
  if (platform === 'bedrock' && kind === 'mods') params.set('q', q || 'bedrock');
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

const CATEGORIES = [
  { id: 'mods', title: 'Mods', desc: 'Mods & add-ons via Modrinth — search and download', icon: Boxes },
  { id: 'maps', title: 'Maps', desc: 'Worlds & adventure content searchable on Modrinth', icon: Map },
  { id: 'textures', title: 'Textures', desc: 'Resource / texture packs from Modrinth', icon: Palette },
  { id: 'shaders', title: 'Shaders', desc: 'Shader packs from Modrinth', icon: Sun },
  { id: 'skins', title: 'Skins', desc: 'Skin-related packs searchable on Modrinth', icon: User },
] as const;

export function ModsHub() {
  const [params, setParams] = useSearchParams();
  const platform = (params.get('platform') as Platform | null) || null;
  const navigate = useNavigate();
  const [search, setSearch] = useState(params.get('q') || '');

  const setPlatform = (p: Platform | null) => {
    const next = new URLSearchParams();
    if (p) next.set('platform', p);
    setParams(next, { replace: true });
  };

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!platform) {
      navigate(q ? `/mods/catalog?q=${encodeURIComponent(q)}` : '/mods/catalog');
      return;
    }
    navigate(catPath(platform, 'mods', q || undefined));
  };

  return (
    <div className="pt-20 pb-12 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-mc-white">Mods & content</h1>
          <p className="text-mc-muted mt-1 text-sm">
            Java & Bedrock — browse Modrinth with live search and official download links.
          </p>
        </div>

        {!platform ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
            <motion.button type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setPlatform('java')}
              className="text-left bg-mc-surface border border-mc-border rounded-xl p-5 hover:border-mc-red/50 transition-all group">
              <Monitor className="w-9 h-9 text-mc-red mb-3 group-hover:scale-105 transition-transform" />
              <h2 className="text-lg font-bold text-mc-white">Java Edition</h2>
              <p className="text-sm text-mc-muted mt-1.5">Mods, maps, textures, shaders, skins — Modrinth search & download.</p>
            </motion.button>
            <motion.button type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
              onClick={() => setPlatform('bedrock')}
              className="text-left bg-mc-surface border border-mc-border rounded-xl p-5 hover:border-emerald-500/50 transition-all group">
              <Smartphone className="w-9 h-9 text-emerald-400 mb-3 group-hover:scale-105 transition-transform" />
              <h2 className="text-lg font-bold text-mc-white">Bedrock Edition</h2>
              <p className="text-sm text-mc-muted mt-1.5">Same categories via Modrinth — search, open detail, download files.</p>
            </motion.button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button type="button" onClick={() => setPlatform(null)} className="inline-flex items-center gap-1 text-sm text-mc-muted hover:text-mc-white">
                <ArrowLeft className="w-4 h-4" /> Platforms
              </button>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${platform === 'java' ? 'bg-mc-red/20 text-mc-red' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {platform === 'java' ? 'Java' : 'Bedrock'}
              </span>
            </div>

            <form onSubmit={onSearchSubmit} className="mb-5">
              <div className="flex items-center gap-2 bg-mc-surface border border-mc-border rounded-xl p-1.5 max-w-xl focus-within:border-mc-red/50">
                <Search className="w-4 h-4 text-mc-muted ml-2 shrink-0" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${platform} content on Modrinth...`}
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-mc-white py-2 placeholder:text-mc-muted" />
                <button type="submit" className="px-4 py-2 rounded-lg bg-mc-red text-white text-sm font-medium hover:bg-mc-red-bright">Search</button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATEGORIES.map((c, i) => {
                const Icon = c.icon;
                return (
                  <Link key={c.id} to={catPath(platform, c.id)}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="h-full bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-mc-red/45 transition-colors group">
                      <Icon className="w-6 h-6 text-mc-red mb-2 group-hover:scale-110 transition-transform" />
                      <h3 className="font-semibold text-mc-white text-sm">{c.title}</h3>
                      <p className="text-xs text-mc-muted mt-1">{c.desc}</p>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
            <p className="mt-5 text-xs text-mc-muted">
              Content and downloads come from the official Modrinth API. Compatibility with Bedrock varies by project — check each project page.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
