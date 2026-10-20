import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, ExternalLink, Package, CalendarDays, DownloadCloud, ShieldCheck, Tag, UserRound, AlertCircle } from 'lucide-react';
import { formatNumber } from '../lib/utils';
import { downloadBedrockItem, canDownloadBedrockItem } from '../lib/bedrockDownload';

type BedrockItem = {
  id: number | string; slug: string; name: string; summary: string; downloadCount: number;
  logo: string | null; url: string; authors?: string[]; categories?: string[];
  category?: string; categoryLabel?: string; downloadUrl?: string | null;
  fileName?: string | null; fileId?: number | null; latestFileId?: number | null; updated?: string | null;
  source?: string;
};
type BedrockData = { lastSynced: string | null; resources: BedrockItem[]; error?: string };

export function BedrockResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<BedrockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const bust = Date.now();
    Promise.allSettled([
      fetch(`${import.meta.env.BASE_URL}data/bedrock-curseforge.json?t=${bust}`, { signal: controller.signal, cache: 'no-store' }).then(async (response) => {
        if (!response.ok) throw new Error(`Catalog unavailable (${response.status})`);
        return response.json() as Promise<BedrockData>;
      }),
      fetch(`${import.meta.env.BASE_URL}data/9minecraft-bedrock.json?t=${bust}`, { signal: controller.signal, cache: 'no-store' }).then(async (response) => {
        if (!response.ok) return { lastSynced: null, resources: [] } as BedrockData;
        return response.json() as Promise<BedrockData>;
      }),
    ]).then((results) => {
      const curse = results[0].status === 'fulfilled' ? results[0].value : null;
      const nine = results[1].status === 'fulfilled' ? results[1].value : null;
      const resources = [
        ...(curse?.resources || []).map((item) => ({ ...item, source: item.source || 'CurseForge' })),
        ...(nine?.resources || []).map((item) => ({ ...item, source: item.source || '9Minecraft' })),
      ];
      if (!resources.length && results[0].status === 'rejected') {
        setError(results[0].reason instanceof Error ? results[0].reason.message : 'Could not load resource details');
        return;
      }
      setData({ lastSynced: curse?.lastSynced || nine?.lastSynced || null, resources });
    }).catch((reason) => {
      if (reason?.name !== 'AbortError') setError(reason instanceof Error ? reason.message : 'Could not load resource details');
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const item = useMemo(() => data?.resources?.find(resource => String(resource.id) === id), [data, id]);

  const handleDownload = useCallback(async () => {
    if (!item) return;
    setDownloadBusy(true);
    setDownloadMessage(null);
    try {
      await downloadBedrockItem(item);
      setDownloadMessage('Download started. You stayed on CubeNest.');
    } catch (e) {
      setDownloadMessage(e instanceof Error ? e.message : 'Download failed.');
    } finally {
      setDownloadBusy(false);
    }
  }, [item]);

  if (loading) return <div className="pt-28 pb-20 max-w-5xl mx-auto px-4"><div className="skeleton h-72 rounded-3xl mb-5" /><div className="skeleton h-8 w-2/3 mb-3" /><div className="skeleton h-4 w-full" /></div>;
  if (error || !item) return <div className="pt-28 pb-24 max-w-3xl mx-auto px-4 text-center"><AlertCircle className="w-10 h-10 mx-auto text-amber-400 mb-3" /><h1 className="text-2xl font-bold text-mc-white">Resource unavailable</h1><p className="text-sm text-mc-muted mt-2">{error || 'This resource is no longer in the current catalog.'}</p><Link to="/bedrock/catalog" className="inline-flex mt-6 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm">Back to library</Link></div>;

  const category = item.categoryLabel || item.category || 'Bedrock resource';
  const updated = item.updated ? new Date(item.updated) : null;
  const versionText = item.fileName?.match(/\b(v?\d+(?:\.\d+){1,3}(?:[-+][\w.-]+)?)\b/i)?.[0] || 'Latest available';
  return <div className="pt-24 pb-20 min-h-screen mc-grid-bg">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <Link to="/bedrock/catalog" className="inline-flex items-center gap-2 text-sm text-mc-muted hover:text-mc-white mb-6"><ArrowLeft className="w-4 h-4" /> Back to Bedrock Library</Link>
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/80 via-mc-surface to-cyan-950/30 p-5 sm:p-8 lg:p-10">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="relative grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-6 md:gap-8 items-start">
          <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 mx-auto md:mx-0 rounded-2xl overflow-hidden bg-black/25 border border-white/10 shadow-xl flex items-center justify-center">{item.logo ? <img src={item.logo} alt={`${item.name} cover`} className="w-full h-full object-cover" /> : <Package className="w-14 h-14 text-mc-muted" />}</div>
          <div className="min-w-0 text-center md:text-left">
            <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">{category}</span>
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-mc-white break-words">{item.name}</h1>
            <p className="mt-4 max-w-3xl text-sm sm:text-base leading-7 text-mc-muted">{item.summary || 'A community resource for Minecraft Bedrock Edition.'}</p>
            <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-2 text-xs text-mc-muted">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/20 px-3 py-2"><DownloadCloud className="w-3.5 h-3.5" /> {formatNumber(item.downloadCount || 0)} downloads</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/20 px-3 py-2"><UserRound className="w-3.5 h-3.5" /> {item.authors?.join(', ') || 'Community creator'}</span>
              {updated && !Number.isNaN(updated.getTime()) && <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/20 px-3 py-2"><CalendarDays className="w-3.5 h-3.5" /> Updated {updated.toLocaleDateString()}</span>}
            </div>
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
              {canDownloadBedrockItem(item) ? (
                <button
                  type="button"
                  disabled={downloadBusy}
                  onClick={() => void handleDownload()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-950/30 hover:bg-emerald-300 transition-colors disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {downloadBusy ? 'Downloading…' : `Download ${item.fileName ? 'file' : 'latest'}`}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="No direct file URL is available"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-mc-gray px-5 py-3 text-sm font-extrabold text-mc-muted cursor-not-allowed"
                >
                  <Download className="w-4 h-4" /> Download unavailable
                </button>
              )}
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/20 px-5 py-3 text-sm font-semibold text-mc-white hover:border-emerald-400/50">Publisher page <ExternalLink className="w-4 h-4" /></a>
            </div>
            {downloadMessage && (
              <p className="mt-4 text-sm text-emerald-200/90 max-w-xl mx-auto md:mx-0">{downloadMessage}</p>
            )}
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,.8fr)] gap-5 mt-6">
        <section className="rounded-2xl border border-mc-border bg-mc-surface p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4"><Tag className="w-5 h-5 text-emerald-400" /><h2 className="text-lg font-bold text-mc-white">About this resource</h2></div>
          <p className="text-sm leading-7 text-mc-muted whitespace-pre-wrap">{item.summary || 'No extended description was provided by the source. Open the publisher page for more details.'}</p>
          {!!item.categories?.length && <div className="flex flex-wrap gap-2 mt-5">{item.categories.map(tag => <span key={tag} className="rounded-full border border-mc-border bg-mc-gray px-3 py-1 text-xs text-mc-muted">{tag}</span>)}</div>}
        </section>
        <aside className="rounded-2xl border border-mc-border bg-mc-surface p-5 sm:p-6">
          <h2 className="text-lg font-bold text-mc-white mb-4">File information</h2>
          <dl className="space-y-4 text-sm">
            <div className="flex items-start justify-between gap-4"><dt className="text-mc-muted">Version</dt><dd className="text-right text-mc-white font-semibold">{versionText}</dd></div>
            <div className="flex items-start justify-between gap-4"><dt className="text-mc-muted">File</dt><dd className="text-right text-mc-white break-all max-w-[65%]">{item.fileName || 'Latest file from publisher'}</dd></div>
            <div className="flex items-start justify-between gap-4"><dt className="text-mc-muted">Platform</dt><dd className="text-right text-mc-white">Minecraft Bedrock</dd></div>
            <div className="flex items-start justify-between gap-4"><dt className="text-mc-muted">Download count</dt><dd className="text-right text-mc-white">{formatNumber(item.downloadCount || 0)}</dd></div>
          </dl>
          <p className="mt-5 flex items-start gap-2 border-t border-mc-border pt-4 text-xs leading-5 text-mc-muted"><ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Downloads are streamed through the CubeNest download service when a direct file link is available. If the publisher does not expose a file URL, the download button stays disabled instead of sending you to an external site.</p>
        </aside>
      </div>
      <div className="mt-6 rounded-2xl border border-mc-border bg-mc-surface/70 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h2 className="font-bold text-mc-white">Ready to explore more?</h2><p className="text-sm text-mc-muted mt-1">Find another add-on, map, texture pack or shader.</p></div><Link to="/bedrock/catalog" className="inline-flex items-center justify-center rounded-xl border border-emerald-500/40 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10">Explore library <ArrowLeft className="ml-2 w-4 h-4 rotate-180" /></Link></div>
    </div>
  </div>;
}
