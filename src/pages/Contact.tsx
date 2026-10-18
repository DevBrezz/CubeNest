import { motion } from 'framer-motion';
import { Mail, MessageCircle, Bug, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Contact() {
  return (
    <div className="pt-20 pb-14 min-h-screen mc-grid-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-mc-white">Contact team</h1>
          <p className="mt-2 text-mc-muted text-sm leading-relaxed">
            Reach the CubeNest team for platform questions, partnership ideas, or general feedback.
            For bugs and technical issues, please use the Report center so we get structured details.
          </p>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="mailto:team@cubenest.example" className="bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-mc-red/40 transition-colors">
            <Mail className="w-5 h-5 text-mc-red mb-2" />
            <h2 className="font-semibold text-mc-white text-sm">Email the team</h2>
            <p className="text-xs text-mc-muted mt-1">General inquiries and feedback.</p>
          </a>
          <Link to="/report" className="bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-mc-red/40 transition-colors">
            <Bug className="w-5 h-5 text-mc-red mb-2" />
            <h2 className="font-semibold text-mc-white text-sm">Report a bug</h2>
            <p className="text-xs text-mc-muted mt-1">Broken pages, download issues, wrong labels.</p>
          </Link>
          <Link to="/mods" className="bg-mc-surface border border-mc-border rounded-xl p-4 hover:border-mc-red/40 transition-colors">
            <HelpCircle className="w-5 h-5 text-emerald-400 mb-2" />
            <h2 className="font-semibold text-mc-white text-sm">Content help</h2>
            <p className="text-xs text-mc-muted mt-1">Browse Java & Bedrock catalogs on Modrinth.</p>
          </Link>
          <div className="bg-mc-surface border border-mc-border rounded-xl p-4">
            <MessageCircle className="w-5 h-5 text-mc-red mb-2" />
            <h2 className="font-semibold text-mc-white text-sm">In-site assistant</h2>
            <p className="text-xs text-mc-muted mt-1">Ask how to search, download, or install content.</p>
          </div>
        </div>

        <p className="mt-8 text-xs text-mc-muted">
          CubeNest does not host plugin or mod files. For support about a specific project, contact the author on Modrinth or SpigotMC.
        </p>
      </div>
    </div>
  );
}
