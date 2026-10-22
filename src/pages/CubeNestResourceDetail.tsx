import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Copy, Download, FileArchive, Image as ImageIcon, Package, Share2 } from 'lucide-react';

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
  created_at?: string;
  updated_at?: string;
  source_url?: string;
  url?: string;
};

const API_BASE = String(import.meta.env.VITE_CUBENEST_UPLOAD_API || import.meta.env.VITE_CUBENEST_API_URL || '').trim().replace(/\/+$/, '');

function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CubeNestResourceDetail() {
  const { id } = useParams();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      if (!API_BASE) {
        setError('CubeNest API is not configured.');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/api/cubenest-mods`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || `Request failed (${response.status})`);
        const items: Resource[] = Array.isArray(data.submissions) ? data.submissions : [];
        const found = items.find(item => String(item.id) === String(id));
        if (!found) throw new Error('Resource not found. It may have been removed from the catalogue.');
        setResource(found);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not load resource details.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id]);

  const share = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this resource link:', window.location.href);
    }
  }, []);

  if (loading) return <main className="min-h-screen bg-mc-black px-4 pb-20 pt-28 text-mc-text"><div className="mx-auto max-w-5xl animate-pulse"><div className="h-64 rounded-3xl bg-mc-surface"/><div className="mt-6 h-8 w-2/3 rounded bg-mc-surface"/><div className="mt-3 h-4 w-full rounded bg-mc-surface"/></div></main>;
  if (!resource) return <main className="min-h-screen bg-mc-black px-4 pb-20 pt-28 text-mc-text"><section className="mx-auto max-w-2xl rounded-3xl border border-mc-border bg-mc-surface p-8 text-center"><Package className="mx-auto mb-4 text-amber-300" size={38}/><h1 className="text-2xl font-black text-mc-white">Resource unavailable</h1><p className="mt-3 text-sm leading-6 text-mc-muted">{error || 'This resource could not be found.'}</p><Link to="/cubenest-mods" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950"><ArrowLeft size={16}/> Browse resources</Link></section></main>;

  const imageUrl = resource.image_filename ? `${API_BASE}/api/cubenest-mods/${resource.id}/image` : '';
  const downloadUrl = `${API_BASE}/api/cubenest-mods/${resource.id}/download`;
  const type = resource.kind === 'Addon' ? 'Bedrock Add-on' : resource.kind === 'Mod' ? 'Minecraft Mod' : resource.kind;

  return <main className="min-h-screen bg-mc-black px-4 pb-24 pt-24 text-mc-text sm:px-6">
    <div className="mx-auto max-w-6xl">
      <Link to="/cubenest-mods" className="mb-5 inline-flex items-center gap-2 text-sm text-mc-muted transition hover:text-white"><ArrowLeft size={16}/> Back to CubeNest resources</Link>
      <section className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/70 via-slate-950 to-cyan-950/40 shadow-2xl shadow-black/20">
        <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="relative min-h-64 bg-black/25 sm:min-h-80 md:min-h-[420px]">
            {imageUrl && !imageFailed ? <img src={imageUrl} alt={`${resource.title} preview`} className="absolute inset-0 h-full w-full object-cover" onError={() => setImageFailed(true)}/> : <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-950 via-slate-900 to-cyan-950 text-emerald-100/70"><ImageIcon size={56} strokeWidth={1.25}/><span className="text-sm font-semibold">No preview image available</span></div>}
            <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/65 px-3 py-1.5 text-xs font-bold text-white">{type}</span>
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-11">
            <div className="flex flex-wrap gap-2"><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{resource.platform || 'Community'}</span>{resource.category && <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-mc-muted">{resource.category}</span>}</div>
            <h1 className="mt-4 break-words text-3xl font-black tracking-tight text-white sm:text-4xl">{resource.title}</h1>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{resource.description || 'No description was provided for this resource.'}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3"><span className="block text-xs text-slate-400">Minecraft version</span><strong className="mt-1 block break-words text-sm text-white">{resource.version || 'Not specified'}</strong></div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3"><span className="block text-xs text-slate-400">File size</span><strong className="mt-1 block text-sm text-white">{formatSize(resource.size)}</strong></div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={downloadUrl} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-300"><Download size={18}/> Download resource</a>
              <button type="button" onClick={() => void share()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-bold text-white transition hover:border-emerald-300/50 hover:bg-white/10">{copied ? <Check size={17}/> : <Share2 size={17}/>} {copied ? 'Link copied' : 'Share resource'}</button>
            </div>
            <p className="mt-3 break-all text-xs text-slate-400">File: {resource.original_name || 'Resource file'}</p>
          </div>
        </div>
      </section>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-mc-border bg-mc-surface p-5 sm:p-6"><h2 className="text-lg font-bold text-white">About this resource</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-mc-muted">{resource.description || 'The uploader has not added a longer description yet.'}</p></section>
        <section className="rounded-2xl border border-mc-border bg-mc-surface p-5 sm:p-6"><h2 className="text-lg font-bold text-white">File information</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-mc-muted">Resource type</dt><dd className="text-right text-white">{type}</dd></div><div className="flex justify-between gap-4"><dt className="text-mc-muted">Platform</dt><dd className="text-right text-white">{resource.platform || 'Not specified'}</dd></div><div className="flex justify-between gap-4"><dt className="text-mc-muted">Version</dt><dd className="text-right text-white">{resource.version || 'Not specified'}</dd></div><div className="flex justify-between gap-4"><dt className="text-mc-muted">File size</dt><dd className="text-right text-white">{formatSize(resource.size)}</dd></div><div className="flex justify-between gap-4"><dt className="text-mc-muted">Filename</dt><dd className="max-w-[65%] break-all text-right text-white">{resource.original_name || 'Resource file'}</dd></div></dl><div className="mt-5 border-t border-mc-border pt-4 text-xs leading-5 text-mc-muted"><FileArchive className="mr-2 inline-block text-emerald-300" size={15}/> Review platform and Minecraft version compatibility before installing.</div></section>
      </div>
      <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-mc-border bg-mc-surface/70 p-5 sm:flex-row sm:items-center"><div><h2 className="font-bold text-white">Found something useful?</h2><p className="mt-1 text-sm text-mc-muted">Share this page so others can see the description and download link.</p></div><button type="button" onClick={() => void share()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-400/30 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/10">{copied ? <Check size={16}/> : <Copy size={16}/>} Copy link <ArrowUpRight size={14}/></button></div>
    </div>
  </main>;
}
