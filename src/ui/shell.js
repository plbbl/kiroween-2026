import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { parseJar } from '../core/jar.ts';
// The gallery (the cast, for design review) exists only while developing.
const ROUTES = ['home', 'seal', 'watch', 'seance', 'guides', ...(import.meta.env.DEV ? ['gallery'] : [])];
function readRoute() {
    const [pathAndQuery = '', anchor = ''] = window.location.hash.replace(/^#\/?/, '').split('#');
    const [path = '', query = ''] = pathAndQuery.split('?');
    const route = ROUTES.includes(path) ? path : 'home';
    return { route, anchor, params: new URLSearchParams(query) };
}
/**
 * Some pages hold what cannot be made again: freshly sealed cards before
 * they are printed, an opened jar before the circle has finished reading.
 * While such a page says so, leaving it asks first, whether by a link, the
 * Back button, or closing the tab.
 */
let leaveWarning = null;
/**
 * `inApp: false` when the page's state survives moving to another page of
 * the app (kept in memory), so only closing or reloading the tab is a loss.
 */
export function useLeaveWarning(message, { inApp = true } = {}) {
    useEffect(() => {
        if (!message)
            return;
        if (inApp)
            leaveWarning = message;
        const onUnload = (e) => e.preventDefault();
        window.addEventListener('beforeunload', onUnload);
        return () => {
            if (inApp)
                leaveWarning = null;
            window.removeEventListener('beforeunload', onUnload);
        };
    }, [message, inApp]);
}
export function useHashRoute() {
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
export function go(route, anchor) {
    window.location.hash = `/${route === 'home' ? '' : route}${anchor ? `#${anchor}` : ''}`;
}
export function href(route) {
    return `#/${route === 'home' ? '' : route}`;
}
/** A jar embedded in this very file, present when the page is a downloaded Grimoire. */
export function embeddedJar() {
    const el = document.getElementById('phylactery-jar');
    if (!el?.textContent)
        return null;
    try {
        return parseJar(el.textContent);
    }
    catch {
        return null;
    }
}
const ShellContext = createContext(null);
export function ShellProvider({ value, children }) {
    return _jsx(ShellContext.Provider, { value: value, children: children });
}
export function useShell() {
    const s = useContext(ShellContext);
    if (!s)
        throw new Error('useShell outside provider');
    return s;
}
/** Set the page atmosphere while a page is shown. */
export function useAtmosphere(theme) {
    const shell = useShell();
    useEffect(() => {
        shell.setTheme(theme);
    }, [shell, theme]);
}
export function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
export function wait(ms) {
    return new Promise((r) => setTimeout(r, prefersReducedMotion() ? Math.min(ms, 60) : ms));
}
