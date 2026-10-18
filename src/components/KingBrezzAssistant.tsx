import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, ExternalLink, LifeBuoy, Search, Sparkles, X } from 'lucide-react';
import { assistantKnowledge, type AssistantItem } from '../data/assistantKnowledge';
import './KingBrezzAssistant.css';

export function KingBrezzAssistant({ page = false }: { page?: boolean }) {
  return <CubeNestAssistant page={page} />;
}

export function CubeNestAssistant({ page = false }: { page?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AssistantItem | null>(null);
  const [category, setCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set(assistantKnowledge.map((item: AssistantItem) => item.category));
    return ['all', ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assistantKnowledge.filter((item: AssistantItem) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const choose = (item: AssistantItem) => setSelected(item);
  const closeAnswer = () => setSelected(null);

  const panel = (
    <div className="kb-assistant-panel">
      <div className="kb-assistant-head">
        <div>
          <strong>CubeNest Assistant</strong>
          <span>Help center</span>
        </div>
        {!page && (
          <button type="button" className="kb-assistant-iconbtn" onClick={() => setOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        )}
      </div>

      <p className="kb-assistant-intro">Ask how to search, download, install, or report issues on CubeNest.</p>

      <div className="kb-assistant-search">
        <Search size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help, e.g. download mod..."
          aria-label="Search help"
        />
      </div>

      <div className="kb-assistant-cats">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={category === cat ? 'is-active' : ''}
            onClick={() => setCategory(cat)}
          >
            {cat === 'all' ? 'All topics' : cat}
          </button>
        ))}
      </div>

      <div className="kb-assistant-list">
        {filtered.length === 0 ? (
          <p className="kb-assistant-empty">No matching answer. Try another keyword or contact the team.</p>
        ) : (
          filtered.map((item: AssistantItem) => (
            <button key={item.id} type="button" className="kb-assistant-q" onClick={() => choose(item)}>
              <span>{item.category}</span>
              {item.question}
            </button>
          ))
        )}
      </div>

      <div className="kb-assistant-foot">
        <Link to="/assistant" onClick={() => !page && setOpen(false)}>
          Open help center <ExternalLink size={12} />
        </Link>
        <Link to="/report" onClick={() => !page && setOpen(false)}>
          Report a bug
        </Link>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="kb-answer-overlay"
            role="presentation"
            onClick={closeAnswer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              className="kb-answer-modal"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
            >
              <div className="kb-answer-modal-head">
                <span className="kb-answer-tag">
                  <Sparkles size={13} /> Answer
                </span>
                <button type="button" className="kb-assistant-iconbtn" onClick={closeAnswer} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <h3>{selected.question}</h3>
              <p>{selected.answer}</p>
              {selected.action && (
                <Link
                  className="kb-answer-action"
                  to={selected.action.to}
                  onClick={() => {
                    closeAnswer();
                    if (!page) setOpen(false);
                  }}
                >
                  {selected.action.label}
                  <ExternalLink size={14} />
                </Link>
              )}
              <p className="kb-answer-note">Always verify install steps with the original project page.</p>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (page) {
    return (
      <main className="kb-assistant-route">
        <div className="kb-assistant-route-intro">
          <span>
            <Sparkles size={15} /> CubeNest Assistant
          </span>
          <h1>Help Center</h1>
          <p>How to search, download, install content, join servers, and report issues.</p>
        </div>
        {panel}
      </main>
    );
  }

  return (
    <div className="kb-assistant-floating">
      <AnimatePresence>
        {open && (
          <motion.div
            className="kb-assistant-popover"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            {panel}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        className={`kb-assistant-launcher ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? (
          <X size={19} />
        ) : (
          <>
            <Bot size={20} />
            <span>Assistant</span>
            <i />
          </>
        )}
      </button>
    </div>
  );
}
