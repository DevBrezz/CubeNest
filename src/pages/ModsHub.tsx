import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Boxes, Map, Palette, Sun, User, ArrowLeft, ExternalLink, Search, Smartphone, Monitor,
} from 'lucide-react';

type Platform = 'java' | 'bedrock';
type Category = 'mods' | 'maps' | 'textures' | 'shaders' | 'skins';

const JAVA_CATEGORIES: { id: Category; title: string; desc: string; icon: typeof Boxes; to?: string; external?: string }[] = [
  { id: 'mods', title: 'Mods', desc: 'Fabric, Forge, NeoForge & Quilt mods', icon: Boxes, to: '/mods/catalog' },
  { id: 'maps', title: 'Maps', desc: 'Adventure & world downloads', icon: Map, external: 'https://www.planetminecraft.com/resources/projects/land-structure/?order=order_latest' },
  { id: 'textures', title: 'Textures', desc: 'Resource packs from Modrinth', icon: Palette, to: '/resourcepacks' },
  { id: 'shaders', title: 'Shaders', desc: 'Visual & lighting packs', icon: Sun, to: '/shaders' },
  { id: 'skins', title: 'Skins', desc: 'Player skins (Nova Skin / NameMC)', icon: User, external: 'https://minecraft.novaskin.me/' },
];

const BEDROCK_CATEGORIES: { id: Category; title: string; desc: string; icon: typeof Boxes; external: string }[] = [
  { id: 'mods', title: 'Mods / Add-ons', desc: 'Bedrock add-ons on MCPEDL', icon: Boxes, external: 'https://mcpedl.com/category/addons/' },
  { id: 'maps', title: 'Maps', desc: 'Worlds & maps on MCPEDL', icon: Map, external: 'https://mcpedl.com/category/maps/' },
  { id: 'textures', title: 'Texture packs', desc: 'Bedrock textures on MCPEDL', icon: Palette, external: 'https://mcpedl.com/category/texture-packs/' },
  { id: 'shaders', title: 'Shaders', desc: 'Bedrock shaders on MCPEDL', icon: Sun, external: 'https://mcpedl.com/category/shaders/' },
  { id: 'skins', title: 'Skins', desc: 'Bedrock skin packs on MCPEDL', icon: User, external: 'https://mcpedl.com/category/skins/' },
];

export function ModsHub() {
  const [params, setParams] = useSearchParams();
  const platform = (params.get('platform') as Platform | null) || null;
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const categories = useMemo(() => {
    if (platform === 'java') return JAVA_CATEGORIES;
    if (platform === 'bedrock') return BEDROCK_CATEGORIES;
    return [];
  }, [platform]);

  const setPlatform = (p: Platform | null) => {
    const next = new URLSearchParams();
    if (p) next.set('platform', p);
    setParams(next, { replace: true });
  };

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    if (platform === 'bedrock') {
      window.open(`https://mcpedl.com/?s=${encodeURIComponent(q)}`, '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/mods/catalog?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-mc-white">Mods & content</h1>
          <p className="text-mc-muted mt-1 text-sm">
            Choose a platform, then browse by category. Java content uses Modrinth where available; Bedrock content is sourced from MCPEDL.
          </p>
        </div>

        {!platform ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setPlatform('java')}
              className="text-left bg-mc-surface border border-mc-border rounded-2xl p-6 hover:border-mc-red/50 transition-all group"
            >
              <Monitor className="w-10 h-10 text-mc-red mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold text-mc-white">Java Edition</h2>
              <p className="text-sm text-mc-muted mt-2 leading-relaxed">
                Mods, textures, shaders via Modrinth. Skins via Nova Skin. Maps via community directories.
              </p>
            </motion.button>
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              onClick={() => setPlatform('bedrock')}
              className="text-left bg-mc-surface border border-mc-border rounded-2xl p-6 hover:border-emerald-500/50 transition-all group"
            >
              <Smartphone className="w-10 h-10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold text-mc-white">Bedrock Edition</h2>
              <p className="text-sm text-mc-muted mt-2 leading-relaxed">
                Add-ons, maps, textures, shaders, and skins from MCPEDL (mcpedl.com).
              </p>
            </motion.button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button type="button" onClick={() => setPlatform(null)} className="inline-flex items-center gap-1.5 text-sm text-mc-muted hover:text-mc-white">
                <ArrowLeft className="w-4 h-4" /> Platforms
              </button>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${platform === 'java' ? 'bg-mc-red/20 text-mc-red' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {platform === 'java' ? 'Java' : 'Bedrock'}
              </span>
            </div>

            <form onSubmit={onSearchSubmit} className="mb-8">
              <div className="flex items-center gap-2 bg-mc-surface border border-mc-border rounded-xl p-1.5 max-w-xl focus-within:border-mc-red/50">
                <Search className="w-4 h-4 text-mc-muted ml-2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={platform === 'bedrock' ? 'Search on MCPEDL...' : 'Search Java mods on Modrinth...'}
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-mc-white py-2 placeholder:text-mc-muted"
                />
                <button type="submit" className="px-4 py-2 rounded-lg bg-mc-red text-white text-sm font-medium hover:bg-mc-red-bright">Search</button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c, i) => {
                const Icon = c.icon;
                const inner = (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="h-full bg-mc-surface border border-mc-border rounded-xl p-5 hover:border-mc-red/45 transition-colors group"
                  >
                    <Icon className="w-7 h-7 text-mc-red mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-mc-white flex items-center gap-2">
                      {c.title}
                      {'external' in c && c.external ? <ExternalLink className="w-3.5 h-3.5 text-mc-muted" /> : null}
                    </h3>
                    <p className="text-sm text-mc-muted mt-1">{c.desc}</p>
                  </motion.div>
                );
                if ('to' in c && c.to) {
                  return <Link key={c.id} to={c.to}>{inner}</Link>;
                }
                return (
                  <a key={c.id} href={'external' in c ? c.external : '#'} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                );
              })}
            </div>

            {platform === 'bedrock' && (
              <p className="mt-8 text-xs text-mc-muted">
                Bedrock listings open on <a className="text-mc-red hover:underline" href="https://mcpedl.com" target="_blank" rel="noreferrer">MCPEDL</a>.
                MCPEDL does not provide a public API — CubeNest links to official category pages. Downloads stay on MCPEDL.
              </p>
            )}
            {platform === 'java' && (
              <p className="mt-8 text-xs text-mc-muted">
                Java mods/textures/shaders load from the official Modrinth API. Skins open on{' '}
                <a className="text-mc-red hover:underline" href="https://minecraft.novaskin.me/" target="_blank" rel="noreferrer">Nova Skin</a>.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
