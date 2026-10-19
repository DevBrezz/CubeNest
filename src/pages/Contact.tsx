import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, Bug, HelpCircle, Send, Clock3, ShieldCheck, ExternalLink, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'cubenestteam@gmail.com';
const CREEPER_IMAGE = 'https://i.imgur.com/OCpX4H3.jpeg';

export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fullSubject = `[CubeNest Contact] ${subject.trim()}`;
    const body = `Hi CubeNest Team,\n\n${message.trim()}\n\n---\nName: ${name.trim()}\nReply email: ${email.trim()}\nSent from: CubeNest Contact page`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}&su=${encodeURIComponent(fullSubject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  }

  return (
    <div className="min-h-screen mc-grid-bg px-4 pb-16 pt-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-sky-400">We’re here to help</p>
          <h1 className="text-3xl font-black tracking-tight text-mc-white sm:text-4xl">Contact <span className="text-sky-400">CubeNest</span></h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-mc-muted sm:text-base">Got a question, idea, or found something that needs fixing? Send a message to our team. We’ll help you find the right next step.</p>
        </motion.div>

        <div className="grid items-stretch gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-mc-border bg-mc-surface/90 p-5 shadow-xl sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-sky-500/15 p-3 text-sky-400"><Mail className="h-6 w-6" /></div>
              <div><h2 className="text-xl font-bold text-mc-white">Send us a message</h2><p className="mt-1 text-xs text-mc-muted">Opens Gmail with your message filled in.</p></div>
            </div>

            <button type="button" onClick={copyEmail} className="mb-6 flex w-full items-center gap-3 rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-violet-500/10 p-4 text-left transition hover:border-sky-400/60">
              <div className="rounded-lg bg-white/10 p-2 text-sky-300"><Mail className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1"><p className="text-xs text-mc-muted">Contact email</p><p className="break-all font-semibold text-mc-white">{CONTACT_EMAIL}</p><p className="mt-1 text-xs text-mc-muted">Tap to copy the address</p></div>
              {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5 text-sky-300" />}
            </button>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-mc-muted">Name
                  <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-2 w-full rounded-lg border border-mc-border bg-black/20 px-3 py-3 text-sm text-mc-white outline-none transition placeholder:text-mc-muted/70 focus:border-sky-400" />
                </label>
                <label className="block text-sm text-mc-muted">Your email
                  <input required type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-lg border border-mc-border bg-black/20 px-3 py-3 text-sm text-mc-white outline-none transition placeholder:text-mc-muted/70 focus:border-sky-400" />
                </label>
              </div>
              <label className="block text-sm text-mc-muted">Subject
                <select required value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-2 w-full rounded-lg border border-mc-border bg-[#0c1220] px-3 py-3 text-sm text-mc-white outline-none focus:border-sky-400">
                  <option value="" disabled>Select a subject</option><option>General question</option><option>Suggestion or feedback</option><option>Partnership</option><option>Website issue</option><option>Resource or download issue</option><option>Other</option>
                </select>
              </label>
              <label className="block text-sm text-mc-muted">Message
                <textarea required minLength={5} maxLength={5000} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us how we can help..." className="mt-2 w-full resize-y rounded-lg border border-mc-border bg-black/20 px-3 py-3 text-sm leading-6 text-mc-white outline-none transition placeholder:text-mc-muted/70 focus:border-sky-400" />
              </label>
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-sky-950/30 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-[#080d16]">
                <Send className="h-4 w-4" /> Continue with Gmail <ExternalLink className="h-4 w-4" />
              </button>
              <p className="flex items-start gap-2 text-xs leading-5 text-mc-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> Your email app or Gmail will open with the details filled in. Review and press Send there; CubeNest does not send email in the background.</p>
            </form>
          </motion.section>

          <motion.aside initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="relative isolate overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-[#101b30] via-[#0b1220] to-[#11102a] p-5 shadow-xl sm:p-7">
            <div className="pointer-events-none absolute -right-12 -top-12 -z-10 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="grid h-full gap-5 sm:grid-cols-[.8fr_1.2fr] lg:grid-cols-1 xl:grid-cols-[.8fr_1.2fr]">
              <div className="flex items-center justify-center">
                <img src={CREEPER_IMAGE} alt="Pixelated green Creeper mascot" loading="lazy" className="max-h-[320px] w-full max-w-[260px] rounded-2xl object-contain drop-shadow-[0_0_30px_rgba(34,197,94,0.15)]" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300"><MessageCircle className="h-3.5 w-3.5" /> Creeper’s quick guide</span>
                <h2 className="text-2xl font-black text-mc-white">Need a hand?</h2>
                <p className="mt-2 text-sm leading-6 text-mc-muted">Hey there! I’m CubeNest’s little guide. Follow these steps and your message will reach the team.</p>
                <div className="mt-5 space-y-3">
                  <div className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sm font-black text-sky-300">1</span><div><h3 className="text-sm font-bold text-mc-white">Fill in the form</h3><p className="mt-1 text-xs leading-5 text-mc-muted">Add your name, reply email, subject, and a clear message.</p></div></div>
                  <div className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-sm font-black text-violet-300">2</span><div><h3 className="text-sm font-bold text-mc-white">Open Gmail and send</h3><p className="mt-1 text-xs leading-5 text-mc-muted">Check the draft, then tap Send in Gmail. Nothing is sent automatically.</p></div></div>
                  <div className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-sm font-black text-emerald-300"><Clock3 className="h-4 w-4" /></span><div><h3 className="text-sm font-bold text-mc-white">Wait for a reply</h3><p className="mt-1 text-xs leading-5 text-mc-muted">We’ll reply to the email address you provided when we can.</p></div></div>
                </div>
                <p className="mt-5 text-right text-sm font-semibold text-sky-300">Thanks for being part of CubeNest! ♡</p>
              </div>
            </div>
          </motion.aside>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Link to="/report" className="group rounded-xl border border-mc-border bg-mc-surface/70 p-4 transition hover:border-rose-400/40"><Bug className="mb-2 h-5 w-5 text-rose-400"/><h3 className="text-sm font-bold text-mc-white">Report a bug</h3><p className="mt-1 text-xs leading-5 text-mc-muted">Broken pages, wrong labels, or download problems.</p></Link>
          <Link to="/mods" className="group rounded-xl border border-mc-border bg-mc-surface/70 p-4 transition hover:border-emerald-400/40"><HelpCircle className="mb-2 h-5 w-5 text-emerald-400"/><h3 className="text-sm font-bold text-mc-white">Content help</h3><p className="mt-1 text-xs leading-5 text-mc-muted">Explore Java and Bedrock resource catalogs.</p></Link>
          <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT_EMAIL}`} target="_blank" rel="noreferrer" className="group rounded-xl border border-mc-border bg-mc-surface/70 p-4 transition hover:border-sky-400/40"><Mail className="mb-2 h-5 w-5 text-sky-400"/><h3 className="text-sm font-bold text-mc-white">Open Gmail directly</h3><p className="mt-1 text-xs leading-5 text-mc-muted">Start a new email to the CubeNest team.</p></a>
        </div>
        <p className="mt-6 text-center text-xs text-mc-muted">For questions about a third-party resource, the original creator may be best placed to help.</p>
      </div>
    </div>
  );
}
