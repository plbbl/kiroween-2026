import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Stars } from './ui/art/Decor.tsx';
import { Ghost } from './ui/art/Ghost.tsx';
import { embeddedJar, href, ShellProvider, useHashRoute } from './ui/shell.tsx';
import { sound } from './ui/sound.ts';
import { Gallery } from './pages/Gallery.tsx';
import { Guides } from './pages/Guides.tsx';
import { Home } from './pages/Home.tsx';
import { Seal } from './pages/seal/Seal.tsx';
import { Seance } from './pages/seance/Seance.tsx';
import { Watch } from './pages/watch/Watch.tsx';
const TITLES = {
    seal: 'Seal a jar',
    watch: 'Still here?',
    seance: 'Séance',
    guides: 'Guides',
    gallery: 'The cast',
};
const NAV = [
    { route: 'seal', label: 'Seal' },
    { route: 'watch', label: 'Watch' },
    { route: 'seance', label: 'Séance' },
    { route: 'guides', label: 'Guides' },
];
function SoundIcon({ on }) {
    return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M4 9.5 H8 L12.5 5.5 V18.5 L8 14.5 H4 Z", fill: "currentColor" }), on ? (_jsx("path", { d: "M15.5 9 C17 10.5 17 13.5 15.5 15 M18 6.5 C21 9.5 21 14.5 18 17.5", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })) : (_jsx("path", { d: "M16 9.5 L20.5 14 M20.5 9.5 L16 14", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }))] }));
}
export function App() {
    const embedded = useMemo(() => embeddedJar(), []);
    const { route: hashRoute, anchor, params } = useHashRoute();
    // A downloaded Grimoire opens straight into its séance.
    const route = embedded && hashRoute === 'home' ? 'seance' : hashRoute;
    // Start in the right light, so a jar file opens at night without a flash of day.
    const [theme, setTheme] = useState(() => (route === 'seance' ? 'night' : 'day'));
    const [candlelight, setCandlelight] = useState(0);
    const [soundOn, setSoundOn] = useState(false);
    useLayoutEffect(() => {
        document.body.dataset.theme = theme;
    }, [theme]);
    useEffect(() => {
        const page = embedded && route === 'seance' ? `${embedded.owner}’s jar` : TITLES[route];
        document.title = page ? `${page} · Phylactery` : 'Phylactery';
    }, [route, embedded]);
    useEffect(() => {
        document.documentElement.style.setProperty('--candlelight', String(candlelight));
    }, [candlelight]);
    const shell = useMemo(() => ({ setTheme, setCandlelight }), []);
    // The purple pill under the current page slides from link to link.
    const nav = useRef(null);
    useLayoutEffect(() => {
        const el = nav.current;
        if (!el)
            return;
        const place = () => {
            const a = el.querySelector('a[aria-current="page"]');
            el.style.setProperty('--pill-on', a ? '1' : '0');
            if (!a)
                return;
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
            if (route === 'seance')
                sound.startDrone();
        }
    };
    return (_jsxs(ShellProvider, { value: shell, children: [_jsx("div", { className: "backdrop day", "aria-hidden": "true" }), _jsx("div", { className: "backdrop night", "aria-hidden": "true" }), theme === 'night' && _jsx(Stars, {}), _jsxs("header", { className: "topbar no-print", children: [_jsxs("a", { className: "wordmark", href: href('home'), "aria-label": "Phylactery, home", children: [_jsx("span", { className: "logo-badge", "aria-hidden": "true", children: _jsx(Ghost, { size: 24, mood: "happy" }) }), _jsx("span", { children: "Phylactery" })] }), _jsx("nav", { className: "nav", "aria-label": "Main", ref: nav, children: NAV.map((n) => (_jsx("a", { href: href(n.route), "aria-current": route === n.route ? 'page' : undefined, children: n.label }, n.route))) }), _jsx("button", { className: "icon-btn", onClick: toggleSound, "aria-pressed": soundOn, "aria-label": soundOn ? 'Turn sound off' : 'Turn sound on', children: _jsx(SoundIcon, { on: soundOn }) })] }), _jsx("main", { id: "main", children: _jsxs("div", { className: "route", children: [route === 'home' && _jsx(Home, {}), route === 'seal' && _jsx(Seal, { params: params, embedded: embedded }), route === 'watch' && _jsx(Watch, { params: params }), route === 'seance' && _jsx(Seance, { embedded: embedded, params: params }), route === 'guides' && _jsx(Guides, { anchor: anchor }), route === 'gallery' && _jsx(Gallery, {})] }, route) })] }));
}
