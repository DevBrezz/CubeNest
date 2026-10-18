import { useEffect, useState } from 'react';
import { Download, Trash2, ExternalLink } from 'lucide-react';
import { clearDownloads, getDownloads, type DownloadRecord } from '../lib/localStore';

export function DownloadsPage() {
  const [items, setItems] = useState<DownloadRecord[]>([]);

  useEffect(() => {
    setItems(getDownloads());
  }, []);

  const clear = () => {
    clearDownloads();
    setItems([]);
  };

  return (
    <div className="pt-20 pb-28 min-h-screen mc-grid-bg px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-mc-white">Downloads</h1>
            <p className="text-sm text-mc-muted">Recent download links opened from CubeNest (this device).</p>
          </div>
          {items.length > 0 && (
            <button type="button" onClick={clear} className="text-xs text-mc-muted hover:text-mc-red inline-flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="text-center py-16 text-mc-muted">
            <Download className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No downloads recorded yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((d) => (
              <li key={d.id} className="bg-mc-surface border border-mc-border rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-mc-white truncate">{d.title}</p>
                  <p className="text-[11px] text-mc-muted">{new Date(d.at).toLocaleString()}{d.platform ? ` · ${d.platform}` : ''}</p>
                </div>
                <a href={d.url} target="_blank" rel="noreferrer" className="shrink-0 text-mc-red">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
