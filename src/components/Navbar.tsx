import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Languages, ChevronDown, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/i18n';

const links = [
  { to: '/', label: 'Home' },
  { to: '/mods', label: 'Mods' },
  { to: '/cubenest-mods', label: 'CubeNest Mods' },
  { to: '/cubenest-mods/mods', label: 'CubeNest: Mods' },
  { to: '/cubenest-mods/plugins', label: 'CubeNest: Plugins' },
  { to: '/cubenest-mods/addons', label: 'CubeNest: Add-ons' },
  { to: '/cubenest-mods/resourcepacks', label: 'CubeNest: Resource Packs' },
  { to: '/cubenest-mods/shaders', label: 'CubeNest: Shaders' },
  { to: '/cubenest-mods/skins', label: 'CubeNest: Skins' },
  { to: '/cubenest-mods/modpacks', label: 'CubeNest: Modpacks' },
  { to: '/upload', label: 'Upload' },
  { to: '/plugins', label: 'Plugins' },
  { to: '/servers', label: 'Servers' },
  { to: '/skin-creator', label: 'Skin Creator' },
  { to: '/resourcepacks', label: 'Resource Packs' },
  { to: '/shaders', label: 'Shaders' },
  { to: '/modpacks', label: 'Modpacks' },
  { to: '/projects', label: 'Projects' },
  { to: '/about', label: 'About CubeNest' },
  { to: '/contact', label: 'Contact team' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);
  const languages = [
    { code: 'en' as const, flag: '🇬🇧', label: 'English' },
    { code: 'id' as const, flag: '🇮🇩', label: 'Indonesia' },
    { code: 'zh' as const, flag: '🇨🇳', label: '中文' },
    { code: 'nl' as const, flag: '🇳🇱', label: 'Nederlands' },
  ];
  const selectedLanguage = languages.find((item) => item.code === language) ?? languages[0];
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const primary = links.slice(0, 7);
  const more = links.slice(7);

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-mc-black/90 backdrop-blur-md border-b border-mc-border shadow-lg' : 'bg-transparent'
    )}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}images/cubenest-logo.png`}
            alt="CubeNest"
            className="w-8 h-8 rounded-lg object-contain"
          />
          <span className="font-semibold text-mc-white tracking-tight">
            Cube<span className="text-emerald-400">Nest</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {primary.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                'px-2.5 py-2 rounded-md text-xs font-medium transition-colors relative whitespace-nowrap',
                location.pathname === l.to || (l.to !== '/' && location.pathname.startsWith(l.to))
                  ? 'text-mc-white'
                  : 'text-mc-muted hover:text-mc-white'
              )}
            >
              {l.label}
              {(location.pathname === l.to || (l.to !== '/' && location.pathname.startsWith(l.to))) && (
                <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-1 right-1 h-0.5 bg-emerald-400 rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
            </Link>
          ))}
          {more.map((l) => (
            <Link key={l.to} to={l.to} className={cn('px-2.5 py-2 rounded-md text-xs font-medium', location.pathname === l.to ? 'text-mc-white' : 'text-mc-muted hover:text-mc-white')}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/mods" className="hidden sm:inline-flex p-2 text-mc-muted hover:text-mc-white" aria-label="Browse mods">
            <Search className="w-4 h-4" />
          </Link>
          <div className="relative hidden md:block">
            <button type="button" className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-mc-muted hover:text-mc-white" onClick={() => setLanguageOpen(!languageOpen)}>
              <Languages className="w-3.5 h-3.5" /> {selectedLanguage.flag} <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {languageOpen && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 mt-1 w-40 bg-mc-surface border border-mc-border rounded-lg shadow-xl py-1 z-50">
                  {languages.map((lang) => (
                    <button key={lang.code} type="button" className="w-full text-left px-3 py-2 text-xs hover:bg-mc-gray flex items-center gap-2" onClick={() => { setLanguage(lang.code); setLanguageOpen(false); }}>
                      <span>{lang.flag}</span> {lang.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button className="lg:hidden p-2 text-mc-muted hover:text-mc-white" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden bg-mc-dark border-b border-mc-border overflow-hidden">
            <div className="px-4 py-3 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
              {links.map((l) => (
                <Link key={l.to} to={l.to} className={cn('px-4 py-3 rounded-md text-sm font-medium', location.pathname === l.to ? 'bg-mc-surface text-mc-white' : 'text-mc-muted hover:bg-mc-surface hover:text-mc-white')}>
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
