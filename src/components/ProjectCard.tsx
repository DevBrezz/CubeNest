import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, Download, Package, Code2, X, ZoomIn, ZoomOut, RotateCcw, CalendarClock } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import type { Resource } from '../types/resource';
import { formatNumber, formatDate, cn } from '../lib/utils';

interface Props { resource: Resource; index?: number; }
function releaseBadge(resource: Resource) {
  const now = Date.now();
  const published = new Date(resource.published).getTime();
  const updated = new Date(resource.updated).getTime();
  if (Number.isFinite(published) && now >= published && now - published <= 14 * 86400000) return 'NEW';
  if (Number.isFinite(updated) && now >= updated && now - updated <= 30 * 86400000) return 'UPDATED';
  return null;
}

export function ProjectCard({ resource, index = 0 }: Props) {
  const { t } = useLanguage();
  const [viewer, setViewer] = useState(false);
  const [zoom, setZoom] = useState(1);
  const gallery = resource.gallery?.filter(Boolean) ?? [];
  const artwork = gallery[0] || null;
  const badge = releaseBadge(resource);
  return <>
    <motion.article initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: .35, delay: Math.min(index * .035, .2) }} whileHover={{ y: -4 }} className="project-card group relative bg-mc-surface border border-mc-border rounded-xl overflow-hidden hover:border-mc-red/50 transition-colors">
      <div className="project-art aspect-[16/10] bg-mc-gray relative overflow-hidden">
        {artwork ? <button type="button" className="gallery-cover" onClick={() => { setZoom(1); setViewer(true); }} aria-label={`View ${resource.title} gallery`}><img src={artwork} alt={`${resource.title} gallery preview`} className="w-full h-full object-cover group-hover:scale-[1.035] transition-transform duration-500" loading="lazy"/><span className="gallery-cover-hint"><ZoomIn size={15}/> View gallery {gallery.length > 1 ? `· ${gallery.length} images` : ''}</span></button> : <div className="project-art-fallback"><div className="fallback-orbit"><Code2 size={30}/></div><strong>{resource.title}</strong><span><Package size={13}/> Gallery coming soon</span></div>}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none"><span className={cn('px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider', resource.platform === 'modrinth' ? 'bg-green-600/90 text-white' : 'bg-orange-600/90 text-white')}>{resource.platform}</span>{badge && <span className={`release-badge ${badge === 'NEW' ? 'release-new' : 'release-updated'}`}>{badge === 'NEW' ? <SparkleDot/> : <CalendarClock size={11}/>} {badge}</span>}{resource.featured && <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-mc-red/90 text-white">Featured</span>}</div>
        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="absolute top-3 right-3 p-2 rounded-lg bg-black/70 text-white hover:bg-black/90 transition-colors" aria-label={`${t.open} ${resource.title}`}><ExternalLink size={14}/></a>
      </div>
      <Link to={`/project/${resource.id}`} className="block p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-mc-white text-base leading-snug line-clamp-2 group-hover:text-mc-red-bright transition-colors">{resource.title}</h3><span className="text-[10px] text-mc-muted border border-mc-border rounded-md px-2 py-1 shrink-0">v{resource.version || '—'}</span></div><p className="mt-2 text-sm text-mc-muted line-clamp-2 leading-relaxed">{resource.description}</p><div className="mt-3 flex flex-wrap gap-1.5">{resource.loaders.slice(0,3).map(l=><span key={l} className="px-2 py-1 rounded-md bg-mc-gray text-[10px] text-mc-muted capitalize">{l}</span>)}</div><div className="mt-4 pt-3 border-t border-mc-border flex items-center justify-between text-xs text-mc-muted"><span className="flex items-center gap-1.5"><Download size={13}/>{formatNumber(resource.downloads)}</span><span>Updated {formatDate(resource.updated)}</span></div></Link>
      <div className="px-4 pb-4"><a href={resource.downloadUrl || resource.url} target="_blank" rel="noopener noreferrer" className="project-download w-full justify-center"><Download size={14}/><span>{t.download}</span></a></div>
    </motion.article>
    {viewer && artwork && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={`${resource.title} image viewer`} onClick={() => setViewer(false)}><div className="gallery-lightbox-toolbar" onClick={e=>e.stopPropagation()}><span>{resource.title} <small>{gallery.length > 1 ? `· ${gallery.length} gallery images` : '· Preview'}</small></span><button onClick={()=>setZoom(z=>Math.max(.5,z-.25))} aria-label="Zoom out"><ZoomOut size={18}/></button><button onClick={()=>setZoom(1)} aria-label="Reset zoom"><RotateCcw size={17}/></button><button onClick={()=>setZoom(z=>Math.min(3,z+.25))} aria-label="Zoom in"><ZoomIn size={18}/></button><button onClick={()=>setViewer(false)} aria-label="Close viewer"><X size={20}/></button></div><div className="gallery-lightbox-stage" onClick={e=>e.stopPropagation()}><img src={artwork} alt={`${resource.title} full size`} style={{transform:`scale(${zoom})`}} onWheel={e=>{e.preventDefault();setZoom(z=>Math.max(.5,Math.min(3,z+(e.deltaY<0?.1:-.1))))}}/></div><div className="gallery-lightbox-bottom">Click outside to close · Use +/− to zoom · {Math.round(zoom*100)}%</div></div>}
  </>;
}
function SparkleDot(){return <span aria-hidden="true">✦</span>}
