import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BottomNav } from './components/BottomNav';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Donate } from './pages/Donate';
import { BootScreen } from './components/BootScreen';
import { useEffect, useState } from 'react';
import { Report } from './pages/Report';
import { LanguageProvider } from './lib/i18n';
import { AuthProvider } from './lib/auth';
import { KingBrezzAssistant } from './components/KingBrezzAssistant';
import { VisitorBadge } from './components/VisitorBadge';
import { Catalog } from './pages/Catalog';
import { ModrinthDetail } from './pages/ModrinthDetail';
import { Plugins } from './pages/Plugins';
import { Servers } from './pages/Servers';
import { Mods } from './pages/Mods';
import { ModsHub } from './pages/ModsHub';
import { BedrockHub } from './pages/BedrockHub';
import { BedrockCatalog } from './pages/BedrockCatalog';
import { BedrockResourceDetail } from './pages/BedrockResourceDetail';
import { Skins } from './pages/Skins';
import { SkinCreator } from './pages/SkinCreator';
import { SearchPage } from './pages/SearchPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { WhitelistPage } from './pages/WhitelistPage';
import { ProfilePage } from './pages/ProfilePage';
import { UploadPage } from './pages/UploadPage';

export default function App() {
  const [showBoot, setShowBoot] = useState(false);
  useEffect(() => {
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem('cubenest-boot-shown') === '1';
    } catch {
      /* ignore */
    }
    if (alreadyShown) return;
    setShowBoot(true);
    try {
      sessionStorage.setItem('cubenest-boot-shown', '1');
    } catch {
      /* ignore */
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
            </main>
            <Footer />
            <BottomNav />
            <KingBrezzAssistant />
            <VisitorBadge />
            {showBoot && <BootScreen />}
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
