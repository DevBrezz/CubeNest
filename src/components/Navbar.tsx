import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Blocks, Menu, Search, X } from 'lucide-react';

const links = [{ to: '/servers', label: 'Server Hub' }, { to: '/resources', label: 'Mods & Resources' }, { to: '/plugins', label: 'Plugin Center' }];
export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  return <header className="cn-nav"><nav className="cn-nav-inner" aria-label="Main navigation">
    <Link to="/" className="cn-brand" onClick={() => setOpen(false)}><span className="cn-brand-mark"><Blocks size={20}/></span><span>Cube<span>Nest</span><small>MINECRAFT COMMUNITY</small></span></Link>
    <div className="cn-nav-links">{links.map(l => <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? 'active' : ''}>{l.label}</NavLink>)}</div>
    <div className="cn-nav-actions"><Link to="/search" className="cn-nav-search" aria-label="Search"><Search size={17}/><span>Search</span><kbd>/</kbd></Link><Link to="/upload" className="cn-nav-upload">Submit resource <span>+</span></Link><button className="cn-menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open}>{open ? <X/> : <Menu/>}</button></div>
    {open && <div className="cn-mobile-menu">{links.map(l => <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>)}<Link to="/search" onClick={() => setOpen(false)}>Search resources</Link><Link to="/upload" onClick={() => setOpen(false)}>Submit resource</Link><Link to="/dashboard" onClick={() => setOpen(false)}>User dashboard</Link></div>}
    <span className="sr-only" aria-live="polite">{location.pathname}</span>
  </nav></header>;
}
