import { useCallback, useEffect, useState } from 'react';
import { Activity, ExternalLink, Users, Server, RefreshCw, BarChart3, Clock3 } from 'lucide-react';
import { motion } from 'framer-motion';
import './BStatsAnalytics.css';

type Point = { timestamp: number; value: number };
type PluginMetric = { id: number; name: string; url: string; players: number | null; servers: number | null; playerHistory: Point[]; serverHistory: Point[]; error?: string | null };
type Payload = { fetchedAt: string; plugins: PluginMetric[] };
const PLUGINS = [
  { id: 34529, name: 'CostumeEnchant', url: 'https://bstats.org/plugin/bukkit/CostumeEnchant/34529' },
  { id: 34146, name: 'ClaimCore', url: 'https://bstats.org/plugin/bukkit/ClaimCore/34146' },
  { id: 34226, name: 'EcoSMP', url: 'https://bstats.org/plugin/bukkit/EcoSMP/34226' },
  { id: 34510, name: 'DonutSUS', url: 'https://bstats.org/plugin/bukkit/DonutSUS/34510' },
];
const fmt = (n: number | null) => n === null ? 'Unavailable' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
const fmtDate = (timestamp: number) => new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
function MiniChart({ points, label }: { points: Point[]; label: string }) {
  if (points.length < 2) return <div className="bstats-chart-empty">Historical trend appears when bStats provides enough samples.</div>;
  const values = points.map(p => p.value), min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const coords = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / range) * 23}`).join(' ');
  return <div className="bstats-trend"><div className="bstats-trend-head"><span>{label} trend</span><strong>{fmt(values[values.length - 1])}</strong></div><svg viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label={`${label} historical trend`}><polyline points={coords} fill="none" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" /></svg><div className="bstats-trend-foot"><span>{fmtDate(points[0].timestamp)}</span><span>{fmtDate(points[points.length - 1].timestamp)}</span></div></div>;
}
async function readSnapshot(): Promise<Payload> {
  const url = `${import.meta.env.BASE_URL}data/bstats.json?t=${Date.now()}`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Stats snapshot HTTP ${response.status}`);
  return response.json();
}
export function BStatsSection() {
  const [metrics, setMetrics] = useState<PluginMetric[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const load = useCallback(async () => {
    setRefreshing(true); setLoadError(false);
    try {
      const payload = await readSnapshot();
      const byId = new Map(payload.plugins.map(p => [p.id, p]));
      setMetrics(PLUGINS.map(p => byId.get(p.id) ?? { ...p, players: null, servers: null, playerHistory: [], serverHistory: [], error: 'Plugin missing from snapshot' }));
      setFetchedAt(payload.fetchedAt ?? null);
    } catch { setLoadError(true); setMetrics(PLUGINS.map(p => ({ ...p, players: null, servers: null, playerHistory: [], serverHistory: [], error: 'Snapshot unavailable' }))); }
    finally { setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const totalServers = metrics.some(m => m.servers !== null) ? metrics.reduce((sum, m) => sum + (m.servers ?? 0), 0) : null;
  const totalPlayers = metrics.some(m => m.players !== null) ? metrics.reduce((sum, m) => sum + (m.players ?? 0), 0) : null;
  return <section className="bstats-section max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div><div className="eyebrow"><Activity size={14} /> PUBLIC TELEMETRY</div><h2 className="section-heading">Plugin analytics<span>.</span></h2><p className="text-mc-muted mt-2 max-w-xl">Server adoption and player metrics from public bStats data, displayed here without leaving the portfolio.</p></div>
      <button type="button" onClick={() => void load()} disabled={refreshing} className="refresh-button"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing…' : 'Refresh stats'}</button>
    </motion.div>
    <div className="bstats-summary grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5"><div className="bstats-summary-card"><Server size={18}/><span>Tracked server metrics</span><strong>{fmt(totalServers)}</strong></div><div className="bstats-summary-card"><Users size={18}/><span>Tracked player metrics</span><strong>{fmt(totalPlayers)}</strong></div></div>
    {loadError && <p className="bstats-load-error">The saved stats snapshot could not be loaded. GitHub Actions may not have generated it yet.</p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((item, index) => <motion.article key={item.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .07 }} className="metric-card">
        <div className="flex items-start justify-between gap-3"><div className={`metric-mark mark-${index}`}>{item.name.slice(0, 2).toUpperCase()}</div><a href={item.url} target="_blank" rel="noreferrer" className="metric-external" aria-label={`Open ${item.name} bStats`}><ExternalLink size={15}/></a></div>
        <h3>{item.name}</h3><p className="metric-caption">Bukkit / Spigot metrics</p>
        <div className="metric-values"><div><Users size={14}/><strong>{refreshing && !metrics.length ? '…' : fmt(item.players)}</strong><span>Players</span></div><div><Server size={14}/><strong>{refreshing && !metrics.length ? '…' : fmt(item.servers)}</strong><span>Servers</span></div></div>
        <MiniChart points={item.serverHistory} label="Servers"/><MiniChart points={item.playerHistory} label="Players"/>
        <div className="bstats-status"><span className={`bstats-status-dot ${item.error ? 'is-error' : ''}`}/>{item.error ? 'Snapshot has no usable public data' : 'Public bStats snapshot'} <Clock3 size={12}/></div>
        <a className="metric-link" href={item.url} target="_blank" rel="noreferrer"><BarChart3 size={14}/> Official bStats page <span>↗</span></a>
      </motion.article>)}
    </div>
    <p className="text-xs text-mc-muted mt-4">{fetchedAt ? `Snapshot generated ${new Date(fetchedAt).toLocaleString()}. ` : ''}Stats are fetched by GitHub Actions to avoid browser CORS restrictions. Refresh reloads the latest published snapshot; scheduled deployments update the snapshot periodically. Totals may count the same server more than once.</p>
  </section>;
}
