import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Bug, CheckCircle2, CircleAlert, Send, MessageSquareText, ShieldCheck } from 'lucide-react';

const API_BASE = 'https://kingbrezz-report-api.brezzteam5.workers.dev';

type FormKind = 'bug' | 'contact';
type Status = { kind: 'success' | 'error'; message: string } | null;

const initialBug = {
  name: '', email: '', project: '', title: '', description: '',
  steps: '', expected: '', actual: '', severity: 'medium', website: '',
};
const initialContact = { name: '', email: '', subject: '', message: '', website: '' };

export function Report() {
  const [kind, setKind] = useState<FormKind>('bug');
  const [bug, setBug] = useState(initialBug);
  const [contact, setContact] = useState(initialContact);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const changeKind = (next: FormKind) => {
    setKind(next);
    setStatus(null);
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setStatus(null);
    setSending(true);
    const values = kind === 'bug' ? bug : contact;
    // Quiet honeypot: reject automated submissions without sending them to the API.
    if (values.website.trim()) {
      setStatus({ kind: 'error', message: 'Submission could not be processed. Please review the form and try again.' });
      setSending(false);
      return;
    }

    const endpoint = kind === 'bug' ? '/api/report' : '/api/contact';
    const payload = kind === 'bug'
      ? {
          name: bug.name.trim(),
          // Match the deployed Worker schema: name, email, subject, message, page.
          email: bug.email.trim(),
          subject: bug.title.trim(),
          page: bug.project.trim(),
          message: [
            `Severity: ${bug.severity}`,
            `Description:\n${bug.description.trim()}`,
            `Steps to reproduce:\n${bug.steps.trim() || 'Not provided'}`,
            `Expected result:\n${bug.expected.trim() || 'Not provided'}`,
            `Actual result:\n${bug.actual.trim() || 'Not provided'}`,
          ].join('\n\n'),
          website: bug.website.trim(),
        }
      : {
          name: contact.name.trim(),
          email: contact.email.trim(),
          subject: contact.subject.trim(),
          message: contact.message.trim(),
        };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let result: { success?: boolean; message?: string; error?: string } = {};
      try { result = await response.json(); } catch { /* handled as a failed response below */ }
      if (!response.ok || result.success !== true) {
        throw new Error(result.message || result.error || `Request failed (${response.status}). Please try again later.`);
      }
      setStatus({ kind: 'success', message: kind === 'bug' ? 'Bug report sent successfully. Thank you for helping improve the project.' : 'Your message was sent successfully. Thanks for reaching out.' });
      if (kind === 'bug') setBug(initialBug);
      else setContact(initialContact);
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error
          ? (error instanceof TypeError
            ? 'The support API could not be reached. Check the Worker URL, CORS allowed origin, and network connection, then try again.'
            : error.message)
          : 'Could not send your submission. Please try again later.',
      });
    } finally {
      setSending(false);
    }
  }

  const fieldClass = 'report-input';
  return (
    <div className="report-page relative min-h-screen overflow-hidden pt-28 pb-20">
      <div className="report-glow report-glow-one" aria-hidden="true" />
      <div className="report-glow report-glow-two" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mx-auto mb-10 max-w-3xl text-center">
          <span className="report-eyebrow"><ShieldCheck size={14} /> KINGBREZZ SUPPORT</span>
          <h1 className="report-heading mt-5">How can we <span>help?</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Report a problem with a project or send a message directly. Submissions are sent to the KingBrezz support API.
          </p>
        </motion.header>

        <div className="report-tabs mx-auto mb-6 grid max-w-2xl grid-cols-2 gap-2" role="tablist" aria-label="Submission type">
          <button type="button" role="tab" aria-selected={kind === 'bug'} className={kind === 'bug' ? 'report-tab active' : 'report-tab'} onClick={() => changeKind('bug')}>
            <Bug size={17} /><span>Bug report</span>
          </button>
          <button type="button" role="tab" aria-selected={kind === 'contact'} className={kind === 'contact' ? 'report-tab active' : 'report-tab'} onClick={() => changeKind('contact')}>
            <MessageSquareText size={17} /><span>Contact</span>
          </button>
        </div>

        <motion.section key={kind} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="report-panel mx-auto max-w-2xl">
          <div className="report-panel-heading">
            <div className="report-panel-icon">{kind === 'bug' ? <Bug size={20} /> : <MessageSquareText size={20} />}</div>
            <div>
              <h2>{kind === 'bug' ? 'Report a bug' : 'Send a message'}</h2>
              <p>{kind === 'bug' ? 'Share what happened so it can be investigated.' : 'Questions, collaboration, or anything else.'}</p>
            </div>
          </div>

          {status && (
            <div className={`report-status ${status.kind}`} role="status" aria-live="polite">
              {status.kind === 'success' ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={submit} className="report-form">
            <div className="report-honeypot" aria-hidden="true">
              <label htmlFor={`website-${kind}`}>Leave this field empty</label>
              <input id={`website-${kind}`} name="website" tabIndex={-1} autoComplete="off" value={kind === 'bug' ? bug.website : contact.website} onChange={(e) => kind === 'bug' ? setBug({ ...bug, website: e.target.value }) : setContact({ ...contact, website: e.target.value })} />
            </div>
            {kind === 'bug' ? (
              <>
                <div className="report-form-grid">
                  <label className="report-field">Name / username <span>*</span>
                    <input className={fieldClass} required maxLength={80} autoComplete="name" value={bug.name} onChange={(e) => setBug({ ...bug, name: e.target.value })} placeholder="Your name or username" />
                  </label>
                  <label className="report-field">Email <span>*</span>
                    <input className={fieldClass} required type="email" maxLength={254} autoComplete="email" value={bug.email} onChange={(e) => setBug({ ...bug, email: e.target.value })} placeholder="you@example.com" />
                  </label>
                </div>
                <label className="report-field">Project or page <span>*</span>
                  <input className={fieldClass} required maxLength={120} value={bug.project} onChange={(e) => setBug({ ...bug, project: e.target.value })} placeholder="e.g. SkullAC, portfolio home page" />
                </label>
                <div className="report-form-grid">
                  <label className="report-field">Bug title <span>*</span>
                    <input className={fieldClass} required maxLength={140} value={bug.title} onChange={(e) => setBug({ ...bug, title: e.target.value })} placeholder="Short summary of the issue" />
                  </label>
                  <label className="report-field">Severity
                    <select className={fieldClass} value={bug.severity} onChange={(e) => setBug({ ...bug, severity: e.target.value })}>
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                    </select>
                  </label>
                </div>
                <label className="report-field">Description <span>*</span>
                  <textarea className={fieldClass} required minLength={10} maxLength={5000} rows={5} value={bug.description} onChange={(e) => setBug({ ...bug, description: e.target.value })} placeholder="Describe what went wrong and when it happens." />
                </label>
                <label className="report-field">Steps to reproduce <small>Optional</small>
                  <textarea className={fieldClass} maxLength={3000} rows={3} value={bug.steps} onChange={(e) => setBug({ ...bug, steps: e.target.value })} placeholder={'1. Open...\n2. Click...\n3. The issue appears...'} />
                </label>
                <div className="report-form-grid">
                  <label className="report-field">Expected result <small>Optional</small>
                    <textarea className={fieldClass} maxLength={1500} rows={3} value={bug.expected} onChange={(e) => setBug({ ...bug, expected: e.target.value })} placeholder="What should happen?" />
                  </label>
                  <label className="report-field">Actual result <small>Optional</small>
                    <textarea className={fieldClass} maxLength={1500} rows={3} value={bug.actual} onChange={(e) => setBug({ ...bug, actual: e.target.value })} placeholder="What happened instead?" />
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="report-form-grid">
                  <label className="report-field">Name <span>*</span>
                    <input className={fieldClass} required maxLength={80} autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Your name" />
                  </label>
                  <label className="report-field">Email <span>*</span>
                    <input className={fieldClass} required type="email" maxLength={254} autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="you@example.com" />
                  </label>
                </div>
                <label className="report-field">Subject <span>*</span>
                  <input className={fieldClass} required maxLength={140} value={contact.subject} onChange={(e) => setContact({ ...contact, subject: e.target.value })} placeholder="What would you like to discuss?" />
                </label>
                <label className="report-field">Message <span>*</span>
                  <textarea className={fieldClass} required minLength={5} maxLength={5000} rows={7} value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} placeholder="Write your message here..." />
                </label>
              </>
            )}
            <div className="report-form-bottom">
              <p>Your form is only sent when you press submit.</p>
              <button className="report-submit" type="submit" disabled={sending}>
                {sending ? <><span className="report-spinner" /> Sending...</> : <><Send size={16} /> {kind === 'bug' ? 'Submit report' : 'Send message'}</>}
              </button>
            </div>
          </form>
        </motion.section>
        <p className="report-footnote">Please don’t include passwords, access tokens, or other sensitive information.</p>
      </div>
    </div>
  );
}
