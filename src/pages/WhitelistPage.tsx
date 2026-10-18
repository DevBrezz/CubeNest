import { useEffect, useState } from 'react';
import { ShieldCheck, Trash2 } from 'lucide-react';
import { getWhitelist, toggleWhitelist, type WhitelistItem } from '../lib/localStore';

export function WhitelistPage() {
  const [items, setItems] = useState<WhitelistItem[]>([]);

  const reload = () => setItems(getWhitelist());
  useEffect(() => {
    reload();
  }, []);

  return (
    <div className="pt-20 pb-28 min-h-screen mc-grid-bg px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-mc-white mb-1">Whitelist</h1>
        <p className="text-sm text-mc-muted mb-5">Saved projects and links on this device.</p>
        {items.length === 0 ? (
          <div className="text-center py-16 text-mc-muted">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Whitelist is empty. Save items while browsing catalogs.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((w) => (
              <li key={w.id} className="bg-mc-surface border border-mc-border rounded-xl p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-mc-white">{w.title}</p>
                  {w.note && <p className="text-xs text-mc-muted mt-0.5">{w.note}</p>}
                  {w.url && (
                    <a href={w.url} className="text-xs text-mc-red hover:underline" target="_blank" rel="noreferrer">
                      Open
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  className="text-mc-muted hover:text-mc-red"
                  aria-label="Remove"
                  onClick={() => {
                    toggleWhitelist(w);
                    reload();
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
