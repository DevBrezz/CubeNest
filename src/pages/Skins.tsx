import { Link } from 'react-router-dom';
import { FormEvent, useMemo, useState } from 'react';
import { Search, Download, ExternalLink, User, Palette, Box, Sparkles, Paintbrush } from 'lucide-react';
import steveSkinUrl from '../assets/skins/steve.png';
import alexSkinUrl from '../assets/skins/alex.png';

type SkinResult = {
  username: string;
  uuid: string;
  skinUrl: string;
  model: 'classic' | 'slim';
};

const BUNDLED_SKINS = {
  steve: steveSkinUrl,
  alex: alexSkinUrl,
} as const;

function skinAsset(id: 'steve' | 'alex'): string {
  return BUNDLED_SKINS[id];
}

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

const DEFAULT_SKINS = [
  {
    id: 'steve' as const,
    name: 'Steve',
    model: 'classic' as const,
    texture: skinAsset('steve'),
    desc: 'Classic wide-arm default',
  },
  {
    id: 'alex' as const,
    name: 'Alex',
    model: 'slim' as const,
    texture: skinAsset('alex'),
    desc: 'Slim-arm default',
  },
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
    const dashed = result.uuid;
    return {
      head: `https://mc-heads.net/avatar/${id}/128`,
      body: `https://mc-heads.net/body/${id}/220`,
      crafty3d:
        pose === 'head'
          ? `https://mc-heads.net/head/${id}/280`
          : pose === 'bust'
            ? `https://mc-heads.net/player/${id}/280`
            : `https://crafatar.com/renders/body/${dashed}?scale=10&overlay&default=MHF_Steve`,
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

  const downloadDefault = async (id: 'steve' | 'alex', name: string) => {
    try {
      const res = await fetch(skinAsset(id));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.toLowerCase()}-skin.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
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
            Search a Java username, preview with public renders, download the PNG, or open the CubeNest Skin Creator.
          </p>
          <Link
            to="/skin-creator"
            className="inline-flex items-center gap-1.5 mt-3 px-4 py-2.5 rounded-xl bg-fuchsia-500 text-slate-950 text-sm font-bold hover:bg-fuchsia-400 min-h-[44px]"
          >
            <Paintbrush className="w-4 h-4" /> Create Skin
          </Link>
        </div>

        {/* Default Steve & Alex */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-mc-white mb-3">Default templates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEFAULT_SKINS.map((s) => (
              <div
                key={s.id}
                className="bg-mc-surface border border-mc-border rounded-xl p-4 flex items-center gap-4"
              >
                <img
                  src={s.texture}
                  alt={`${s.name} skin texture`}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-lg border border-mc-border bg-black/40 shrink-0"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-mc-white text-sm flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> {s.name}
                  </h3>
                  <p className="text-xs text-mc-muted mt-0.5">
                    {s.desc} · {s.model}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => void downloadDefault(s.id, s.name)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-mc-gray border border-mc-border text-xs font-medium text-mc-text min-h-[36px]"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PNG
                    </button>
                    <Link
                      to="/skin-creator"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/40 text-xs font-medium text-fuchsia-200 min-h-[36px]"
                    >
                      Edit in Creator
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={onSearch} className="max-w-xl">
          <div className="flex items-center gap-2 bg-mc-surface border border-mc-border rounded-xl p-1.5 focus-within:border-mc-red/50">
            <Search className="w-4 h-4 text-mc-muted ml-2 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search username..."
              className="flex-1 bg-transparent border-0 outline-none text-sm text-mc-white py-2.5 placeholder:text-mc-muted"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-mc-red text-white text-sm font-medium disabled:opacity-50 min-h-[40px]"
            >
              {loading ? '…' : 'Search'}
            </button>
          </div>
        </form>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        {result && renders && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      className={`px-2 py-1 rounded text-[10px] uppercase border min-h-[28px] ${
                        pose === p ? 'bg-mc-red border-mc-red text-white' : 'bg-mc-gray border-mc-border text-mc-muted'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-center items-center min-h-[280px] bg-mc-gray/80 rounded-lg">
                <img
                  src={renders.crafty3d}
                  alt={`${result.username} 3D`}
                  className="max-h-[320px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = renders.body;
                  }}
                />
              </div>
              <p className="text-[10px] text-mc-muted mt-2 text-center">
                Render: mc-heads + Crafatar · model {result.model}
              </p>
            </div>

            <div className="bg-mc-surface border border-mc-border rounded-xl p-4 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={renders.head}
                  alt=""
                  className="w-14 h-14 rounded-lg"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div>
                  <h2 className="font-semibold text-mc-white text-lg flex items-center gap-2">
                    <User className="w-4 h-4" /> {result.username}
                  </h2>
                  <p className="text-[11px] text-mc-muted font-mono break-all">{result.uuid}</p>
                </div>
              </div>

              <div className="flex gap-4 items-end mb-4">
                <img src={renders.body} alt="" className="h-36" style={{ imageRendering: 'pixelated' }} />
                <img
                  src={renders.skinPng}
                  alt="Skin texture"
                  className="h-32 w-32 object-contain bg-mc-gray rounded border border-mc-border"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void downloadPng()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-mc-red text-white text-sm font-medium min-h-[44px]"
                >
                  <Download className="w-4 h-4" /> Download PNG
                </button>
                <a
                  href={`https://namemc.com/profile/${result.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm min-h-[44px]"
                >
                  NameMC <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`https://laby.net/@${result.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm min-h-[44px]"
                >
                  Laby <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {!result && !loading && !error && (
          <p className="mt-6 text-sm text-mc-muted">
            Enter a Java edition username above to preview their skin, or use Create Skin to design your own.
          </p>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-bold text-mc-white flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-mc-red" /> Create &amp; browse
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              to="/skin-creator"
              className="bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-fuchsia-500/45 transition-colors sm:col-span-2"
            >
              <h3 className="font-semibold text-mc-white text-sm flex items-center gap-1.5">
                <Paintbrush className="w-4 h-4 text-fuchsia-300" /> CubeNest Skin Creator
              </h3>
              <p className="text-xs text-mc-muted mt-1">
                Paint Classic or Slim skins with Steve and Alex templates, then export a 64×64 PNG.
              </p>
              <span className="inline-flex items-center gap-1 mt-3 text-xs text-fuchsia-300">Open editor</span>
            </Link>
            {GALLERIES.map((g) => (
              <a
                key={g.name}
                href={g.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-mc-red/40"
              >
                <h3 className="font-semibold text-mc-white text-sm flex items-center gap-1">
                  {g.name} <ExternalLink className="w-3 h-3 text-mc-muted" />
                </h3>
                <p className="text-xs text-mc-muted mt-1">{g.desc}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
