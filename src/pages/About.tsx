import { motion } from 'framer-motion';
import { Code2, Server, Shield, Wrench, Target, Boxes, HeartHandshake, ArrowUpRight, Orbit } from 'lucide-react';

export function About() {
  const principles = [
    { icon: Target, title: 'Purpose before features', desc: 'Every feature should solve a real server-owner or player problem, not just inflate a changelog.' },
    { icon: Boxes, title: 'Built for real servers', desc: 'Configuration, compatibility, data safety, and clear failure states matter as much as the happy path.' },
    { icon: Shield, title: 'Security-minded design', desc: 'Protection systems focus on predictable behavior, careful validation, and minimizing false positives.' },
    { icon: HeartHandshake, title: 'Clear communication', desc: 'Release notes and support should be honest about what passed, what is untested, and what is unsupported.' },
  ];
  const focus = [
    { icon: Code2, title: 'Plugin engineering', desc: 'Java plugins for Paper, Spigot, Purpur, and Folia with configurable behavior and maintainable code.' },
    { icon: Server, title: 'SMP systems', desc: 'Economy, claims, custom enchantments, utilities, automation, and gameplay features.' },
    { icon: Shield, title: 'Server protection', desc: 'Anti-dupe, anti-freecam, detection, and abuse-prevention tools designed for multiplayer environments.' },
    { icon: Wrench, title: 'Operations & performance', desc: 'Monitoring, cleanup, restart workflows, compatibility testing, and practical diagnostics.' },
  ];
  return <div className="pt-24 pb-20 min-h-screen mc-grid-bg">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="about-hero">
        <div className="about-cosmic-layout">
          <div className="about-cosmic-copy">
            <div className="eyebrow"><Orbit size={13}/> THE PERSON BEHIND THE PLUGINS</div>
            <h1 className="section-heading about-title">I build tools that make<br className="hidden sm:block"/> Minecraft servers <span>better.</span></h1>
            <p className="about-lead">I’m <strong>KingBrezz</strong>, an independent developer creating Minecraft plugins and tools for the people who run and play on servers. I enjoy turning ideas into useful systems — from gameplay and economy features to protection, automation, and performance utilities.</p>
            <p className="about-lead about-lead-small">My goal is simple: make server administration smoother, give communities better tools, and keep releases honest about compatibility, testing, and limitations.</p>
          </div>
          <div className="globe-stage" role="img" aria-label="Animated three-dimensional digital globe representing the connected Minecraft development ecosystem">
            <div className="globe-starfield"/><div className="globe-orbit globe-orbit-one"/><div className="globe-orbit globe-orbit-two"/>
            <div className="globe-sphere"><div className="globe-longitude globe-longitude-a"/><div className="globe-longitude globe-longitude-b"/><div className="globe-latitude globe-latitude-a"/><div className="globe-latitude globe-latitude-b"/><div className="globe-land globe-land-one"/><div className="globe-land globe-land-two"/><div className="globe-land globe-land-three"/><div className="globe-glint"/></div>
            <span className="globe-tag globe-tag-one">PLUGINS</span><span className="globe-tag globe-tag-two">COMMUNITY</span><span className="globe-tag globe-tag-three">IDEAS → CODE</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-7">
          <a className="profile-link" href="https://modrinth.com/user/KingBrezz" target="_blank" rel="noreferrer">Modrinth <ArrowUpRight size={15}/></a>
          <a className="profile-link" href="https://www.spigotmc.org/resources/authors/brezz.2530124/" target="_blank" rel="noreferrer">SpigotMC <ArrowUpRight size={15}/></a>
        </div>
      </motion.section>
      <motion.section initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="about-story mt-12">
        <div><div className="eyebrow">MY APPROACH</div><h2 className="text-2xl font-bold text-mc-white mt-3">Useful software, not just more software.</h2></div>
        <div className="about-copy"><p>I work across the full plugin lifecycle: shaping an idea, implementing it, testing compatibility, documenting configuration, and preparing releases that server owners can actually operate.</p><p>I care about the details that often get overlooked — sensible defaults, safe data handling, clear messages, predictable performance, and being transparent about testing status. A feature is only useful when it behaves correctly in a live server environment.</p></div>
      </motion.section>
      <section className="mt-16"><div className="eyebrow">AREAS OF WORK</div><h2 className="text-2xl font-bold text-mc-white mt-2 mb-6">What I work on</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{focus.map((item, i) => <motion.article key={item.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .06 }} className="about-card"><item.icon className="w-5 h-5 text-mc-red mb-4"/><h3>{item.title}</h3><p>{item.desc}</p></motion.article>)}</div></section>
      <section className="mt-16"><div className="eyebrow">ENGINEERING PRINCIPLES</div><h2 className="text-2xl font-bold text-mc-white mt-2 mb-6">What matters to me</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{principles.map((item, i) => <motion.article key={item.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .05 }} className="principle-card"><item.icon className="w-5 h-5 text-mc-red mb-3"/><h3>{item.title}</h3><p>{item.desc}</p></motion.article>)}</div></section>
    </div>
  </div>;
}
