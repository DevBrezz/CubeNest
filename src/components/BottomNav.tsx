import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Download, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/downloads', label: 'Downloads', icon: Download },
  { to: '/whitelist', label: 'Whitelist', icon: ShieldCheck },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-mc-border bg-mc-black/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="max-w-lg mx-auto grid grid-cols-4">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-emerald-400' : 'text-mc-muted hover:text-mc-white'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'text-emerald-400')} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
