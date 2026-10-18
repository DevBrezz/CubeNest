import { FormEvent, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, ExternalLink, User, Palette, Box, Sparkles } from 'lucide-react';

type SkinResult = {
  username: string;
  uuid: string;
  skinUrl: string;
  model: 'classic' | 'slim';
};

async function mojangUuid(name: string): Promise<string | null> {
  const r = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`);
  if (!r.ok) return null;
  const j = await r.json();
  return j.id as string;
}

async function loadSkin(username: string): Promise<SkinResult | null> {
  const id = await mojangUuid(username.trim());
  if (!id) return null;
  const dashed = `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
  try {
    const session = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${id}`);
    if (session.ok) {
      const profile = await session.json();
      const b64 = profile.properties?.find((p: { name: string }) => p.name === 'textures')?.value;
      if (b64) {
        const textures = JSON.parse(atob(b64));
        const skinUrl = textures.textures?.SKIN?.url || `https://mc-heads.net/skin/${id}`;
        const slim = textures.textures?.SKIN?.metadata?.model === 'slim';
        return { username, uuid: dashed, skinUrl, model: slim ? 'slim' : 'classic' };
      }
    }
  } catch {
    /* fallback below */
  }
  return { username, uuid: dashed, skinUrl: `https://mc-heads.net/skin/${id}`, model: 'classic' };
}

const GALLERIES = [
  { name: 'NameMC', url: 'https://id.namemc.com/minecraft-skins', desc: 'Browse popular skins' },
  { name: 'Laby', url: 'https://laby.net/skins', desc: 'Trending skins' },
  { name: 'Nova Skin', url: 'https://minecraft.novaskin.me/tag/minecraft', desc: 'Gallery + editor' },
];

export function Skins() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SkinResult | null>(null);
  const [pose, setPose] = useState<'full' | 'bust' | 'head'>('full');

  const renders = useMemo(() => {
    if (!result) return null;
    const id = result.uuid.replace(/-/g, '');
    return {
      head: `https://mc-heads.net/avatar/${id}/128`,
      body: `https://mc-heads.net/body/${id}/180`,
      /** Crafty 3D-style isometric renders (public CDN) */
      crafty3d: `https://render.crafty.gg/3d/${pose === 'head' ? 'head' : pose === 'bust' ? 'bust' : 'full'}/${encodeURIComponent(result.username)}?width=300&height=360`,
      skinPng: result.skinUrl,
    };
  }, [result, pose]);

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    const name = q.trim();
    if (!name) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const skin = await loadSkin(name);
      if (!skin) setError('Player not found. Check the Java username.');
      else setResult(skin);
    } catch {
      setError('Could not load skin. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPng = async () => {
    if (!result || !renders) return;
    try {
      const res = await fetch(renders.skinPng);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.username}-skin.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(renders.skinPng, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="pt-20 pb-28 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-mc-white flex items-center gap-2">
            <Palette className="w-6 h-6 text-mc-red" /> Skins
          </h1>
          <p className="text-sm text-mc-muted mt-1 max-w-2xl">
            Search a Java username, preview in 2D & 3D-style render, download the PNG, or create a new skin on Nova Skin.
          </p>
        </div>

        <form onSubmit={onSearch} className="max-w-xl">
          <div className="flex items-center gap-2 bg-mc-surface border border-mc-border rounded-xl p-1.5 focus-within:border-mc-red/50">
            <Search className="w-4 h-4 text-mc-muted ml-2 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search username..."
              className="flex-1 bg-transparent border-0 outline-none text-sm text-mc-white py-2.5 placeholder:text-mc-muted"
            />
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-mc-red text-white text-sm font-medium disabled:opacity-50">
              {loading ? '…' : 'Search'}
            </button>
          </div>
        </form>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        {result && renders && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 3D-style preview */}
            <div className="bg-mc-surface border border-mc-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-mc-white flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-emerald-400" /> 3D preview
                </h2>
                <div className="flex gap-1">
                  {(['full', 'bust', 'head'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPose(p)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase border ${
                        pose === p ? 'bg-mc-red border-mc-red text-white' : 'bg-mc-gray border-mc-border text-mc-muted'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-center items-center min-h-[280px] bg-gradient-to-b from-mc-gray/80 to-mc-black rounded-lg">
                <img
                  src={renders.crafty3d}
                  alt={`${result.username} 3D`}
                  className="max-h-[320px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = renders.body;
                  }}
                />
              </div>
              <p className="text-[10px] text-mc-muted mt-2 text-center">Render via public skin CDN · model {result.model}</p>
            </div>

            {/* Info + 2D + actions */}
            <div className="bg-mc-surface border border-mc-border rounded-xl p-4 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <img src={renders.head} alt="" className="w-14 h-14 rounded-lg" style={{ imageRendering: 'pixelated' }} />
                <div>
                  <h2 className="font-semibold text-mc-white text-lg flex items-center gap-2">
                    <User className="w-4 h-4" /> {result.username}
                  </h2>
                  <p className="text-[11px] text-mc-muted font-mono break-all">{result.uuid}</p>
                </div>
              </div>

              <div className="flex gap-4 items-end mb-4">
                <img src={renders.body} alt="" className="h-36" style={{ imageRendering: 'pixelated' }} />
                <img src={renders.skinPng} alt="Skin texture" className="h-32 w-32 object-contain bg-mc-gray rounded border border-mc-border" style={{ imageRendering: 'pixelated' }} />
              </div>

              <div className="mt-auto flex flex-wrap gap-2">
                <button type="button" onClick={() => void downloadPng()} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-mc-red text-white text-sm font-medium">
                  <Download className="w-4 h-4" /> Download PNG
                </button>
                <a href={`https://namemc.com/profile/${result.username}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm">
                  NameMC <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a href={`https://laby.net/@${result.username}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm">
                  Laby <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Create + galleries */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-mc-white flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-mc-red" /> Create & browse
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <a
              href="https://minecraft.novaskin.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-mc-red/45 transition-colors sm:col-span-2"
            >
              <h3 className="font-semibold text-mc-white text-sm">Create your own skin</h3>
              <p className="text-xs text-mc-muted mt-1">Open Nova Skin editor — paint, import, export PNG, then use it in Java or convert for Bedrock.</p>
              <span className="inline-flex items-center gap-1 mt-3 text-xs text-mc-red">Open editor <ExternalLink className="w-3 h-3" /></span>
            </a>
            {GALLERIES.map((g) => (
              <a key={g.name} href={g.url} target="_blank" rel="noopener noreferrer" className="bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-mc-red/40">
                <h3 className="font-semibold text-mc-white text-sm flex items-center gap-1">{g.name} <ExternalLink className="w-3 h-3 text-mc-muted" /></h3>
                <p className="text-xs text-mc-muted mt-1">{g.desc}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
