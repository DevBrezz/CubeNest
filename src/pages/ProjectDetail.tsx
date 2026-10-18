import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Download, Package, Calendar, Tag, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useResources } from '../hooks/useResources';
import { formatDate, formatNumber, cn } from '../lib/utils';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { resources, loading } = useResources();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const resource = resources.find((r) => r.id === id);

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

  if (!resource) {
    return (
      <div className="pt-24 max-w-4xl mx-auto px-4 text-center py-20">
        <h1 className="text-2xl font-bold text-mc-white mb-2">Resource not found</h1>
        <p className="text-mc-muted mb-6">This project may have been removed or the ID is invalid.</p>
        <Link to="/projects" className="text-mc-red hover:underline">← Back to projects</Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-mc-muted hover:text-mc-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row gap-6 mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-mc-surface border border-mc-border flex-shrink-0 overflow-hidden">
              {resource.icon ? (
                <img src={resource.icon} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-mc-muted" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-semibold uppercase',
                  resource.platform === 'modrinth' ? 'bg-green-600/90 text-white' : 'bg-orange-600/90 text-white'
                )}>
                  {resource.platform}
                </span>
                {resource.featured && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-mc-red/90 text-white">Featured</span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-mc-white leading-tight">{resource.title}</h1>
              <p className="mt-2 text-mc-muted">{resource.description}</p>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-mc-muted">
                <span className="flex items-center gap-1.5"><Download className="w-4 h-4" /> {formatNumber(resource.downloads)} downloads</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Updated {formatDate(resource.updated)}</span>
                <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> v{resource.version}</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={resource.downloadUrl || resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-mc-red text-white font-medium text-sm hover:bg-mc-red-bright transition-colors"
                >
                  <Download className="w-4 h-4" /> Download / Versions
                </a>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-mc-surface border border-mc-border text-mc-text font-medium text-sm hover:border-mc-red/50 transition-colors"
                >
                  Official Page <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-mc-surface border border-mc-border rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-mc-muted mb-2">Loaders / Platforms</h3>
              <div className="flex flex-wrap gap-1.5">
                {resource.loaders.length ? resource.loaders.map((l) => (
                  <span key={l} className="px-2 py-1 rounded bg-mc-gray text-xs text-mc-text capitalize">{l}</span>
                )) : <span className="text-sm text-mc-muted">Not specified</span>}
              </div>
            </div>
            <div className="bg-mc-surface border border-mc-border rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-mc-muted mb-2">Minecraft Versions</h3>
              <div className="flex flex-wrap gap-1.5">
                {resource.gameVersions.length ? resource.gameVersions.map((v) => (
                  <span key={v} className="px-2 py-1 rounded bg-mc-gray text-xs text-mc-text">{v}</span>
                )) : <span className="text-sm text-mc-muted">See official page</span>}
              </div>
            </div>
            <div className="bg-mc-surface border border-mc-border rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-mc-muted mb-2">Categories</h3>
              <div className="flex flex-wrap gap-1.5">
                {resource.categories.map((c) => (
                  <span key={c} className="px-2 py-1 rounded bg-mc-gray text-xs text-mc-text capitalize">{c}</span>
                ))}
              </div>
            </div>
            <div className="bg-mc-surface border border-mc-border rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-mc-muted mb-2">Published</h3>
              <p className="text-sm text-mc-text">{formatDate(resource.published)}</p>
            </div>
          </div>

          {/* Description body */}
          {resource.body && resource.body !== resource.description && (
            <div className="bg-mc-surface border border-mc-border rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold text-mc-white mb-3">About</h2>
              <div className="prose prose-invert prose-sm max-w-none text-mc-muted whitespace-pre-wrap leading-relaxed">
                {resource.body}
              </div>
            </div>
          )}

          {/* Gallery */}
          {resource.gallery && resource.gallery.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-mc-white mb-3">Gallery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resource.gallery.map((url, i) => (
                  <button key={i} type="button" className="detail-gallery-thumb" onClick={() => { setLightbox(url); setZoom(1); }} aria-label={`Open gallery image ${i + 1}`}><img src={url} alt={`${resource.title} screenshot ${i + 1}`} className="rounded-lg border border-mc-border w-full object-cover" loading="lazy"/><span><ZoomIn size={14}/> View full image</span></button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-mc-muted">
            Data sourced from the official {resource.platform === 'modrinth' ? 'Modrinth' : 'SpigotMC'} listing.
            Always verify versions and compatibility on the original page.
          </p>
        </motion.div>
      </div>
      {lightbox && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Plugin screenshot viewer" onClick={() => setLightbox(null)}><div className="gallery-lightbox-toolbar" onClick={e=>e.stopPropagation()}><span>{resource.title}<small> · Screenshot preview</small></span><button onClick={()=>setZoom(z=>Math.max(.5,z-.25))} aria-label="Zoom out"><ZoomOut size={18}/></button><button onClick={()=>setZoom(1)} aria-label="Reset zoom"><RotateCcw size={17}/></button><button onClick={()=>setZoom(z=>Math.min(3,z+.25))} aria-label="Zoom in"><ZoomIn size={18}/></button><button onClick={()=>setLightbox(null)} aria-label="Close viewer"><X size={20}/></button></div><div className="gallery-lightbox-stage" onClick={e=>e.stopPropagation()}><img src={lightbox} alt={`${resource.title} full-size screenshot`} style={{transform:`scale(${zoom})`}} onWheel={e=>{e.preventDefault();setZoom(z=>Math.max(.5,Math.min(3,z+(e.deltaY<0?.1:-.1))))}}/></div><div className="gallery-lightbox-bottom">Click outside to close · Zoom {Math.round(zoom*100)}%</div></div>}
    </div>
  );
}
