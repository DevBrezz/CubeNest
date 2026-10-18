import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Trophy, Zap } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
export function XPRoom(){const {t}=useLanguage();return <main className="xp-page mc-grid-bg"><motion.section initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="xp-room"><div className="xp-emblem"><Trophy size={48}/><Sparkles className="xp-spark spark-one"/><Sparkles className="xp-spark spark-two"/></div><div className="eyebrow">SECRET AREA · 0xXP</div><h1>{t.easterTitle}</h1><p>{t.easterText}</p><div className="xp-reward"><Zap size={20}/> XP <strong>+1</strong></div><p className="xp-small">Achievement unlocked: Curious Explorer</p><Link to="/" className="secondary-cta"><ArrowLeft size={16}/> Back to portfolio</Link></motion.section></main>}
