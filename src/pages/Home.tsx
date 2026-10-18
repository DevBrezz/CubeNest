import { Link } from 'react-router-dom';
import { ArrowUpRight, Blocks, Compass, PackageOpen, Server, ShieldCheck, Sparkles, Images, MessageCircle, Flag, Mail, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const portals = [
  { to: '/servers', number: '01', icon: Server, title: 'Server Hub', description: 'Temukan server Java dan Bedrock berdasarkan versi, mode permainan, dan komunitas.', tags: ['Java + Bedrock', 'Server discovery'], art: 'portal-server' },
  { to: '/resources', number: '02', icon: Blocks, title: 'Mods & Resources', description: 'Jelajahi mod, texture pack, shader, addon, dan karya kreator Minecraft.', tags: ['Modrinth', 'Creator resources'], art: 'portal-resources' },
  { to: '/plugins', number: '03', icon: PackageOpen, title: 'Plugin Center', description: 'Cari plugin Paper, Spigot, dan Bukkit dengan info kompatibilitas yang jelas.', tags: ['Paper', 'Spigot', 'Bukkit'], art: 'portal-plugins' },
];
const support = [
  { to: '/contact', icon: Mail, title: 'Contact', desc: 'Hubungi tim CubeNest untuk pertanyaan dan kerja sama.' },
  { to: '/report', icon: Flag, title: 'Report a resource', desc: 'Laporkan dugaan pencurian resource, texture, mod, atau plugin.' },
  { to: '/about', icon: MessageCircle, title: 'Community & Discord', desc: 'Tetap terhubung dengan komunitas dan pembaruan platform.' },
];

export function Home() {
  return <div className="cn-page cn-home cn-ultra-home">
    <section className="cn-hero cn-ultra-hero">
      <div className="cn-hero-grid" aria-hidden="true" />
      <div className="cn-hero-copy">
        <motion.span className="cn-eyebrow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}><Sparkles size={14}/> THE MINECRAFT COMMUNITY, CONNECTED</motion.span>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .06 }}>Your next world<br/>starts <span>here.</span></motion.h1>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .14 }}>Discover incredible servers, explore creator-made resources, and find the right tools to build your next Minecraft experience.</motion.p>
        <motion.div className="cn-hero-actions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .22 }}><Link to="/resources" className="cn-btn cn-btn-primary">Explore resources <ArrowUpRight size={17}/></Link><Link to="/servers" className="cn-btn cn-btn-ghost"><Compass size={17}/> Find a server</Link></motion.div>
        <div className="cn-trust-note"><ShieldCheck size={15}/> Creator-focused discovery · Clear resource details · No fabricated server stats</div>
      </div>
      <motion.div className="cn-hero-art cn-ultra-art" aria-label="Voxel-inspired Minecraft landscape" role="img" initial={{ opacity: 0, scale: .96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .8, delay: .12 }}><div className="cn-moon"/><div className="cn-cloud cn-cloud-a"/><div className="cn-cloud cn-cloud-b"/><div className="cn-mountain cn-mountain-back"/><div className="cn-mountain cn-mountain-mid"/><div className="cn-mountain cn-mountain-front"/><div className="cn-cube cn-cube-a"/><div className="cn-cube cn-cube-b"/><div className="cn-cube cn-cube-c"/><div className="cn-art-caption"><span className="cn-live-dot"/> A bigger world awaits <span>↗</span></div><div className="cn-floating-chip cn-chip-one"><Zap size={14}/> Made for creators</div><div className="cn-floating-chip cn-chip-two"><Images size={14}/> Visual galleries</div></motion.div>
    </section>

    <section className="cn-portals-section cn-ultra-section">
      <div className="cn-section-heading"><div><span className="cn-eyebrow">PICK YOUR ADVENTURE</span><h2>One hub. <span>Endless possibilities.</span></h2></div><p>Clean discovery, helpful details, and creator resources in one place.</p></div>
      <div className="cn-portals">{portals.map((p, i) => <motion.div key={p.to} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: .55, delay: i * .09 }}><Link to={p.to} className={`cn-portal ${p.art}`}><div className="cn-portal-top"><span>{p.number} / PORTAL</span><span className="cn-portal-icon"><p.icon size={22}/></span></div><div className="cn-portal-content"><h3>{p.title}</h3><p>{p.description}</p><div className="cn-tags">{p.tags.map(t => <span key={t}>{t}</span>)}</div></div><div className="cn-portal-bottom"><span>Explore section</span><span className="cn-circle-arrow"><ArrowUpRight size={18}/></span></div></Link></motion.div>)}</div>
    </section>

    <section className="cn-ultra-feature-strip"><div className="cn-feature-mark"><Images size={22}/></div><div className="cn-feature-copy"><span className="cn-eyebrow">BUILT FOR DISCOVERY</span><h2>See the project before you download.</h2><p>Resource cards can show project artwork, creator descriptions, platform badges, and time-limited NEW or UPDATED labels. Open a gallery to zoom in on screenshots.</p></div><Link to="/projects" className="cn-btn cn-btn-ghost">Browse projects <ArrowUpRight size={16}/></Link></section>

    <section className="cn-ultra-support"><div className="cn-section-heading"><div><span className="cn-eyebrow">HERE WHEN YOU NEED US</span><h2>Community, contact & trust.</h2></div><p>Keep the community connected and make it easier to report suspected stolen work.</p></div><div className="cn-support-grid">{support.map((item, i) => <motion.div key={item.to} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .07 }}><Link to={item.to} className="cn-support-card"><span className="cn-support-icon"><item.icon size={20}/></span><span className="cn-support-copy"><strong>{item.title}</strong><small>{item.desc}</small></span><ArrowUpRight size={17} className="cn-support-arrow"/></Link></motion.div>)}</div></section>

    <section className="cn-publish-strip cn-ultra-publish"><div className="cn-publish-icon"><PackageOpen size={24}/></div><div><span className="cn-eyebrow">MADE SOMETHING COOL?</span><h2>Share your work with the community.</h2><p>Submit resource information for review. Public uploads need a secure backend and moderation before they can be accepted.</p></div><Link to="/upload" className="cn-btn cn-btn-primary">Submit a resource <ArrowUpRight size={16}/></Link></section>
    <section className="cn-home-footnote"><span>BUILT FOR MINECRAFT COMMUNITIES</span><span>Java Edition · Bedrock Edition · Server owners · Creators</span></section>
  </div>;
}
