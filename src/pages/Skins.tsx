import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, ExternalLink, User, Palette } from 'lucide-react';

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
  const session = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${id}`);
  if (!session.ok) {
    // Fallback: Crafatar / Minotar style texture
    return {
      username,
      uuid: dashed,
      skinUrl: `https://mc-heads.net/skin/${id}`,
      model: 'classic',
    };
  }
  const profile = await session.json();
  const b64 = profile.properties?.find((p: { name: string }) => p.name === 'textures')?.value;
  if (!b64) {
    return { username, uuid: dashed, skinUrl: `https://mc-heads.net/skin/${id}`, model: 'classic' };
  }
  const textures = JSON.parse(atob(b64));
  const skinUrl = textures.textures?.SKIN?.url || `https://mc-heads.net/skin/${id}`;
  const slim = Boolean(textures.textures?.SKIN?.metadata?.model === 'slim');
  return { username, uuid: dashed, skinUrl, model: slim ? 'slim' : 'classic' };
}

const GALLERIES = [
  { name: 'NameMC', url: 'https://id.namemc.com/minecraft-skins', desc: 'Browse & copy popular skins' },
  { name: 'Laby', url: 'https://laby.net/skins', desc: 'Trending skins & profiles' },
  { name: 'Nova Skin', url: 'https://minecraft.novaskin.me/tag/minecraft', desc: 'Gallery + online editor to create your own' },
];

export function Skins() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SkinResult | null>(null);

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    const name = q.trim();
    if (!name) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const skin = await loadSkin(name);
      if (!skin) setError('Player not found on Mojang.');
      else setResult(skin);
    } catch {
      setError('Could not load skin. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPng = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.skinUrl;
    a.download = `${result.username}-skin.png`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
  };

  return (
    <div className="pt-20 pb-12 min-h-screen mc-grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-bold text-mc-white">Minecraft skins</h1>
        <p className="text-sm text-mc-muted mt-1 max-w-2xl">
          Look up any Java player skin and download the PNG. Browse galleries on NameMC, Laby, and Nova Skin — or create your own in Nova Skin’s editor.
        </p>

        <form onSubmit={onSearch} className="mt-5 max-w-xl">
          <div className="flex items-center gap-2 bg-mc-surface border border-mc-border rounded-xl p-1.5 focus-within:border-mc-red/50">
            <Search className="w-4 h-4 text-mc-muted ml-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Minecraft username..."
              className="flex-1 bg-transparent border-0 outline-none text-sm text-mc-white py-2 placeholder:text-mc-muted" />
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-mc-red text-white text-sm font-medium hover:bg-mc-red-bright disabled:opacity-50">
              {loading ? 'Loading…' : 'Lookup'}
            </button>
          </div>
        </form>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-mc-surface border border-mc-border rounded-xl p-5 flex flex-col sm:flex-row gap-5 items-start">
            <div className="flex gap-4 items-center">
              <img src={`https://mc-heads.net/avatar/${result.uuid}/64`} alt="" className="w-16 h-16 rounded-lg pixelated" style={{ imageRendering: 'pixelated' }} />
              <img src={`https://mc-heads.net/body/${result.uuid}/100`} alt="" className="h-28" style={{ imageRendering: 'pixelated' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-mc-white text-lg flex items-center gap-2"><User className="w-4 h-4" /> {result.username}</h2>
              <p className="text-xs text-mc-muted mt-1 font-mono">{result.uuid}</p>
              <p className="text-xs text-mc-muted mt-1">Model: {result.model}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={downloadPng} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-mc-red text-white text-sm font-medium">
                  <Download className="w-4 h-4" /> Download PNG
                </button>
                <a href={`https://namemc.com/profile/${result.username}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm">
                  NameMC <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a href={`https://laby.net/@${result.username}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm">
                  Laby <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        )}

        <h2 className="mt-10 text-lg font-bold text-mc-white flex items-center gap-2"><Palette className="w-5 h-5 text-mc-red" /> Galleries & create your own</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {GALLERIES.map((g) => (
            <a key={g.name} href={g.url} target="_blank" rel="noopener noreferrer"
              className="bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-mc-red/40 transition-colors">
              <h3 className="font-semibold text-mc-white text-sm flex items-center gap-1">{g.name} <ExternalLink className="w-3 h-3 text-mc-muted" /></h3>
              <p className="text-xs text-mc-muted mt-1">{g.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
