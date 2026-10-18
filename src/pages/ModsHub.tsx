import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Boxes, Map, Palette, Sun, User, ArrowLeft, Search, Smartphone, Monitor } from 'lucide-react';

type Platform = 'java' | 'bedrock';

const JAVA_CATS = [
  { id: 'mods', title: 'Mods', desc: 'Modrinth — search & download', to: '/mods/catalog?platform=java', icon: Boxes },
  { id: 'maps', title: 'Maps', desc: 'Search map-related projects on Modrinth', to: '/mods/catalog?platform=java&q=map%20world', icon: Map },
  { id: 'textures', title: 'Textures', desc: 'Resource packs on Modrinth', to: '/resourcepacks?platform=java', icon: Palette },
  { id: 'shaders', title: 'Shaders', desc: 'Shaders on Modrinth', to: '/shaders?platform=java', icon: Sun },
  { id: 'skins', title: 'Skins', desc: 'Download PNG + NameMC / Laby / Nova', to: '/skins', icon: User },
];

const BEDROCK_CATS = [
  { id: 'all', title: 'MCPEDL hub', desc: 'All Bedrock categories & search', to: '/bedrock', icon: Boxes },
  { id: 'addons', title: 'Mods / Add-ons', desc: 'MCPEDL add-ons — download there', to: '/bedrock', icon: Boxes },
  { id: 'maps', title: 'Maps', desc: 'MCPEDL maps', to: '/bedrock', icon: Map },
  { id: 'textures', title: 'Textures', desc: 'MCPEDL texture packs', to: '/bedrock', icon: Palette },
  { id: 'shaders', title: 'Shaders', desc: 'MCPEDL shaders', to: '/bedrock', icon: Sun },
  { id: 'skins', title: 'Skins', desc: 'MCPEDL packs + PNG lookup', to: '/skins', icon: User },
];

export function ModsHub() {
  const [params, setParams] = useSearchParams();
  const platform = (params.get('platform') as Platform | null) || null;
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const setPlatform = (p: Platform | null) => {
    const next = new URLSearchParams();
    if (p) next.set('platform', p);
    setParams(next, { replace: true });
  };

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (platform === 'bedrock') {
      window.open(q ? `https://mcpedl.com/?s=${encodeURIComponent(q)}` : 'https://mcpedl.com/', '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(q ? `/mods/catalog?platform=java&q=${encodeURIComponent(q)}` : '/mods/catalog?platform=java');
  };

  const cats = platform === 'bedrock' ? BEDROCK_CATS : JAVA_CATS;

  return (
    <div className="pt-20 pb-12 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-mc-white">Mods & content</h1>
          <p className="text-mc-muted mt-1 text-sm">Java via Modrinth · Bedrock via MCPEDL · Skins via Mojang + galleries</p>
        </div>

        {!platform ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
            <motion.button type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => setPlatform('java')}
              className="text-left bg-mc-surface border border-mc-border rounded-xl p-5 hover:border-mc-red/50 transition-all group">
              <Monitor className="w-9 h-9 text-mc-red mb-3" />
              <h2 className="text-lg font-bold text-mc-white">Java Edition</h2>
              <p className="text-sm text-mc-muted mt-1.5">Mods, maps, textures, shaders on Modrinth. Skins downloadable as PNG.</p>
              <span className="inline-block mt-3 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-mc-red/20 text-mc-red">Java</span>
            </motion.button>
            <motion.button type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} onClick={() => setPlatform('bedrock')}
              className="text-left bg-mc-surface border border-mc-border rounded-xl p-5 hover:border-emerald-500/50 transition-all group">
              <Smartphone className="w-9 h-9 text-emerald-400 mb-3" />
              <h2 className="text-lg font-bold text-mc-white">Bedrock Edition</h2>
              <p className="text-sm text-mc-muted mt-1.5">Add-ons, maps, textures, shaders, skins via MCPEDL (official downloads there).</p>
              <span className="inline-block mt-3 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-400">Bedrock</span>
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
              <div className="flex items-center gap-2 bg-mc-surface border border-mc-border rounded-xl p-1.5 max-w-xl">
                <Search className="w-4 h-4 text-mc-muted ml-2" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder={platform === 'bedrock' ? 'Search on MCPEDL...' : 'Search Modrinth...'}
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-mc-white py-2 placeholder:text-mc-muted" />
                <button type="submit" className="px-4 py-2 rounded-lg bg-mc-red text-white text-sm font-medium">Search</button>
              </div>
            </form>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cats.map((c, i) => {
                const Icon = c.icon;
                return (
                  <Link key={c.id} to={c.to}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="h-full bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-mc-red/45 transition-colors">
                      <Icon className="w-6 h-6 text-mc-red mb-2" />
                      <h3 className="font-semibold text-mc-white text-sm">{c.title}</h3>
                      <p className="text-xs text-mc-muted mt-1">{c.desc}</p>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
