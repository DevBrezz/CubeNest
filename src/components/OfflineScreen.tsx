import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Signal } from 'lucide-react';
import './OfflineScreen.css';

/** Full-screen recovery UI shown only when the browser cannot reach the site. */
export function OfflineScreen() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [checking, setChecking] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let timer = 0;

    const probe = async () => {
      if (!navigator.onLine) {
        if (active) setOffline(true);
        return;
      }
      try {
        // Same-origin probe avoids relying on third-party connectivity.
        const response = await fetch(`/favicon.svg?connectivity=${Date.now()}`, {
          method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(5000),
        });
        if (active) setOffline(!response.ok);
      } catch {
        if (active) setOffline(true);
      }
    };

    const handleOffline = () => setOffline(true);
    const handleOnline = () => { setChecking(true); void probe().finally(() => active && setChecking(false)); };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    void probe();
    timer = window.setInterval(() => { void probe(); }, 12000);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [attempt]);

  if (!offline) return null;

  return (
    <section className="offline-screen" role="alertdialog" aria-modal="true" aria-labelledby="offline-title">
      <div className="offline-stars" aria-hidden="true" />
      <header className="offline-topbar">
        <a className="offline-brand" href="/" aria-label="DevBrezz Portfolio">
          <span className="offline-brand-mark">B</span>
          <span><strong>DevBrezz</strong><small>PORTFOLIO</small></span>
        </a>
        <span className="offline-status"><i /> OFFLINE</span>
      </header>

      <div className="offline-layout">
        <div className="offline-warden-wrap" aria-hidden="true">
          <div className="offline-rune offline-rune-one" />
          <div className="offline-rune offline-rune-two" />
          <div className="offline-wifi-orbit"><WifiOff size={86} strokeWidth={1.15} /></div>
          <img className="offline-warden" src="/images/warden.gif" alt="" />
          <div className="offline-ground-glow" />
        </div>

        <div className="offline-content">
          <div className="offline-eyebrow"><span /> NO INTERNET CONNECTION</div>
          <h1 id="offline-title">You’re <em>Offline</em></h1>
          <p className="offline-description">The connection has been lost somewhere in the Deep Dark.</p>
          <p className="offline-subdescription">Stay calm. We’ll keep checking and reconnect automatically when your connection returns.</p>

          <div className="offline-reconnect-card">
            <div className="offline-reconnect-icon"><RefreshCw size={27} /></div>
            <div className="offline-reconnect-copy">
              <strong>{checking ? 'Checking connection…' : 'Reconnecting…'}</strong>
              <span>{checking ? 'Testing your connection now' : 'Waiting for your network to return'}</span>
            </div>
            <div className="offline-signal" aria-hidden="true"><i /><i /><i /><i /></div>
            <div className="offline-progress"><span /></div>
          </div>

          <div className="offline-bottom-row"><span><Signal size={16} /> Automatic connection check enabled</span><span>RETRY #{attempt + 1}</span></div>
          <button className="offline-retry" onClick={() => { setChecking(true); setAttempt(value => value + 1); void fetch(`/favicon.svg?retry=${Date.now()}`, { cache: 'no-store' }).then(response => setOffline(!response.ok)).catch(() => setOffline(true)).finally(() => setChecking(false)); }}>
            <Wifi size={17} /> Try Again
          </button>
          <p className="offline-footnote">Your portfolio will return automatically once the connection is restored.</p>
        </div>
      </div>
      <footer className="offline-footer"><span>STAY CONNECTED<br />STAY AWESOME</span><span>DEVBREZZ&nbsp; | &nbsp;PORTFOLIO</span></footer>
    </section>
  );
}
