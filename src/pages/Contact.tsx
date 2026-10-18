import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ExternalLink, Mail, ArrowUpRight, ShieldCheck, MessageCircle, PhoneCall } from 'lucide-react';
import { copyToClipboard } from '../lib/utils';

const DISCORD_INVITE = 'https://discord.gg/wzBqRXWp';
const DISCORD_LOGO = 'https://i.imgur.com/e0dQjuB.png';

export function Contact() {
  const [copied, setCopied] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const discord = '@Brezzz';

  const handleCopy = async () => {
    const ok = await copyToClipboard(discord);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="contact-galaxy relative min-h-screen overflow-hidden pt-28 pb-20">
      <div className="contact-stars contact-stars-a" aria-hidden="true" />
      <div className="contact-stars contact-stars-b" aria-hidden="true" />
      <div className="contact-nebula contact-nebula-one" aria-hidden="true" />
      <div className="contact-nebula contact-nebula-two" aria-hidden="true" />
      <div className="contact-orbit contact-orbit-one" aria-hidden="true" />
      <div className="contact-orbit contact-orbit-two" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <motion.header
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <div className="contact-eyebrow mx-auto mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
            <span className="contact-status-dot" /> Open channel · Contact <span className="contact-phone-mini" aria-hidden="true"><PhoneCall size={13}/></span>
          </div>
          <h1 className="contact-heading text-5xl font-black tracking-tight sm:text-7xl">
            Let&apos;s build <span>something great.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Have a plugin idea, found a bug, or want to collaborate? Send a message and let&apos;s make it happen.
          </p>
        </motion.header>

        <motion.a
          href={DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join the KingBrezz Discord server"
          initial={{ opacity: 0, y: 28, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.12, ease: 'easeOut' }}
          whileHover={{ y: -5, scale: 1.006 }}
          whileTap={{ scale: 0.99 }}
          className="discord-hero group mx-auto block max-w-5xl rounded-[2rem] p-5 sm:p-8 lg:p-10"
        >
          <div className="discord-hero-grid">
            <div className="discord-logo-panel">
              {!logoFailed ? (
                <img
                  src={DISCORD_LOGO}
                  alt="Discord logo"
                  loading="lazy"
                  decoding="async"
                  onError={() => setLogoFailed(true)}
                  className="discord-wordmark"
                />
              ) : (
                <div className="discord-wordmark-fallback"><MessageCircle size={46} /> <span>Discord</span></div>
              )}
              <div className="discord-logo-caption">KINGBREZZ COMMUNITY</div>
            </div>

            <div className="discord-hero-copy">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="discord-pill"><span className="contact-status-dot" /> Community invite</span>
                <span className="discord-pill discord-pill-muted">Official contact hub</span>
              </div>
              <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">Join the conversation.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Connect with KingBrezz, discuss Minecraft projects, share feedback, and get in touch through Discord.
              </p>
              <div className="discord-join-cta mt-6 inline-flex items-center gap-3 rounded-xl px-5 py-3.5 font-bold">
                Join Discord <ArrowUpRight size={19} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </div>
            <div className="discord-hero-orb" aria-hidden="true"><MessageCircle size={34} /></div>
            <div className="contact-phone-orb" aria-hidden="true"><span className="contact-phone-ring"/><PhoneCall size={21}/><span className="contact-phone-signal">LIVE</span></div>
          </div>
          <div className="discord-card-footer"><span>discord.gg/wzBqRXWp</span><span>Opens Discord invite <ExternalLink size={13} /></span></div>
        </motion.a>

        <div className="mx-auto mt-7 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="contact-info-card">
            <div className="contact-info-icon"><Copy size={19} /></div>
            <h3>Direct username</h3>
            <p>Prefer adding me directly? Copy my Discord username.</p>
            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 p-3">
              <code className="font-mono font-semibold text-white">{discord}</code>
              <button type="button" onClick={handleCopy} className="contact-copy-btn" aria-label="Copy Discord username">
                {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </motion.section>

          <a href="https://modrinth.com/user/KingBrezz" target="_blank" rel="noopener noreferrer" className="contact-info-card contact-link-card">
            <div className="contact-info-icon contact-icon-green"><ExternalLink size={19} /></div>
            <h3>Modrinth</h3>
            <p>Explore my Minecraft plugins, releases, and project updates.</p>
            <span className="contact-card-link">View creator profile <ArrowUpRight size={15} /></span>
          </a>

          <a href="https://www.spigotmc.org/resources/authors/brezz.2530124/" target="_blank" rel="noopener noreferrer" className="contact-info-card contact-link-card">
            <div className="contact-info-icon contact-icon-blue"><ShieldCheck size={19} /></div>
            <h3>SpigotMC</h3>
            <p>Find my Bukkit and Paper plugins on SpigotMC.</p>
            <span className="contact-card-link">View author page <ArrowUpRight size={15} /></span>
          </a>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="contact-bottom-note mx-auto mt-8 flex max-w-5xl items-center justify-center gap-2 text-center text-xs sm:text-sm">
          <Mail size={15} /> For bug reports, include the plugin version, server version, and steps to reproduce the issue.
        </motion.div>
      </div>
    </div>
  );
}
