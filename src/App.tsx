import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Stars } from './ui/art/Decor.tsx';
import { HillScene, Scenery } from './ui/art/Spooky.tsx';
import { Ghost } from './ui/art/Ghost.tsx';
import { embeddedJar, href, ShellProvider, useHashRoute, type Route } from './ui/shell.tsx';
import { sound } from './ui/sound.ts';
import { Gallery } from './pages/Gallery.tsx';
import { Guides } from './pages/Guides.tsx';
import { Home } from './pages/Home.tsx';
import { Seal } from './pages/seal/Seal.tsx';
import { Seance } from './pages/seance/Seance.tsx';
import { Watch } from './pages/watch/Watch.tsx';

const TITLES: Partial<Record<Route, string>> = {
  seal: 'Seal a jar',
  watch: 'Still here?',
  seance: 'Séance',
  guides: 'Guides',
  gallery: 'The cast',
};

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

function focusHeading() {
  const h = document.querySelector<HTMLElement>('#main h1');
  if (!h) return;
  if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
  h.focus({ preventScroll: true });
}

export function App() {
  const embedded = useMemo(() => embeddedJar(), []);
  const { route: hashRoute, anchor, params } = useHashRoute();
  // A downloaded Grimoire opens straight into its séance.
  const route: Route = embedded && hashRoute === 'home' ? 'seance' : hashRoute;

  // Start in the right light, so a jar file (or the home page) opens at night without a flash of day.
  const [theme, setTheme] = useState<'day' | 'night'>(() => (route === 'seance' || route === 'home' ? 'night' : 'day'));
  const [candlelight, setCandlelight] = useState(0);
  const [soundOn, setSoundOn] = useState(false);

  useLayoutEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useLayoutEffect(() => {
    document.body.dataset.route = route;
  }, [route]);

  useEffect(() => {
    const page = embedded && route === 'seance' ? `${embedded.owner}’s jar` : TITLES[route];
    document.title = page ? `${page} · Phylactery` : 'Phylactery';
  }, [route, embedded]);

  useEffect(() => {
    document.documentElement.style.setProperty('--candlelight', String(candlelight));
  }, [candlelight]);

  const shell = useMemo(() => ({ setTheme, setCandlelight }), []);

  // After a move to another page, keyboard and screen reader users land on its
  // heading, unless the page already put focus somewhere (a field to fill).
  const firstRoute = useRef(true);
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    const active = document.activeElement;
    if (active && active !== document.body && !active.closest('.topbar')) return;
    focusHeading();
  }, [route]);

  // The purple pill under the current page slides from link to link.
  const nav = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = nav.current;
    if (!el) return;
    const place = () => {
      const a = el.querySelector<HTMLElement>('a[aria-current="page"]');
      el.style.setProperty('--pill-on', a ? '1' : '0');
      if (!a) return;
      el.style.setProperty('--pill-x', `${a.offsetLeft}px`);
      el.style.setProperty('--pill-y', `${a.offsetTop}px`);
      el.style.setProperty('--pill-w', `${a.offsetWidth}px`);
      el.style.setProperty('--pill-h', `${a.offsetHeight}px`);
    };
    place();
    // Slide only after the first placement, never in from the corner.
    const ready = requestAnimationFrame(() => (el.dataset.ready = ''));
    void document.fonts?.ready.then(place);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(ready);
      window.removeEventListener('resize', place);
    };
  }, [route]);

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
      <div className="backdrop day" aria-hidden="true" />
      <div className="backdrop night nightfall" aria-hidden="true" />
      {theme === 'night' && <Stars />}
      <Scenery />

      <a
        className="skip-link no-print"
        href="#main"
        onClick={(e) => {
          // The address is the route here, so move focus without changing it.
          e.preventDefault();
          focusHeading();
        }}
      >
        Skip to the page
      </a>

      <header className="topbar no-print">
        <a className="wordmark" href={href('home')} aria-label="Phylactery, home">
          <span className="logo-badge" aria-hidden="true">
            <Ghost size={24} mood="happy" />
          </span>
          <span>Phylactery</span>
        </a>
        <nav className="nav" aria-label="Main" ref={nav}>
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
        <div className="route" key={route}>
          {route === 'home' && <Home />}
          {route === 'seal' && <Seal params={params} embedded={embedded} />}
          {route === 'watch' && <Watch params={params} />}
          {route === 'seance' && <Seance embedded={embedded} params={params} />}
          {route === 'guides' && <Guides anchor={anchor} />}
          {route === 'gallery' && <Gallery />}
        </div>
      </main>
      <HillScene />
    </ShellProvider>
  );
}
