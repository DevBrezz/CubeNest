import { Link } from 'react-router-dom';
import { ArrowUpRight, Blocks, Compass, PackageOpen, Server, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const portals = [
  { to: '/servers', number: '01', icon: Server, title: 'Server Hub', description: 'Discover Minecraft servers by edition, version, and the way you like to play.', tags: ['Java + Bedrock', 'Game modes'], art: 'portal-server' },
  { to: '/resources', number: '02', icon: Blocks, title: 'Mods & Resources', description: 'Find mods, texture packs, shaders, addons, and skins for your next world.', tags: ['Java + Bedrock', 'Creator resources'], art: 'portal-resources' },
  { to: '/plugins', number: '03', icon: PackageOpen, title: 'Plugin Center', description: 'Explore server plugins and check platform compatibility before downloading.', tags: ['Paper', 'Spigot', 'Bukkit'], art: 'portal-plugins' },
];

export function Home() {
  return <div className="cn-page cn-home">
    <section className="cn-hero">
      <div className="cn-hero-grid" aria-hidden="true" />
      <div className="cn-hero-copy">
        <span className="cn-eyebrow"><Sparkles size={14}/> THE COMMUNITY-POWERED MINECRAFT PLATFORM</span>
        <h1>Your next world<br/>starts <span>here.</span></h1>
        <p>One place to discover servers, find trusted resources, and level up your Minecraft server with plugins built for your platform.</p>
        <div className="cn-hero-actions"><Link to="/resources" className="cn-btn cn-btn-primary">Explore resources <ArrowUpRight size={17}/></Link><Link to="/servers" className="cn-btn cn-btn-ghost"><Compass size={17}/> Find a server</Link></div>
        <div className="cn-trust-note"><ShieldCheck size={15}/> Compatibility first. Transparent resource information. No invented server stats.</div>
      </div>
      <div className="cn-hero-art" aria-label="Voxel-inspired Minecraft landscape illustration" role="img"><div className="cn-moon"/><div className="cn-cloud cn-cloud-a"/><div className="cn-cloud cn-cloud-b"/><div className="cn-mountain cn-mountain-back"/><div className="cn-mountain cn-mountain-mid"/><div className="cn-mountain cn-mountain-front"/><div className="cn-cube cn-cube-a"/><div className="cn-cube cn-cube-b"/><div className="cn-cube cn-cube-c"/><div className="cn-art-caption"><span className="cn-live-dot"/> A bigger world awaits <span>↗</span></div></div>
    </section>
    <section className="cn-portals-section">
      <div className="cn-section-heading"><div><span className="cn-eyebrow">PICK YOUR ADVENTURE</span><h2>Three ways to play more.</h2></div><p>Everything you need, organized around what you're looking for.</p></div>
      <div className="cn-portals">{portals.map((p, i) => <motion.div key={p.to} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }}><Link to={p.to} className={`cn-portal ${p.art}`}><div className="cn-portal-top"><span>{p.number} / PORTAL</span><span className="cn-portal-icon"><p.icon size={22}/></span></div><div className="cn-portal-content"><h3>{p.title}</h3><p>{p.description}</p><div className="cn-tags">{p.tags.map(t => <span key={t}>{t}</span>)}</div></div><div className="cn-portal-bottom"><span>Explore section</span><span className="cn-circle-arrow"><ArrowUpRight size={18}/></span></div></Link></motion.div>)}</div>
    </section>
    <section className="cn-publish-strip"><div className="cn-publish-icon"><PackageOpen size={24}/></div><div><span className="cn-eyebrow">MADE SOMETHING COOL?</span><h2>Share it with the community.</h2><p>Submit your resource for review. Approved submissions can become part of the CubeNest catalogue.</p></div><Link to="/upload" className="cn-btn cn-btn-primary">Upload a resource <ArrowUpRight size={16}/></Link></section>
    <section className="cn-home-footnote"><span>BUILT FOR MINECRAFT COMMUNITIES</span><span>Java Edition · Bedrock Edition · Server owners · Creators</span></section>
  </div>;
}
