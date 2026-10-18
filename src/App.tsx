import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Catalog, ResourceDetail } from './pages/cubenest/Catalog';
import { ServerHub } from './pages/cubenest/ServerHub';
import { Upload } from './pages/cubenest/Upload';
import { InfoPage } from './pages/cubenest/Info';
import { useEffect } from 'react';
import './cubenest.css';

export default function App() {
  useEffect(() => { document.title = 'CubeNest — Minecraft, connected'; }, []);
  return <BrowserRouter><div className="cn-shell"><Navbar/><main className="cn-main"><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/servers" element={<ServerHub/>}/>
    <Route path="/resources" element={<Catalog kind="resources"/>}/>
    <Route path="/mods" element={<Catalog kind="resources"/>}/>
    <Route path="/plugins" element={<Catalog kind="plugins"/>}/>
    <Route path="/resource/:id" element={<ResourceDetail/>}/>
    <Route path="/search" element={<Catalog kind="resources"/>}/>
    <Route path="/upload" element={<Upload/>}/>
    <Route path="/dashboard" element={<InfoPage/>}/><Route path="/admin" element={<InfoPage/>}/><Route path="/creators" element={<InfoPage/>}/><Route path="/terms" element={<InfoPage/>}/><Route path="/privacy" element={<InfoPage/>}/><Route path="/report" element={<InfoPage/>}/>
    <Route path="*" element={<Home/>}/>
  </Routes></main><Footer/></div></BrowserRouter>;
}
