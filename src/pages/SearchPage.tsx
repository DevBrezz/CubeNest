import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export function SearchPage() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const go = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate(`/mods/catalog?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="pt-20 pb-28 min-h-screen mc-grid-bg px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-mc-white mb-1">Search</h1>
        <p className="text-sm text-mc-muted mb-5">Search mods, packs, and more on Modrinth.</p>
        <form onSubmit={go}>
          <div className="flex items-center gap-2 bg-mc-surface border border-mc-border rounded-xl p-1.5 focus-within:border-mc-red/50">
            <Search className="w-4 h-4 text-mc-muted ml-2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search content..."
              className="flex-1 bg-transparent border-0 outline-none text-sm text-mc-white py-2.5 placeholder:text-mc-muted"
              autoFocus
            />
            <button type="submit" className="px-4 py-2 rounded-lg bg-mc-red text-white text-sm font-medium">Go</button>
          </div>
        </form>
        <div className="mt-6 flex flex-wrap gap-2">
          {['shaders', 'fabric', 'rpg', 'map', 'optimization'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => navigate(`/mods/catalog?q=${encodeURIComponent(t)}`)}
              className="px-3 py-1.5 rounded-full text-xs bg-mc-surface border border-mc-border text-mc-muted hover:text-mc-white"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
