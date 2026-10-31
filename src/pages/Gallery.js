import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { COSTUMES, EMBLEMS } from '../core/buddy.ts';
import { Candle } from '../ui/art/Candle.tsx';
import { Sparkles, Stars } from '../ui/art/Decor.tsx';
import { Ghost } from '../ui/art/Ghost.tsx';
import { Jar } from '../ui/art/Jar.tsx';
import { WaxSeal } from '../ui/art/WaxSeal.tsx';
import { useAtmosphere } from '../ui/shell.tsx';
const MOODS = ['open', 'curious', 'happy', 'sleep', 'wow', 'worried', 'sad', 'wink'];
/** The cast, for design review. Not linked from the app: open #/gallery. */
export function Gallery() {
    const [night, setNight] = useState(false);
    useAtmosphere(night ? 'night' : 'day');
    const [jar, setJar] = useState('sealed');
    const [wax, setWax] = useState('whole');
    const [burst, setBurst] = useState(0);
    return (_jsxs("div", { className: "page gallery", children: [night && _jsx(Stars, {}), _jsxs("div", { className: "wrap stack", style: { '--gap': '40px' }, children: [_jsxs("div", { className: "row", children: [_jsx("h1", { children: "The cast" }), _jsx("button", { className: "btn small", onClick: () => setNight(!night), children: night ? 'Day' : 'Night' })] }), _jsx("div", { className: "row", style: { gap: 24 }, children: COSTUMES.map((c, i) => (_jsxs("div", { className: "center", children: [_jsx(Ghost, { costume: c, emblem: EMBLEMS[i], size: 110, float: true, phase: i * 0.7, shadow: true }), _jsx("p", { className: "faint", children: c })] }, c))) }), _jsx("div", { className: "row", style: { gap: 24 }, children: MOODS.map((m, i) => (_jsxs("div", { className: "center", children: [_jsx(Ghost, { mood: m, size: 96, float: true, phase: i }), _jsx("p", { className: "faint", children: m })] }, m))) }), _jsx("div", { className: "row", style: { gap: 24, background: '#fff', padding: 20, borderRadius: 24 }, children: COSTUMES.map((c, i) => (_jsx(Ghost, { costume: c, emblem: EMBLEMS[i + 2], size: 90, line: true }, c))) }), _jsxs("div", { className: "row", style: { gap: 30, alignItems: 'flex-end' }, children: [_jsx(Candle, { lit: false, size: 70 }), _jsx(Candle, { lit: true, size: 70, phase: 0.4 }), _jsx(Candle, { lit: true, justLit: true, size: 70, phase: 0.8 }, burst), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Jar, { initials: "JA", state: jar, wax: wax, warmth: jar === 'sealed' ? 0.2 : 1, size: 240 }), _jsx(Sparkles, { burst: burst })] }), _jsx(WaxSeal, { initials: "JA", size: 90, state: wax })] }), _jsxs("div", { className: "row", children: [['sealed', 'stirring', 'open'].map((s) => (_jsx("button", { className: "btn small", onClick: () => setJar(s), children: s }, s))), ['whole', 'pressing', 'cracking', 'broken'].map((s) => (_jsx("button", { className: "btn small", onClick: () => setWax(s), children: s }, s))), _jsx("button", { className: "btn small primary", onClick: () => setBurst((b) => b + 1), children: "Sparkle" })] })] })] }));
}
