import { useEffect, useMemo, useState } from 'react';
import { CornerMark, Mark, SoundIcon } from './ui/components/Ornaments.tsx';
import { embeddedJar, href, ShellProvider, useHashRoute, type Route } from './ui/shell.tsx';
import { sound } from './ui/sound.ts';
import { Guides } from './pages/Guides.tsx';
import { Home } from './pages/Home.tsx';
import { Seal } from './pages/Seal.tsx';
import { Seance } from './pages/Seance.tsx';
import { Watch } from './pages/Watch.tsx';

const NAV: { route: Route; label: string }[] = [
  { route: 'seal', label: 'Seal' },
  { route: 'watch', label: 'Watch' },
  { route: 'seance', label: 'Séance' },
  { route: 'guides', label: 'Guides' },
];

export function App() {
  const embedded = useMemo(embeddedJar, []);
  const { route: hashRoute, anchor } = useHashRoute();
  // A downloaded Grimoire opens straight into its séance.
  const route: Route = embedded && hashRoute === 'home' ? 'seance' : hashRoute;

  const [theme, setTheme] = useState<'day' | 'night'>('day');
  const [mourning, setMourning] = useState(3);
  const [candlelight, setCandlelight] = useState(0);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--mourning', `${mourning}px`);
  }, [mourning]);

  useEffect(() => {
    document.documentElement.style.setProperty('--candlelight', String(candlelight));
  }, [candlelight]);

  const shell = useMemo(() => ({ setTheme, setMourning, setCandlelight }), []);

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
      <div className="paper" aria-hidden="true" />
      <div className="frame" aria-hidden="true">
        <span className="frame-corner tl"><CornerMark /></span>
        <span className="frame-corner tr"><CornerMark /></span>
        <span className="frame-corner bl"><CornerMark /></span>
        <span className="frame-corner br"><CornerMark /></span>
      </div>

      <header className="topbar no-print">
        <a className="wordmark" href={href('home')} aria-label="Phylactery, home">
          <Mark />
          <span>Phylactery</span>
        </a>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <a key={n.route} href={href(n.route)} aria-current={route === n.route ? 'page' : undefined}>
              {n.label}
            </a>
          ))}
          <button className="sound-toggle" onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}>
            <SoundIcon on={soundOn} />
          </button>
        </nav>
      </header>

      <main id="main">
        {route === 'home' && <Home />}
        {route === 'seal' && <Seal />}
        {route === 'watch' && <Watch />}
        {route === 'seance' && <Seance embedded={embedded} />}
        {route === 'guides' && <Guides anchor={anchor} />}
      </main>
    </ShellProvider>
  );
}
