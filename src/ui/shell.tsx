import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { parseJar, type JarFile } from '../core/jar.ts';

export type Route = 'home' | 'seal' | 'watch' | 'seance' | 'guides' | 'gallery';

// The gallery (the cast, for design review) exists only while developing.
const ROUTES: Route[] = ['home', 'seal', 'watch', 'seance', 'guides', ...(import.meta.env.DEV ? (['gallery'] as const) : [])];

interface HashRoute {
  route: Route;
  anchor: string;
  /** Query in the hash, e.g. #/watch?here=TOKEN from an email link. */
  params: URLSearchParams;
}

function readRoute(): HashRoute {
  const [pathAndQuery = '', anchor = ''] = window.location.hash.replace(/^#\/?/, '').split('#');
  const [path = '', query = ''] = pathAndQuery.split('?');
  const route = (ROUTES as string[]).includes(path) ? (path as Route) : 'home';
  return { route, anchor, params: new URLSearchParams(query) };
}

/**
 * Some pages hold what cannot be made again: freshly sealed cards before
 * they are printed, an opened jar before the circle has finished reading.
 * While such a page says so, leaving it asks first, whether by a link, the
 * Back button, or closing the tab.
 */
let leaveWarning: string | null = null;

/**
 * `inApp: false` when the page's state survives moving to another page of
 * the app (kept in memory), so only closing or reloading the tab is a loss.
 */
export function useLeaveWarning(message: string | null, { inApp = true }: { inApp?: boolean } = {}) {
  useEffect(() => {
    if (!message) return;
    if (inApp) leaveWarning = message;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      if (inApp) leaveWarning = null;
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [message, inApp]);
}

export function useHashRoute(): HashRoute {
  const [state, setState] = useState(readRoute);
  useEffect(() => {
    let current = window.location.href;
    const on = () => {
      if (leaveWarning && !window.confirm(leaveWarning)) {
        // Stay: put the address back without leaving the page.
        history.pushState(null, '', current);
        return;
      }
      leaveWarning = null;
      current = window.location.href;
      setState(readRoute());
      // A new page starts at the top at once; the page itself fades in.
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return state;
}

export function go(route: Route, anchor?: string) {
  window.location.hash = `/${route === 'home' ? '' : route}${anchor ? `#${anchor}` : ''}`;
}

export function href(route: Route): string {
  return `#/${route === 'home' ? '' : route}`;
}

/** A jar embedded in this very file, present when the page is a downloaded Grimoire. */
export function embeddedJar(): JarFile | null {
  const el = document.getElementById('phylactery-jar');
  if (!el?.textContent) return null;
  try {
    return parseJar(el.textContent);
  } catch {
    return null;
  }
}

interface Shell {
  setTheme: (t: 'day' | 'night') => void;
  /** 0..1, how much warm candlelight fills the night backdrop. */
  setCandlelight: (v: number) => void;
}

const ShellContext = createContext<Shell | null>(null);

export function ShellProvider({ value, children }: { value: Shell; children: ReactNode }) {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): Shell {
  const s = useContext(ShellContext);
  if (!s) throw new Error('useShell outside provider');
  return s;
}

/** Set the page atmosphere while a page is shown. */
export function useAtmosphere(theme: 'day' | 'night') {
  const shell = useShell();
  useEffect(() => {
    shell.setTheme(theme);
  }, [shell, theme]);
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, prefersReducedMotion() ? Math.min(ms, 60) : ms));
}
