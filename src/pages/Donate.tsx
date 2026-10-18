import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Coins, ScanLine, ShieldCheck, Wrench, Bug, Server } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

const qr = 'https://i.imgur.com/MKH5OYh.png';
export function Donate() {
  const { t } = useLanguage();
  return <main className="donate-page">
    <div className="donate-glow" aria-hidden="true" />
    <div className="donate-wrap">
      <Link to="/" className="donate-back"><ArrowLeft size={16}/> {t.home}</Link>
      <motion.section className="donate-hero" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.45}}>
        <div className="donate-copy"><div className="eyebrow"><Heart size={14}/> KINGBREZZ COMMUNITY SUPPORT</div><h1>{t.donateTitle}</h1><p>{t.donateText}</p><div className="donate-trust"><ShieldCheck size={17}/><span>Voluntary support · Transparent purpose · Thank you</span></div></div>
        <div className="donate-coin-stage" aria-label="Animated gold coin"><div className="coin-halo"/><motion.div className="gold-coin" animate={{rotateY:[0,180,360], rotateZ:[0,4,0,-4,0], y:[0,-7,0]}} transition={{rotateY:{duration:4.8,repeat:Infinity,ease:'linear'},rotateZ:{duration:3.5,repeat:Infinity,ease:'easeInOut'},y:{duration:2.4,repeat:Infinity,ease:'easeInOut'}}}><div className="coin-rim"><div className="coin-face"><span className="coin-mark">K</span><span className="coin-stars">✦ · ✦</span></div></div></motion.div><div className="coin-shadow"/></div>
      </motion.section>
      <section className="donate-grid">
        <motion.div className="donate-qr-card" initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
          <div className="donate-qr-head"><span className="scan-chip"><ScanLine size={15}/> {t.scanMe}</span><span className="donate-online-dot">● ONLINE</span></div>
          <a href={qr} target="_blank" rel="noreferrer" className="donate-qr-link" aria-label="Open QR code image in a new tab"><img src={qr} alt="Donation QR code — scan with a compatible payment app" loading="lazy"/><span className="qr-open-hint">Open full-size ↗</span></a>
          <h2>{t.scanMe}</h2><p>{t.qrHint}</p><a className="donate-open-link" href={qr} target="_blank" rel="noreferrer">Open QR image <span>↗</span></a>
        </motion.div>
        <motion.div className="donate-benefits" initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-40px'}} transition={{delay:.08}}>
          <div className="eyebrow">{t.support}</div><h2>Every little bit helps.</h2>
          <div className="support-row"><span><Wrench size={19}/></span><div><strong>{t.supportBuild}</strong><p>More time to create useful tools and maintain releases.</p></div></div>
          <div className="support-row"><span><Bug size={19}/></span><div><strong>{t.supportTest}</strong><p>Better compatibility checks and quicker issue investigation.</p></div></div>
          <div className="support-row"><span><Server size={19}/></span><div><strong>{t.supportHost}</strong><p>Infrastructure and software used to build and publish projects.</p></div></div>
          <div className="donate-thanks"><Coins size={18}/><p>No pressure to donate. Using the plugins, sharing feedback, and reporting bugs also support the project.</p></div>
        </motion.div>
      </section>
      <p className="donate-footer-note">KingBrezz · Built with the community, one release at a time.</p>
    </div>
  </main>;
}
