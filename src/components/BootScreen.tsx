import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

/** Lightweight first-visit intro. The block is drawn in CSS (no GIF/image download). */
export function BootScreen() {
  const { language } = useLanguage();
  const copy = {
    en: { eyebrow: 'BUILT FOR YOUR NEXT IDEA', title: 'Need a hand with your next', titleAccent: 'Minecraft idea?', body: 'Explore useful plugins, smarter server tools, and ideas made to help your world run better.', footer: 'TOOLS · WORLDS · POSSIBILITIES', entering: 'WELCOME TO KINGBREZZ' },
    id: { eyebrow: 'DIBUAT UNTUK IDE BERIKUTNYA', title: 'Punya ide Minecraft', titleAccent: 'yang ingin diwujudkan?', body: 'Temukan plugin berguna, alat server yang lebih cerdas, dan ide untuk membantu duniamu berjalan lebih baik.', footer: 'ALAT · DUNIA · KEMUNGKINAN', entering: 'SELAMAT DATANG DI KINGBREZZ' },
    zh: { eyebrow: '为你的下一个创意而打造', title: '想实现你的下一个', titleAccent: 'Minecraft 创意吗？', body: '探索实用插件、更智能的服务器工具，以及让你的世界运行更好的创意。', footer: '工具 · 世界 · 无限可能', entering: '欢迎来到 KINGBREZZ' },
    nl: { eyebrow: 'GEMAAKT VOOR JE VOLGENDE IDEE', title: 'Hulp nodig bij je volgende', titleAccent: 'Minecraft-idee?', body: 'Ontdek handige plugins, slimmere servertools en ideeën om je wereld beter te laten draaien.', footer: 'TOOLS · WERELDEN · MOGELIJKHEDEN', entering: 'WELKOM BIJ KINGBREZZ' },
  }[language];
  return (
    <motion.section className="boot-screen" role="status" aria-label="Welcome to CubeNest"
      initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="boot-stars" aria-hidden="true" />
      <div className="boot-aurora boot-aurora-a" aria-hidden="true" />
      <div className="boot-aurora boot-aurora-b" aria-hidden="true" />
      <div className="boot-content">
        <div className="boot-brand"><span className="boot-brand-mark">K</span><span>CubeNest</span><span className="boot-online"><i /> ONLINE</span></div>
        <div className="dirt-stage" aria-hidden="true">
          <div className="dirt-cube">
            <div className="dirt-face dirt-top"><span /></div>
            <div className="dirt-face dirt-front"><span /></div>
            <div className="dirt-face dirt-side"><span /></div>
          </div>
          <div className="dirt-shadow" />
          <div className="dirt-orbit dirt-orbit-one" /><div className="dirt-orbit dirt-orbit-two" />
          <span className="dirt-spark dirt-spark-one">✦</span><span className="dirt-spark dirt-spark-two">✧</span>
        </div>
        <div className="boot-copy">
          <div className="boot-eyebrow"><Sparkles size={13} /> {copy.eyebrow}</div>
          <h1>{copy.title}<br/><span>{copy.titleAccent}</span></h1>
          <p>{copy.body}</p>
        </div>
        <div className="boot-progress" aria-hidden="true"><span /></div>
        <div className="boot-footer"><span>{copy.footer}</span><span>{copy.entering} <ArrowUpRight size={12}/></span></div>
      </div>
    </motion.section>
  );
}
