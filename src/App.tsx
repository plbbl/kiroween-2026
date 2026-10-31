import { useEffect, useMemo, useState } from 'react';
import { Stars } from './ui/art/Decor.tsx';
import { Ghost } from './ui/art/Ghost.tsx';
import { embeddedJar, href, ShellProvider, useHashRoute, type Route } from './ui/shell.tsx';
import { sound } from './ui/sound.ts';
import { Gallery } from './pages/Gallery.tsx';
import { Guides } from './pages/Guides.tsx';
import { Home } from './pages/Home.tsx';
import { Seal } from './pages/seal/Seal.tsx';
import { Seance } from './pages/seance/Seance.tsx';
import { Watch } from './pages/Watch.tsx';

const NAV: { route: Route; label: string }[] = [
  { route: 'seal', label: 'Seal' },
  { route: 'watch', label: 'Watch' },
  { route: 'seance', label: 'Séance' },
  { route: 'guides', label: 'Guides' },
];

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5 H8 L12.5 5.5 V18.5 L8 14.5 H4 Z" fill="currentColor" />
      {on ? (
        <path d="M15.5 9 C17 10.5 17 13.5 15.5 15 M18 6.5 C21 9.5 21 14.5 18 17.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M16 9.5 L20.5 14 M20.5 9.5 L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function App() {
  const embedded = useMemo(() => embeddedJar(), []);
  const { route: hashRoute, anchor } = useHashRoute();
  // A downloaded Grimoire opens straight into its séance.
  const route: Route = embedded && hashRoute === 'home' ? 'seance' : hashRoute;

  const [theme, setTheme] = useState<'day' | 'night'>('day');
  const [candlelight, setCandlelight] = useState(0);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--candlelight', String(candlelight));
  }, [candlelight]);

  const shell = useMemo(() => ({ setTheme, setCandlelight }), []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    sound.setEnabled(next);
    if (next) {
      sound.chime();
      if (route === 'seance') sound.startDrone();
    }
  };

  return (
    <ShellProvider value={shell}>
      <div className="backdrop" aria-hidden="true" />
      {theme === 'night' && <Stars />}

      <header className="topbar no-print">
        <a className="wordmark" href={href('home')} aria-label="Phylactery, home">
          <span className="logo-badge" aria-hidden="true">
            <Ghost size={24} mood="happy" />
          </span>
          <span>Phylactery</span>
        </a>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <a key={n.route} href={href(n.route)} aria-current={route === n.route ? 'page' : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
        <button className="icon-btn" onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}>
          <SoundIcon on={soundOn} />
        </button>
      </header>

      <main id="main">
        {route === 'home' && <Home />}
        {route === 'seal' && <Seal />}
        {route === 'watch' && <Watch />}
        {route === 'seance' && <Seance embedded={embedded} />}
        {route === 'guides' && <Guides anchor={anchor} />}
        {route === 'gallery' && <Gallery />}
      </main>
    </ShellProvider>
  );
}
