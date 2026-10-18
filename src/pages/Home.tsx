import { Link } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Blocks, Compass, Globe2, Images,
  Mail, MessageCircle, PackageOpen, Server, ShieldCheck, Sparkles, Flag, Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

const portals = [
  { to: '/servers', number: '01', icon: Server, title: 'Server Hub', description: 'Temukan server Java dan Bedrock berdasarkan versi, mode permainan, dan komunitas.', tags: ['JAVA + BEDROCK', 'SERVER DISCOVERY'], art: 'earth-portal-server' },
  { to: '/resources', number: '02', icon: Blocks, title: 'Mods & Resources', description: 'Jelajahi mod, texture pack, shader, addon, dan karya kreator Minecraft.', tags: ['MODRINTH', 'CREATOR RESOURCES'], art: 'earth-portal-resource' },
  { to: '/plugins', number: '03', icon: PackageOpen, title: 'Plugin Center', description: 'Cari plugin Paper, Spigot, dan Bukkit dengan informasi yang jelas.', tags: ['PAPER', 'SPIGOT', 'BUKKIT'], art: 'earth-portal-plugin' },
];

const support = [
  { to: '/about', icon: MessageCircle, title: 'Community & Discord', desc: 'Terhubung dengan komunitas dan ikuti kabar terbaru CubeNest.' },
  { to: '/contact', icon: Mail, title: 'Contact', desc: 'Hubungi tim CubeNest untuk pertanyaan atau kerja sama.' },
  { to: '/report', icon: Flag, title: 'Report resource theft', desc: 'Laporkan dugaan pencurian texture, mod, plugin, atau karya kreator.' },
];

function EarthGlobe() {
  return (
    <div className="earth-scene" aria-label="Ilustrasi planet Bumi tiga dimensi yang berputar di luar angkasa" role="img">
      <div className="earth-starfield earth-stars-back" />
      <div className="earth-starfield earth-stars-front" />
      <div className="earth-nebula earth-nebula-a" />
      <div className="earth-nebula earth-nebula-b" />
      <div className="earth-orbit earth-orbit-a"><span /></div>
      <div className="earth-orbit earth-orbit-b"><span /></div>
      <div className="earth-globe-wrap">
        <div className="earth-halo" />
        <div className="earth-globe">
          <div className="earth-map">
            <svg viewBox="0 0 720 360" aria-hidden="true" preserveAspectRatio="none">
              <defs>
                <linearGradient id="earthLand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a6edb1"/><stop offset=".55" stopColor="#42a978"/><stop offset="1" stopColor="#176a61"/></linearGradient>
              </defs>
              <g fill="url(#earthLand)" stroke="#b9ffd0" strokeOpacity=".2" strokeWidth="1.2">
                <path d="M68 67l22-17 28 5 13 15 26 2 12 18-8 16-22 4-7 17-20 4-8 24-18 5-5-19-15-7-7-25-17-8-4-20 13-14z M151 155l17 8 10 20-3 25-13 18-5 31-14 22-13-9 4-26-12-23 6-23-8-15 11-19z M212 67l22-12 21 8 9 17-16 12-20-2-12-9z M300 77l24-17 27 4 17 14 29-5 24 12 26-4 20 15 26-3 22 16-5 18-26 5-10 19-22 4-9 17-19-2-9-15-19-4-7-19-17-7-5-17-21-4-7-15-22-2-11-12-17 2z M351 161l18 4 14 20-3 29-15 19-8 32-15 16-13-14 4-28-8-19 6-23-5-17z M455 205l23-10 19 9 7 19-17 14-25-7z M548 78l20-12 23 8 10 19-17 12-23-7z M591 145l18-8 17 11-5 16-20 5z" />
                <path d="M24 35l9-7 12 4-2 10-13 4z M249 29l13-8 17 5 5 12-14 8-17-5z M427 45l12-7 13 5-3 10-14 2z M637 246l13-8 12 8-3 13-15 2z" opacity=".72"/>
              </g>
              <g fill="none" stroke="#d0f7ff" strokeOpacity=".2" strokeWidth="1">
                <path d="M0 90H720M0 180H720M0 270H720M90 0V360M180 0V360M270 0V360M360 0V360M450 0V360M540 0V360M630 0V360" />
              </g>
            </svg>
          </div>
          <div className="earth-clouds" />
          <div className="earth-atmosphere" />
          <div className="earth-shade" />
          <div className="earth-glint" />
        </div>
      </div>
      <div className="earth-label earth-label-one"><span className="earth-label-dot" /> CUBENEST NETWORK <b>01</b></div>
      <div className="earth-label earth-label-two"><Globe2 size={13} /> ONE COMMUNITY</div>
      <div className="earth-coordinate">40° 43′ N&nbsp; / &nbsp;73° 59′ W<br/><span>DISCOVER SOMETHING NEW</span></div>
      <div className="earth-bottom-glow" />
    </div>
  );
}

export function Home() {
  return <div className="cn-page cn-home earth-home">
    <section className="earth-hero">
      <div className="earth-cosmic-bg" aria-hidden="true" />
      <div className="earth-hero-inner">
        <motion.div className="earth-hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .85, ease: [0.22, 1, 0.36, 1] }}>
          <div className="earth-eyebrow"><span className="earth-eyebrow-pulse"/><Sparkles size={14}/> YOUR MINECRAFT UNIVERSE</div>
          <h1>Find your next<br/> <span>world to explore.</span></h1>
          <p className="earth-hero-lead">A better place to discover Minecraft servers, creator-made mods, texture packs, and plugins — all in one connected universe.</p>
          <div className="earth-hero-actions">
            <Link to="/resources" className="earth-button earth-button-primary">Explore resources <ArrowUpRight size={17}/></Link>
            <Link to="/servers" className="earth-button earth-button-glass"><Compass size={17}/> Find a server</Link>
          </div>
          <div className="earth-trust-row"><ShieldCheck size={15}/><span>Creator-focused</span><i/> <span>Clear project details</span><i/> <span>Community first</span></div>
          <a href="#explore" className="earth-scroll-cue"><span>SCROLL TO EXPLORE</span><ArrowDown size={14}/></a>
        </motion.div>
        <motion.div className="earth-hero-visual" initial={{ opacity: 0, scale: .92, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 1.05, delay: .1, ease: [0.22, 1, 0.36, 1] }}>
          <EarthGlobe />
        </motion.div>
      </div>
      <div className="earth-hero-footer"><span><b>01</b> / DISCOVER</span><span>BUILT FOR THE MINECRAFT COMMUNITY</span><span>JAVA · BEDROCK · CREATORS</span></div>
    </section>

    <section className="earth-portals-section" id="explore">
      <div className="earth-section-top"><div><span className="earth-section-kicker">YOUR JOURNEY STARTS HERE</span><h2>One universe.<br/><span>More ways to play.</span></h2></div><p>Explore a world of community-made content, carefully presented with the details that matter.</p></div>
      <div className="earth-portals-grid">{portals.map((p, i) => <motion.div key={p.to} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: .65, delay: i * .1, ease: [0.22, 1, 0.36, 1] }}><Link to={p.to} className={`earth-portal ${p.art}`}><div className="earth-portal-art"><div className="earth-portal-orb"><p.icon size={34}/></div><span className="earth-portal-index">{p.number} / EXPLORE</span><span className="earth-portal-arrow"><ArrowUpRight size={19}/></span></div><div className="earth-portal-content"><div className="earth-tags">{p.tags.map(t => <span key={t}>{t}</span>)}</div><h3>{p.title}</h3><p>{p.description}</p><div className="earth-portal-link">Explore section <ArrowRight size={15}/></div></div></Link></motion.div>)}</div>
    </section>

    <section className="earth-showcase-strip"><div className="earth-showcase-icon"><Images size={23}/></div><div className="earth-showcase-copy"><span className="earth-section-kicker">SEE IT BEFORE YOU DOWNLOAD</span><h2>Projects deserve the spotlight.</h2><p>Artwork, creator descriptions, platform logos, and clear NEW or UPDATED labels — with image galleries you can zoom into.</p></div><Link to="/projects" className="earth-button earth-button-glass">Browse projects <ArrowUpRight size={16}/></Link><div className="earth-showcase-orbit" aria-hidden="true"/></section>

    <section className="earth-community-section"><div className="earth-section-top"><div><span className="earth-section-kicker">GOOD COMMUNITIES BUILD TOGETHER</span><h2>Stay connected.<br/><span>Keep creativity fair.</span></h2></div><p>Questions, community updates, or a concern about stolen work? Find the right place to reach us.</p></div><div className="earth-support-grid">{support.map((item, i) => <motion.div key={item.to} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .5, delay: i * .08 }}><Link to={item.to} className="earth-support-card"><span className="earth-support-icon"><item.icon size={20}/></span><span className="earth-support-copy"><strong>{item.title}</strong><small>{item.desc}</small></span><ArrowUpRight className="earth-support-arrow" size={18}/></Link></motion.div>)}</div></section>

    <section className="earth-publish-strip"><div className="earth-publish-orb"><PackageOpen size={24}/></div><div><span className="earth-section-kicker">MADE SOMETHING AWESOME?</span><h2>Bring your creation into orbit.</h2><p>Share project details for review. Public submissions require secure processing and moderation.</p></div><Link to="/upload" className="earth-button earth-button-primary">Submit a resource <ArrowUpRight size={16}/></Link></section>
    <div className="earth-home-foot"><span><Zap size={13}/> BUILT FOR MINECRAFT COMMUNITIES</span><span>JAVA EDITION · BEDROCK EDITION · CREATORS</span></div>
  </div>;
        }
      
