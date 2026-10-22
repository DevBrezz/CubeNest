import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Search, PackageOpen } from 'lucide-react';

type Resource = {
  id: number;
  title: string;
  kind: string;
  platform: string;
  category: string;
  version: string;
  description: string;
  original_name: string;
  size: number;
  image_filename?: string | null;
};

const API_BASE = String(
  import.meta.env.VITE_CUBENEST_UPLOAD_API ||
  import.meta.env.VITE_CUBENEST_API_URL ||
  ''
).trim().replace(/\/+$/, '');

const TYPES = [
  { value: 'Mod', label: 'Mods' },
  { value: 'Addon', label: 'Add-ons' },
  { value: 'Plugin', label: 'Plugins' },
  { value: 'Texture Pack', label: 'Resource Packs' },
  { value: 'Shader', label: 'Shaders' },
  { value: 'Skin', label: 'Skins' },
];

const CATEGORIES = [
  'Mods', 'Addons', 'Texture Packs', 'Shaders', 'Skins',
  'Administration', 'Economy', 'Gameplay', 'Protection',
  'Utility', 'World management', 'Other',
];

function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function typeLabel(value: string) {
  return TYPES.find(item => item.value === value)?.label || value;
}

function compatible(resource: Resource) {
  const platform = resource.platform.toLowerCase();
  const kind = resource.kind.toLowerCase();

  // Mods are Java resources; Add-ons are Bedrock resources.
  if (kind === 'mod' && platform !== 'java') return false;
  if (kind === 'addon' && platform !== 'bedrock') return false;
  return true;
}

export default function CubeNestMods() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [platform, setPlatform] = useState('All');
  const [type, setType] = useState('All');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadResources() {
    if (!API_BASE) {
      setError('The CubeNest API is not configured for this deployment.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/cubenest-mods`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load CubeNest resources.');
      }

      setResources(Array.isArray(data.submissions) ? data.submissions : []);
    } catch {
      setError('Could not load resources. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadResources();
  }, []);

  const platformResources = useMemo(() => {
    return resources.filter(resource => {
      if (!compatible(resource)) return false;
      if (platform !== 'All' && resource.platform.toLowerCase() !== platform.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [resources, platform]);

  const availableTypes = useMemo(() => {
    const actual = new Set(platformResources.map(resource => resource.kind));
    return TYPES.filter(item => actual.has(item.value));
  }, [platformResources]);

  const availableCategories = useMemo(() => {
    const matching = platformResources.filter(resource =>
      type === 'All' || resource.kind === type
    );
    return [...new Set(matching.map(resource => resource.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }, [platformResources, type]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return platformResources.filter(resource => {
      if (type !== 'All' && resource.kind !== type) return false;
      if (category !== 'All' && resource.category !== category) return false;

      if (query) {
        const haystack = [
          resource.title, resource.description, resource.category,
          resource.platform, resource.kind, resource.version
        ].join(' ').toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [platformResources, type, category, search]);

  useEffect(() => {
    if (type !== 'All' && !availableTypes.some(item => item.value === type)) {
      setType('All');
    }
  }, [availableTypes, type]);

  useEffect(() => {
    if (category !== 'All' && !availableCategories.includes(category)) {
      setCategory('All');
    }
  }, [availableCategories, category]);

  return (
    <main className="min-h-screen bg-mc-black px-4 pb-20 pt-24 text-mc-text sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Community resources
            </p>
            <h1 className="text-3xl font-bold text-mc-white sm:text-4xl">
              CubeNest Mods
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-mc-muted">
              Discover community uploads for Minecraft Java and Bedrock.
              Choose a platform and resource type to find compatible files.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadResources()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-mc-border bg-mc-surface px-4 py-2.5 text-sm text-mc-white hover:border-emerald-400 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <section className="mb-8 grid gap-3 rounded-2xl border border-mc-border bg-mc-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-mc-muted">
            Platform
            <select
              value={platform}
              onChange={event => {
                setPlatform(event.target.value);
                setType('All');
                setCategory('All');
              }}
              className="mt-2 w-full rounded-lg border border-mc-border bg-mc-black px-3 py-3 text-sm text-mc-white"
            >
              <option value="All">All platforms</option>
              <option value="Java">Java Edition</option>
              <option value="Bedrock">Bedrock Edition</option>
            </select>
          </label>

          <label className="text-xs font-medium text-mc-muted">
            Type
            <select
              value={type}
              onChange={event => {
                setType(event.target.value);
                setCategory('All');
              }}
              className="mt-2 w-full rounded-lg border border-mc-border bg-mc-black px-3 py-3 text-sm text-mc-white"
            >
              <option value="All">All types</option>
              {availableTypes.map(item => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-mc-muted">
            Category
            <select
              value={category}
              onChange={event => setCategory(event.target.value)}
              className="mt-2 w-full rounded-lg border border-mc-border bg-mc-black px-3 py-3 text-sm text-mc-white"
            >
              <option value="All">All categories</option>
              {availableCategories.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-mc-muted">
            Search resources
            <span className="mt-2 flex items-center gap-2 rounded-lg border border-mc-border bg-mc-black px-3">
              <Search size={16} className="shrink-0 text-mc-muted" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search by name or keyword..."
                className="min-w-0 w-full bg-transparent py-3 text-sm text-mc-white outline-none"
              />
            </span>
          </label>
        </section>

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-mc-muted">
            {loading ? 'Loading resources...' : `${filtered.length} resource${filtered.length === 1 ? '' : 's'}`}
          </p>
          <a href="/upload" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">
            Upload a resource →
          </a>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-mc-border bg-mc-surface px-5 py-14 text-center">
            <PackageOpen size={36} className="mx-auto mb-4 text-mc-muted" />
            <h2 className="text-lg font-semibold text-mc-white">No resources found</h2>
            <p className="mt-2 text-sm text-mc-muted">
              Try changing the filters or search for another resource.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(resource => (
            <article
              key={resource.id}
              className="overflow-hidden rounded-2xl border border-mc-border bg-mc-surface transition-colors hover:border-emerald-400/50"
            >
              {resource.image_filename && (
                <img
                  src={`${API_BASE}/api/cubenest-mods/${resource.id}/image`}
                  alt=""
                  loading="lazy"
                  className="h-44 w-full object-cover"
                />
              )}

              <div className="p-5">
                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-emerald-300">
                    {typeLabel(resource.kind)}
                  </span>
                  <span className="rounded-full bg-mc-black px-2.5 py-1 text-mc-muted">
                    {resource.platform}
                  </span>
                  {resource.category && (
                    <span className="rounded-full bg-mc-black px-2.5 py-1 text-mc-muted">
                      {resource.category}
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-semibold text-mc-white">{resource.title}</h2>
                <p className="mt-2 line-clamp-3 min-h-[4.5rem] whitespace-pre-wrap text-sm text-mc-muted">
                  {resource.description}
                </p>

                <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-mc-muted">
                  <span>Version {resource.version || 'Not specified'}</span>
                  <span>{formatSize(resource.size)}</span>
                </div>

                <a
                  href={`${API_BASE}/api/cubenest-mods/${resource.id}/download`}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-emerald-300"
                >
                  <Download size={16} />
                  Download {resource.original_name || 'resource'}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
