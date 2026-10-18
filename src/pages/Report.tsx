import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';

const TYPES = [
  { id: 'bug', label: 'Bug / broken feature' },
  { id: 'download', label: 'Download or link issue' },
  { id: 'wrong-label', label: 'Wrong Java / Bedrock label' },
  { id: 'content', label: 'Missing or incorrect content' },
  { id: 'other', label: 'Other' },
];

export function Report() {
  const [type, setType] = useState('bug');
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState('');
  const [extra, setExtra] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Client-side only: open mailto with structured body (no fake backend)
    const subject = encodeURIComponent(`[CubeNest Report] ${TYPES.find((t) => t.id === type)?.label}: ${title.slice(0, 80)}`);
    const body = encodeURIComponent(
      `Type: ${type}\nTitle: ${title}\n\nSteps to reproduce:\n${steps}\n\nAdditional info:\n${extra}\n\nContact: ${email || '(not provided)'}\nURL: ${typeof window !== 'undefined' ? window.location.href : ''}\nUser agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`
    );
    window.location.href = `mailto:team@cubenest.example?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="pt-20 pb-14 min-h-screen mc-grid-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-mc-red mb-2">
            <Bug className="w-3.5 h-3.5" /> Report center
          </div>
          <h1 className="text-3xl font-bold text-mc-white">Report a bug or issue</h1>
          <p className="mt-2 text-sm text-mc-muted leading-relaxed">
            Use this form for site bugs, broken downloads, wrong edition labels, or other problems with CubeNest.
            Please do not send passwords, tokens, or private server credentials.
          </p>
        </motion.div>

        {sent ? (
          <div className="mt-8 bg-mc-surface border border-mc-border rounded-xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h2 className="font-semibold text-mc-white">Report prepared</h2>
            <p className="text-sm text-mc-muted mt-1">Your email app should open with the report details. Send it to reach the team.</p>
            <button type="button" className="mt-4 text-sm text-mc-red hover:underline" onClick={() => setSent(false)}>Submit another</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4 bg-mc-surface border border-mc-border rounded-xl p-5">
            <div>
              <label className="text-xs font-medium text-mc-muted">Issue type</label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button key={t.id} type="button" onClick={() => setType(t.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] border ${type === t.id ? 'bg-mc-red border-mc-red text-white' : 'bg-mc-gray border-mc-border text-mc-text'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-mc-muted" htmlFor="title">Short title</label>
              <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white focus:outline-none focus:border-mc-red"
                placeholder="e.g. Plugins page shows empty list" />
            </div>
            <div>
              <label className="text-xs font-medium text-mc-muted" htmlFor="steps">Steps to reproduce</label>
              <textarea id="steps" required rows={4} value={steps} onChange={(e) => setSteps(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white focus:outline-none focus:border-mc-red resize-y"
                placeholder="1. Open /plugins&#10;2. …&#10;3. See error" />
            </div>
            <div>
              <label className="text-xs font-medium text-mc-muted" htmlFor="extra">Expected vs actual / extra details</label>
              <textarea id="extra" rows={3} value={extra} onChange={(e) => setExtra(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white focus:outline-none focus:border-mc-red resize-y"
                placeholder="What you expected, screenshots description, browser, etc." />
            </div>
            <div>
              <label className="text-xs font-medium text-mc-muted" htmlFor="email">Reply email (optional)</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white focus:outline-none focus:border-mc-red"
                placeholder="you@example.com" />
            </div>
            <div className="flex items-start gap-2 text-[11px] text-mc-muted bg-mc-gray/50 rounded-lg p-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              Remove secrets from logs. For issues with a specific mod/plugin file, also contact the author on Modrinth or SpigotMC.
            </div>
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-mc-red text-white text-sm font-medium hover:bg-mc-red-bright">
              <Send className="w-4 h-4" /> Submit report
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
