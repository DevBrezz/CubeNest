import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, ExternalLink, Package, Calendar, AlertCircle } from 'lucide-react';
import { getProject, getProjectVersions, projectUrl, type ModrinthProject, type ModrinthVersion } from '../lib/modrinth';
import { formatDate, formatNumber } from '../lib/utils';

export function ModrinthDetail({ category }: { category: string }) {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<ModrinthProject | null>(null);
  const [versions, setVersions] = useState<ModrinthVersion[]>([]);
  const [tab, setTab] = useState<'overview' | 'versions' | 'gallery'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([
      getProject(slug, ac.signal),
      getProjectVersions(slug, ac.signal),
    ])
      .then(([p, v]) => {
        setProject(p);
        setVersions(v);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Failed to load project');
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-24 max-w-4xl mx-auto px-4">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton h-64 rounded-xl mb-6" />
        <div className="skeleton h-4 w-full mb-2" />
        <div className="skeleton h-4 w-3/4" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="pt-24 max-w-4xl mx-auto px-4 text-center py-20">
        <AlertCircle className="w-10 h-10 text-mc-red mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-mc-white mb-2">Project unavailable</h1>
        <p className="text-mc-muted mb-6">{error || 'Not found'}</p>
        <Link to={`/${category}`} className="text-mc-red hover:underline">← Back to catalog</Link>
      </div>
    );
  }

  const primaryFile = versions[0]?.files?.find((f) => f.primary) || versions[0]?.files?.[0];
  const gallery = project.gallery || [];

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Link to={`/${category}`} className="inline-flex items-center gap-1.5 text-sm text-mc-muted hover:text-mc-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {category}
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row gap-6 mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-mc-surface border border-mc-border flex-shrink-0 overflow-hidden flex items-center justify-center">
              {project.icon_url ? <img src={project.icon_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-10 h-10 text-mc-muted" />}
            </div>
            <div className="flex-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-green-600/90 text-white">Modrinth · {project.project_type}</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-mc-white mt-2 leading-tight">{project.title}</h1>
              <p className="mt-2 text-mc-muted">{project.description}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-mc-muted">
                <span className="flex items-center gap-1.5"><Download className="w-4 h-4" /> {formatNumber(project.downloads)}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Updated {formatDate(project.updated)}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {primaryFile ? (
                  <a href={primaryFile.url} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-mc-red text-white font-medium text-sm hover:bg-mc-red-bright transition-colors" rel="noopener noreferrer">
                    <Download className="w-4 h-4" /> Download latest
                  </a>
                ) : null}
                <a href={projectUrl(project.slug)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-mc-surface border border-mc-border text-mc-text font-medium text-sm hover:border-mc-red/50">
                  Open on Modrinth <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex gap-1 border-b border-mc-border mb-6">
            {(['overview', 'versions', 'gallery'] as const).map((t) => {
              if (t === 'gallery' && !gallery.length) return null;
              return (
                <button key={t} type="button" onClick={() => setTab(t)} className={`px-4 py-2 text-sm capitalize border-b-2 transition-colors ${tab === t ? 'border-mc-red text-mc-white' : 'border-transparent text-mc-muted hover:text-mc-white'}`}>
                  {t}
                </button>
              );
            })}
          </div>

          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-mc-surface border border-mc-border rounded-xl p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-mc-muted mb-2">Loaders</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(project.loaders || []).length ? project.loaders!.map((l) => <span key={l} className="px-2 py-1 rounded bg-mc-gray text-xs capitalize">{l}</span>) : <span className="text-sm text-mc-muted">See versions</span>}
                  </div>
                </div>
                <div className="bg-mc-surface border border-mc-border rounded-xl p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-mc-muted mb-2">Game versions</h3>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {(project.game_versions || []).slice(0, 20).map((v) => <span key={v} className="px-2 py-1 rounded bg-mc-gray text-xs">{v}</span>)}
                    {(project.game_versions?.length || 0) > 20 && <span className="text-xs text-mc-muted">+ more</span>}
                  </div>
                </div>
              </div>
              <div className="bg-mc-surface border border-mc-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-mc-white mb-3">About</h2>
                <div className="text-sm text-mc-muted whitespace-pre-wrap leading-relaxed max-h-[480px] overflow-y-auto">
                  {project.body || project.description}
                </div>
              </div>
              {project.license?.id && (
                <p className="text-xs text-mc-muted">License: {project.license.name || project.license.id}</p>
              )}
            </div>
          )}

          {tab === 'versions' && (
            <div className="space-y-3">
              {versions.length === 0 ? (
                <p className="text-mc-muted text-sm">No versions listed.</p>
              ) : versions.slice(0, 30).map((v) => {
                const file = v.files.find((f) => f.primary) || v.files[0];
                return (
                  <div key={v.id} className="bg-mc-surface border border-mc-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div>
                      <div className="font-medium text-mc-white text-sm">{v.version_number} <span className="text-mc-muted font-normal">· {v.version_type}</span></div>
                      <div className="text-xs text-mc-muted mt-1">{formatDate(v.date_published)} · {v.game_versions.slice(0, 6).join(', ')}{v.game_versions.length > 6 ? '…' : ''} · {v.loaders.join(', ')}</div>
                      {file && <div className="text-[11px] text-mc-muted mt-1">{file.filename} · {(file.size / 1024).toFixed(0)} KB</div>}
                    </div>
                    {file && (
                      <a href={file.url} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mc-gray border border-mc-border text-xs hover:border-mc-red/50 shrink-0" rel="noopener noreferrer">
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'gallery' && gallery.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gallery.map((g, i) => (
                <button key={i} type="button" className="rounded-lg border border-mc-border overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-mc-red" onClick={() => setLightbox(g.url)}>
                  <img src={g.url} alt={g.title || ''} className="w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
