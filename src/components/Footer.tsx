import { Link } from 'react-router-dom';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-mc-border bg-mc-dark mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={`${import.meta.env.BASE_URL}images/cubenest-logo.png`} alt="" className="brand-logo brand-logo-small" />
              <span className="font-semibold text-mc-white">CubeNest</span>
            </div>
            <p className="text-sm text-mc-muted leading-relaxed">
              Discover Minecraft mods, plugins, resource packs, shaders, modpacks, and servers.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-mc-muted mb-3">Discover</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/mods" className="text-mc-text hover:text-mc-red transition-colors">Mods</Link></li>
              <li><Link to="/plugins" className="text-mc-text hover:text-mc-red transition-colors">Plugins</Link></li>
              <li><Link to="/servers" className="text-mc-text hover:text-mc-red transition-colors">Servers</Link></li>
              <li><Link to="/resourcepacks" className="text-mc-text hover:text-mc-red transition-colors">Resource Packs</Link></li>
              <li><Link to="/shaders" className="text-mc-text hover:text-mc-red transition-colors">Shaders</Link></li>
              <li><Link to="/modpacks" className="text-mc-text hover:text-mc-red transition-colors">Modpacks</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-mc-muted mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/projects" className="text-mc-text hover:text-mc-red transition-colors">Projects</Link></li>
              <li><Link to="/about" className="text-mc-text hover:text-mc-red transition-colors">About</Link></li>
              <li><Link to="/contact" className="text-mc-text hover:text-mc-red transition-colors">Contact</Link></li>
              <li><Link to="/donate" className="text-mc-text hover:text-mc-red transition-colors">Donate</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-mc-muted mb-3">Sources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://modrinth.com" target="_blank" rel="noopener noreferrer" className="text-mc-text hover:text-mc-red transition-colors">Modrinth</a>
              </li>
              <li>
                <a href="https://www.spigotmc.org" target="_blank" rel="noopener noreferrer" className="text-mc-text hover:text-mc-red transition-colors">SpigotMC</a>
              </li>
            </ul>
            <p className="text-xs text-mc-muted mt-4">Not affiliated with Mojang or Microsoft.</p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-mc-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-mc-muted">
          <p>© {year} CubeNest. All rights reserved.</p>
          <p>Downloads are hosted by original platforms.</p>
        </div>
      </div>
    </footer>
  );
}
