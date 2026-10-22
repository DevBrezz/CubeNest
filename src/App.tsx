import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BottomNav } from './components/BottomNav';
import { BootScreen } from './components/BootScreen';

import { VisitorBadge } from './components/VisitorBadge';
import { LanguageProvider } from './lib/i18n';
import { AuthProvider } from './lib/auth';

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const DownloadsPage = lazy(() => import('./pages/DownloadsPage').then(m => ({ default: m.DownloadsPage })));
const WhitelistPage = lazy(() => import('./pages/WhitelistPage').then(m => ({ default: m.WhitelistPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const UploadPage = lazy(() => import('./pages/UploadPage').then(m => ({ default: m.UploadPage })));
const Projects = lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then(m => ({ default: m.ProjectDetail })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Donate = lazy(() => import('./pages/Donate').then(m => ({ default: m.Donate })));
const Report = lazy(() => import('./pages/Report').then(m => ({ default: m.Report })));
const Catalog = lazy(() => import('./pages/Catalog').then(m => ({ default: m.Catalog })));
const ModrinthDetail = lazy(() => import('./pages/ModrinthDetail').then(m => ({ default: m.ModrinthDetail })));
const Plugins = lazy(() => import('./pages/Plugins').then(m => ({ default: m.Plugins })));
const Servers = lazy(() => import('./pages/Servers').then(m => ({ default: m.Servers })));
const Mods = lazy(() => import('./pages/Mods').then(m => ({ default: m.Mods })));
const ModsHub = lazy(() => import('./pages/ModsHub').then(m => ({ default: m.ModsHub })));
const BedrockHub = lazy(() => import('./pages/BedrockHub').then(m => ({ default: m.BedrockHub })));
const BedrockCatalog = lazy(() => import('./pages/BedrockCatalog').then(m => ({ default: m.BedrockCatalog })));
const BedrockResourceDetail = lazy(() => import('./pages/BedrockResourceDetail').then(m => ({ default: m.BedrockResourceDetail })));
const Skins = lazy(() => import('./pages/Skins').then(m => ({ default: m.Skins })));
const SkinCreator = lazy(() => import('./pages/SkinCreator').then(m => ({ default: m.SkinCreator })));
const KingBrezzAssistant = lazy(() => import('./components/KingBrezzAssistant').then(m => ({ default: m.KingBrezzAssistant })));

function PageLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
      <span className="text-sm text-mc-muted">Loading CubeNest...</span>
    </div>
  );
}

export default function App() {
  const [showBoot, setShowBoot] = useState(false);

  useEffect(() => {
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem('cubenest-boot-shown') === '1';
    } catch {
      // Storage may be unavailable.
    }

    if (alreadyShown) return;

    setShowBoot(true);
    try {
      sessionStorage.setItem('cubenest-boot-shown', '1');
    } catch {
      // Continue without session storage.
    }

    const timer = window.setTimeout(() => setShowBoot(false), 2300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-mc-black text-mc-text pb-16">
            <Navbar />
            <main className="flex-1">
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/downloads" element={<DownloadsPage />} />
                  <Route path="/whitelist" element={<WhitelistPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/plugins" element={<Plugins />} />
                  <Route path="/servers" element={<Servers />} />
                  <Route path="/mods" element={<ModsHub />} />
                  <Route path="/bedrock" element={<BedrockHub />} />
                  <Route path="/bedrock/catalog" element={<BedrockCatalog />} />
                  <Route path="/bedrock/resource/:id" element={<BedrockResourceDetail />} />
                  <Route path="/skins" element={<Skins />} />
                  <Route path="/skin-creator" element={<SkinCreator />} />
                  <Route path="/mods/catalog" element={<Catalog category="mods" />} />
                  <Route path="/mods/:slug" element={<ModrinthDetail category="mods" />} />
                  <Route path="/resourcepacks" element={<Catalog category="resourcepacks" />} />
                  <Route path="/resourcepacks/:slug" element={<ModrinthDetail category="resourcepacks" />} />
                  <Route path="/shaders" element={<Catalog category="shaders" />} />
                  <Route path="/shaders/:slug" element={<ModrinthDetail category="shaders" />} />
                  <Route path="/modpacks" element={<Catalog category="modpacks" />} />
                  <Route path="/modpacks/:slug" element={<ModrinthDetail category="modpacks" />} />
                  <Route path="/datapacks" element={<Catalog category="datapacks" />} />
                  <Route path="/datapacks/:slug" element={<ModrinthDetail category="datapacks" />} />
                  <Route path="/curseforge-mods" element={<Mods />} />
                  <Route path="/project/:id" element={<ProjectDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/donate" element={<Donate />} />
                  <Route path="/report" element={<Report />} />
                  <Route path="/assistant" element={<KingBrezzAssistant page />} />
                  <Route path="*" element={<Home />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            <BottomNav />
            <Suspense fallback={null}><KingBrezzAssistant /></Suspense>
            <VisitorBadge />
            {showBoot && <BootScreen />}
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
