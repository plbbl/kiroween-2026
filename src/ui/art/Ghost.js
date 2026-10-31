import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId } from 'react';
import { Emblem } from './Emblem.tsx';
const INK = '#261d3a';
// A wide dome with a gentle flare and four soft scallops at the hem.
const BODY = 'M62 16 C91 16 109 35 109 62 C109 86 111 104 114 117 C114 129 90 131 88 120 C86 131 64 131 62 120 C60 131 38 131 36 120 C34 131 10 129 10 117 C13 104 15 86 15 62 C15 35 33 16 62 16 Z';
/** Light, middle, shade and edge tones of each body. */
const TONES = {
    sheet: ['#ffffff', '#fcf8f9', '#efe7f4', '#d3c6e8'],
    witch: ['#ffffff', '#fcf8f9', '#efe7f4', '#d3c6e8'],
    franken: ['#f0fcf3', '#c6f0d3', '#a0dbb5', '#74bb8f'],
    skeleton: ['#504566', '#322a44', '#231c31', '#130e1c'],
    pumpkin: ['#ffd6a3', '#ffa352', '#f6852f', '#d6631b'],
    bat: ['#f3ecff', '#d5c0ff', '#b69bf6', '#8e70dc'],
    bow: ['#fff6fa', '#ffdbe9', '#f8bad3', '#e392b4'],
    mummy: ['#fffcf5', '#f7eedd', '#e7d8be', '#c9b493'],
};
// The centre of each costume's emblem sticker, clear of ribs and bandages.
const EMBLEM_AT = {
    sheet: [62, 101],
    witch: [62, 101],
    franken: [62, 101],
    skeleton: [94, 103],
    pumpkin: [62, 101],
    bat: [62, 101],
    bow: [62, 101],
    mummy: [62, 97],
};
const ARMS = [
    [17, 90, -24],
    [107, 90, 24],
];
/** Gradient ids for one ghost: React ids are made safe for `url(#…)`. */
function useIds() {
    const u = useId().replace(/[^a-zA-Z0-9]/g, '');
    const id = (name) => `g${u}${name}`;
    return { id, url: (name) => `url(#${id(name)})` };
}
function Defs({ ids, tones, rim }) {
    const [light, mid, shade, edge] = tones;
    const { id } = ids;
    return (_jsxs("defs", { children: [_jsxs("radialGradient", { id: id('body'), cx: "40%", cy: "24%", r: "82%", children: [_jsx("stop", { offset: "0", stopColor: light }), _jsx("stop", { offset: "0.48", stopColor: mid }), _jsx("stop", { offset: "0.8", stopColor: shade }), _jsx("stop", { offset: "1", stopColor: edge })] }), _jsxs("radialGradient", { id: id('arm'), cx: "40%", cy: "22%", r: "90%", children: [_jsx("stop", { offset: "0", stopColor: light }), _jsx("stop", { offset: "0.45", stopColor: mid }), _jsx("stop", { offset: "1", stopColor: edge })] }), _jsxs("linearGradient", { id: id('ao'), x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0.6", stopColor: edge, stopOpacity: "0" }), _jsx("stop", { offset: "1", stopColor: edge, stopOpacity: "0.32" })] }), _jsxs("radialGradient", { id: id('sheen'), children: [_jsx("stop", { offset: "0", stopColor: "#fff", stopOpacity: "0.8" }), _jsx("stop", { offset: "1", stopColor: "#fff", stopOpacity: "0" })] }), _jsxs("radialGradient", { id: id('rim'), children: [_jsx("stop", { offset: "0", stopColor: "#ffb25e", stopOpacity: rim }), _jsx("stop", { offset: "1", stopColor: "#ffb25e", stopOpacity: "0" })] }), _jsxs("radialGradient", { id: id('eye'), cx: "38%", cy: "30%", r: "78%", children: [_jsx("stop", { offset: "0", stopColor: "#5d5180" }), _jsx("stop", { offset: "0.55", stopColor: "#2a2142" }), _jsx("stop", { offset: "1", stopColor: "#120c1e" })] }), _jsxs("radialGradient", { id: id('blush'), children: [_jsx("stop", { offset: "0", stopColor: "#ff86ab", stopOpacity: "0.85" }), _jsx("stop", { offset: "0.6", stopColor: "#ff86ab", stopOpacity: "0.45" }), _jsx("stop", { offset: "1", stopColor: "#ff86ab", stopOpacity: "0" })] }), _jsxs("radialGradient", { id: id('floor'), children: [_jsx("stop", { offset: "0", stopColor: "#2a1650", stopOpacity: "0.32" }), _jsx("stop", { offset: "1", stopColor: "#2a1650", stopOpacity: "0" })] }), _jsx("clipPath", { id: id('clip'), children: _jsx("path", { d: BODY }) }), _jsxs("radialGradient", { id: id('purple'), cx: "35%", cy: "25%", r: "85%", children: [_jsx("stop", { offset: "0", stopColor: "#b98cff" }), _jsx("stop", { offset: "0.5", stopColor: "#8e47ff" }), _jsx("stop", { offset: "1", stopColor: "#5f26c9" })] }), _jsxs("radialGradient", { id: id('dark'), cx: "35%", cy: "25%", r: "85%", children: [_jsx("stop", { offset: "0", stopColor: "#5a5468" }), _jsx("stop", { offset: "0.6", stopColor: "#2e2a38" }), _jsx("stop", { offset: "1", stopColor: "#1b1822" })] }), _jsxs("radialGradient", { id: id('wing'), cx: "40%", cy: "30%", r: "85%", children: [_jsx("stop", { offset: "0", stopColor: "#8a64c8" }), _jsx("stop", { offset: "0.6", stopColor: "#5b3a94" }), _jsx("stop", { offset: "1", stopColor: "#3e2468" })] }), _jsxs("radialGradient", { id: id('pink'), cx: "35%", cy: "25%", r: "85%", children: [_jsx("stop", { offset: "0", stopColor: "#ffa3c3" }), _jsx("stop", { offset: "0.55", stopColor: "#ff5c93" }), _jsx("stop", { offset: "1", stopColor: "#d93673" })] }), _jsxs("radialGradient", { id: id('bone'), cx: "40%", cy: "28%", r: "80%", children: [_jsx("stop", { offset: "0", stopColor: "#ffffff" }), _jsx("stop", { offset: "0.6", stopColor: "#f7f0e3" }), _jsx("stop", { offset: "1", stopColor: "#ddd0b8" })] }), _jsxs("linearGradient", { id: id('metal'), x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0", stopColor: "#f1eff6" }), _jsx("stop", { offset: "0.5", stopColor: "#b9b5c6" }), _jsx("stop", { offset: "1", stopColor: "#8a8599" })] }), _jsxs("linearGradient", { id: id('stem'), x1: "0", y1: "0", x2: "1", y2: "1", children: [_jsx("stop", { offset: "0", stopColor: "#9a7a52" }), _jsx("stop", { offset: "1", stopColor: "#5e4228" })] }), _jsxs("radialGradient", { id: id('leaf'), cx: "35%", cy: "30%", r: "80%", children: [_jsx("stop", { offset: "0", stopColor: "#9be07a" }), _jsx("stop", { offset: "1", stopColor: "#3f9a3a" })] }), _jsxs("linearGradient", { id: id('band'), x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0", stopColor: "#fff3dc" }), _jsx("stop", { offset: "1", stopColor: "#dccbab" })] })] }));
}
/** One part drawn either as a soft material or as print line art. */
function Part({ d, fill, line, width = 2.4 }) {
    return _jsx("path", { d: d, fill: line ? '#fff' : fill, stroke: line ? INK : 'none', strokeWidth: line ? width : 0, strokeLinejoin: "round" });
}
function Eye({ ids, cx, cy, ry = 8.2, line }) {
    return (_jsxs("g", { children: [_jsx("ellipse", { cx: cx, cy: cy, rx: 6.4, ry: ry, fill: line ? INK : ids.url('eye') }), _jsx("circle", { cx: cx + 1.9, cy: cy - ry * 0.44, r: 2.4, fill: "#fff" }), !line && _jsx("circle", { cx: cx - 2.2, cy: cy + ry * 0.46, r: 1.1, fill: "#fff", opacity: "0.55" })] }));
}
const arc = (d, width = 2.5) => _jsx("path", { d: d, fill: "none", stroke: INK, strokeWidth: width, strokeLinecap: "round", strokeLinejoin: "round" });
function Face({ ids, mood, line, mouthY }) {
    const L = 45;
    const R = 79;
    const Y = 63;
    const m = mouthY;
    let eyes;
    switch (mood) {
        case 'happy':
            eyes = (_jsxs(_Fragment, { children: [arc(`M${L - 7} ${Y + 2} Q${L} ${Y - 5} ${L + 7} ${Y + 2}`, 3), arc(`M${R - 7} ${Y + 2} Q${R} ${Y - 5} ${R + 7} ${Y + 2}`, 3)] }));
            break;
        case 'sleep':
            eyes = (_jsxs(_Fragment, { children: [arc(`M${L - 7} ${Y} Q${L} ${Y + 5} ${L + 7} ${Y}`, 2.6), arc(`M${R - 7} ${Y} Q${R} ${Y + 5} ${R + 7} ${Y}`, 2.6)] }));
            break;
        case 'wink':
            eyes = (_jsxs(_Fragment, { children: [_jsx(Eye, { ids: ids, cx: L, cy: Y, line: line }), arc(`M${R - 7} ${Y + 1} Q${R} ${Y - 5} ${R + 7} ${Y + 1}`, 3)] }));
            break;
        case 'wow':
            eyes = (_jsxs(_Fragment, { children: [_jsx(Eye, { ids: ids, cx: L, cy: Y - 1, ry: 9.6, line: line }), _jsx(Eye, { ids: ids, cx: R, cy: Y - 1, ry: 9.6, line: line })] }));
            break;
        default:
            eyes = (_jsxs(_Fragment, { children: [_jsx(Eye, { ids: ids, cx: L, cy: Y, line: line }), _jsx(Eye, { ids: ids, cx: R, cy: Y, line: line })] }));
    }
    let mouth;
    switch (mood) {
        case 'happy':
            mouth = arc(`M56.5 ${m - 1} Q62 ${m + 5} 67.5 ${m - 1}`);
            break;
        case 'curious':
        case 'sleep':
            mouth = _jsx("ellipse", { cx: "62", cy: m + 1, rx: "2.2", ry: "2.5", fill: INK });
            break;
        case 'wow':
            mouth = (_jsxs("g", { children: [_jsx("ellipse", { cx: "62", cy: m + 2, rx: "3.8", ry: "4.6", fill: INK }), !line && _jsx("ellipse", { cx: "62", cy: m + 4, rx: "2.4", ry: "2", fill: "#ff7d9e" })] }));
            break;
        case 'worried':
        case 'sad':
            mouth = arc(`M57.5 ${m + 3} Q62 ${m - 1} 66.5 ${m + 3}`);
            break;
        default:
            mouth = arc(`M57.5 ${m} Q62 ${m + 4} 66.5 ${m}`);
    }
    const brows = mood === 'worried' || mood === 'sad';
    return (_jsxs(_Fragment, { children: [!line && (_jsxs(_Fragment, { children: [_jsx("ellipse", { cx: L - 9, cy: Y + 11, rx: "7.5", ry: "4.6", fill: ids.url('blush') }), _jsx("ellipse", { cx: R + 9, cy: Y + 11, rx: "7.5", ry: "4.6", fill: ids.url('blush') })] })), _jsx("g", { className: "ghost-eyes", children: eyes }), brows && (_jsxs(_Fragment, { children: [arc(`M${L - 7} ${Y - 10} L${L + 4} ${Y - 14}`, 2.6), arc(`M${R + 7} ${Y - 10} L${R - 4} ${Y - 14}`, 2.6)] })), mouth, !line && mood === 'worried' && (_jsx("path", { className: "ghost-sweat", d: "M101 38 C97 45 98 50 102 50 C106 50 107 45 101 38 Z", fill: "#8fd0ff", stroke: "#6fb6ec", strokeWidth: "0.8" })), !line && mood === 'sad' && (_jsxs(_Fragment, { children: [_jsx("path", { className: "ghost-tear", d: `M${L - 1} ${Y + 8} C${L - 4} ${Y + 14} ${L - 3} ${Y + 18} ${L} ${Y + 18} C${L + 3} ${Y + 18} ${L + 3} ${Y + 14} ${L - 1} ${Y + 8} Z`, fill: "#8fd0ff" }), _jsx("path", { className: "ghost-tear second", d: `M${R + 1} ${Y + 8} C${R - 2} ${Y + 14} ${R - 1} ${Y + 18} ${R + 2} ${Y + 18} C${R + 5} ${Y + 18} ${R + 5} ${Y + 14} ${R + 1} ${Y + 8} Z`, fill: "#8fd0ff" })] }))] }));
}
/** Costume pieces worn behind the body (wings) and in front of it (everything else). */
function Behind({ costume, ids, line }) {
    if (costume !== 'bat')
        return null;
    return (_jsxs(_Fragment, { children: [_jsx(Part, { line: line, fill: ids.url('wing'), d: "M20 60 C10 46 -2 46 -6 56 C-1 58 0 64 -3 71 C4 69 8 73 8 80 C12 75 17 75 19 80 C18 72 18 66 20 60 Z" }), _jsx(Part, { line: line, fill: ids.url('wing'), d: "M104 60 C114 46 126 46 130 56 C125 58 124 64 127 71 C120 69 116 73 116 80 C112 75 107 75 105 80 C106 72 106 66 104 60 Z" })] }));
}
function Front({ costume, ids, line }) {
    switch (costume) {
        case 'franken':
            return (_jsxs(_Fragment, { children: [_jsx(Part, { line: line, fill: ids.url('dark'), d: "M15 46 L15 24 C15 12 23 6 35 6 L89 6 C101 6 109 12 109 24 L109 46 L101 39 L94 46 L86 39 L78 46 L70 39 L62 46 L54 39 L46 46 L38 39 L30 46 L22 39 Z" }), !line && _jsx("path", { d: "M24 12 C40 9 70 8 96 11", fill: "none", stroke: "#fff", strokeOpacity: "0.18", strokeWidth: "3", strokeLinecap: "round" }), _jsxs("g", { stroke: line ? INK : '#3f7a57', strokeWidth: "2", strokeLinecap: "round", children: [_jsx("path", { d: "M74 52 L94 49" }), _jsx("path", { d: "M78 48 L79 55 M84 47 L85 54 M90 46 L91 53" })] }), [3, 113].map((x) => (_jsxs("g", { children: [_jsx("rect", { x: x, y: "66", width: "10", height: "10", rx: "2.5", fill: line ? '#fff' : ids.url('metal'), stroke: line ? INK : '#7d788c', strokeWidth: line ? 2 : 0.8 }), _jsx("rect", { x: x < 62 ? x - 2 : x + 7, y: "64", width: "5", height: "14", rx: "2", fill: line ? '#fff' : ids.url('metal'), stroke: line ? INK : '#7d788c', strokeWidth: line ? 2 : 0.8 })] }, x)))] }));
        case 'skeleton':
            return (_jsxs(_Fragment, { children: [_jsx(Part, { line: line, fill: ids.url('bone'), d: "M33 58 C33 41 46 33 62 33 C78 33 91 41 91 58 C91 68 87 72 85 78 C83 86 74 90 62 90 C50 90 41 86 39 78 C37 72 33 68 33 58 Z" }), _jsx("path", { d: "M59.4 78.5 L62 73.8 L64.6 78.5 Q62 80 59.4 78.5 Z", fill: INK }), _jsxs("g", { stroke: line ? INK : ids.url('bone'), strokeWidth: line ? 2.4 : 4.4, strokeLinecap: "round", fill: "none", children: [_jsx("path", { d: "M62 95 L62 121" }), [98, 106, 114].map((y) => (_jsxs("g", { children: [_jsx("path", { d: `M45 ${y} Q53 ${y + 3} 59 ${y + 1}` }), _jsx("path", { d: `M79 ${y} Q71 ${y + 3} 65 ${y + 1}` })] }, y)))] })] }));
        case 'pumpkin':
            return (_jsxs(_Fragment, { children: [_jsxs("g", { clipPath: ids.url('clip'), fill: "none", strokeLinecap: "round", children: [_jsx("path", { d: "M40 20 C29 48 29 98 37 126 M84 20 C95 48 95 98 87 126", stroke: line ? INK : '#c9561a', strokeOpacity: line ? 0.5 : 0.42, strokeWidth: "3" }), !line && _jsx("path", { d: "M43 22 C33 50 33 96 40 122 M87 22 C97 50 97 96 90 122", stroke: "#fff", strokeOpacity: "0.22", strokeWidth: "2" })] }), _jsx("path", { d: "M60 19 C58 10 61 3 69 0", fill: "none", stroke: line ? INK : ids.url('stem'), strokeWidth: line ? 2.4 : 7, strokeLinecap: "round" }), _jsx(Part, { line: line, fill: ids.url('leaf'), d: "M68 5 C73 -5 87 -6 92 -1 C87 8 75 11 68 5 Z" }), !line && _jsx("path", { d: "M70 4 C76 1 83 0 89 -1", fill: "none", stroke: "#2f7a2e", strokeOpacity: "0.5", strokeWidth: "1.2", strokeLinecap: "round" })] }));
        case 'witch':
            return (_jsxs("g", { transform: "rotate(-9 62 18)", children: [_jsx("ellipse", { cx: "62", cy: "19", rx: "50", ry: "10", fill: line ? '#fff' : ids.url('purple'), stroke: line ? INK : 'none', strokeWidth: line ? 2.4 : 0 }), !line && _jsx("ellipse", { cx: "62", cy: "21", rx: "46", ry: "6", fill: "#4b1ba8", opacity: "0.35" }), _jsx(Part, { line: line, fill: ids.url('purple'), d: "M38 17 C44 1 51 -17 69 -26 C76 -30 87 -29 93 -22 C85 -22 79 -18 79 -10 C79 0 82 8 86 17 C72 21 52 21 38 17 Z" }), _jsx("path", { d: "M40 10 C54 14 71 14 83 10 L85.5 16 C71 20 53 20 38.5 16 Z", fill: line ? INK : '#ffb547' }), !line && _jsx("path", { d: "M49 2 C53 -10 60 -18 68 -22", fill: "none", stroke: "#fff", strokeOpacity: "0.28", strokeWidth: "3", strokeLinecap: "round" })] }));
        case 'bat':
            return (_jsxs(_Fragment, { children: [_jsx(Part, { line: line, fill: ids.url('body'), d: "M27 33 C22 22 22 11 27 2 C36 8 43 16 48 23 C40 25 32 28 27 33 Z" }), _jsx(Part, { line: line, fill: ids.url('body'), d: "M97 33 C102 22 102 11 97 2 C88 8 81 16 76 23 C84 25 92 28 97 33 Z" }), !line && (_jsxs(_Fragment, { children: [_jsx("path", { d: "M30 25 C28 18 28 13 30 8 C35 12 39 17 41 21 C36 22 33 23 30 25 Z", fill: "#9b78e6", opacity: "0.7" }), _jsx("path", { d: "M94 25 C96 18 96 13 94 8 C89 12 85 17 83 21 C88 22 91 23 94 25 Z", fill: "#9b78e6", opacity: "0.7" })] }))] }));
        case 'bow':
            return (_jsxs("g", { transform: "translate(84 17) rotate(14)", children: [_jsx(Part, { line: line, fill: ids.url('pink'), d: "M0 0 C-5 -12 -22 -15 -25 -4 C-27 7 -12 10 0 0 Z" }), _jsx(Part, { line: line, fill: ids.url('pink'), d: "M0 0 C5 -12 22 -15 25 -4 C27 7 12 10 0 0 Z" }), _jsx("ellipse", { rx: "5.6", ry: "5.2", fill: line ? '#fff' : ids.url('pink'), stroke: line ? INK : '#c22a63', strokeWidth: line ? 2.2 : 0.8 }), !line && _jsx("path", { d: "M-19 -6 C-15 -9 -10 -8 -6 -4 M19 -6 C15 -9 10 -8 6 -4", fill: "none", stroke: "#fff", strokeOpacity: "0.4", strokeWidth: "1.6", strokeLinecap: "round" })] }));
        case 'mummy':
            return (_jsxs(_Fragment, { children: [_jsx("g", { clipPath: ids.url('clip'), strokeLinecap: "round", fill: "none", children: ['M4 38 L120 26', 'M4 86 L120 80', 'M4 108 L120 116', 'M10 126 L60 96'].map((d) => (_jsxs("g", { children: [_jsx("path", { d: d, stroke: line ? INK : ids.url('band'), strokeWidth: line ? 1.6 : 8, strokeOpacity: line ? 0.6 : 1 }), !line && _jsx("path", { d: d, stroke: "#b9a37c", strokeOpacity: "0.35", strokeWidth: "1", transform: "translate(0 3.6)" })] }, d))) }), _jsx(Part, { line: line, fill: ids.url('band'), d: "M106 34 C114 31 121 36 124 43 L118 46 C115 41 111 39 106 40 Z", width: 2 })] }));
        default:
            return null;
    }
}
/** The emblem, worn as a small round sticker on the belly. */
function Sticker({ ids, emblem, at: [x, y], line }) {
    return (_jsxs("g", { children: [!line && _jsx("ellipse", { cx: x, cy: y + 1.8, rx: "10.6", ry: "10.2", fill: "#2a1650", opacity: "0.16" }), _jsx("circle", { cx: x, cy: y, r: "10.4", fill: line ? '#fff' : ids.url('bone'), stroke: line ? INK : '#fff', strokeOpacity: line ? 1 : 0.7, strokeWidth: line ? 1.8 : 0.8 }), _jsx("g", { transform: `translate(${x - 6.8} ${y - 6.8})`, children: _jsx(Emblem, { name: emblem, size: 13.6, color: line ? INK : '#4b2f86' }) })] }));
}
export function Ghost({ costume = 'sheet', mood = 'open', emblem, size = 120, float = false, phase = 0, line = false, tilt = 0, shadow = false, rim = 0.32, className = '', title, }) {
    const ids = useIds();
    const style = { '--phase': `${-phase}s`, width: size, height: (size * 172) / 136 };
    const arms = costume !== 'bat';
    return (_jsxs("svg", { className: `ghost${float ? ' float' : ''}${line ? ' line' : ''} ${className}`, viewBox: "-6 -32 136 172", style: style, role: "img", "aria-label": title ?? `A little ${costume === 'sheet' ? '' : costume + ' '}ghost`, children: [_jsx(Defs, { ids: ids, tones: TONES[costume], rim: rim }), shadow && _jsx("ellipse", { className: "ghost-shadow", cx: "62", cy: "136", rx: "40", ry: "6", fill: line ? 'none' : ids.url('floor') }), _jsx("g", { className: "ghost-bob", children: _jsx("g", { transform: `rotate(${tilt} 62 70)`, children: _jsxs("g", { className: "ghost-body", children: [_jsx(Behind, { costume: costume, ids: ids, line: line }), line && arms && ARMS.map(([x, y, r]) => _jsx("ellipse", { cx: x, cy: y, rx: "9", ry: "7.2", transform: `rotate(${r} ${x} ${y})`, fill: "#fff", stroke: INK, strokeWidth: "2.6" }, x)), _jsx("path", { d: BODY, fill: line ? '#fff' : ids.url('body'), stroke: line ? INK : 'none', strokeWidth: line ? 2.8 : 0, strokeLinejoin: "round" }), !line && (_jsxs("g", { clipPath: ids.url('clip'), children: [_jsx("rect", { x: "0", y: "16", width: "124", height: "116", fill: ids.url('ao') }), _jsx("ellipse", { cx: "44", cy: "34", rx: "26", ry: "15", transform: "rotate(-24 44 34)", fill: ids.url('sheen') }), _jsx("circle", { cx: "118", cy: "92", r: "50", fill: ids.url('rim') })] })), !line &&
                                arms &&
                                ARMS.map(([x, y, r]) => (_jsxs("g", { children: [_jsx("ellipse", { cx: x + (x < 62 ? 5 : -5), cy: y + 6, rx: "9", ry: "4.5", fill: TONES[costume][3], opacity: "0.4", clipPath: ids.url('clip') }), _jsx("ellipse", { cx: x, cy: y, rx: "9", ry: "7.2", transform: `rotate(${r} ${x} ${y})`, fill: ids.url('arm') })] }, x))), _jsx(Front, { costume: costume, ids: ids, line: line }), _jsx(Face, { ids: ids, mood: mood, line: line, mouthY: costume === 'skeleton' ? 83 : 71 }), emblem && _jsx(Sticker, { ids: ids, emblem: emblem, at: EMBLEM_AT[costume], line: line })] }) }) })] }));
}
/**
 * One little hand, drawn on its own so it can sit in front of an edge the
 * ghost is peeking over, while the ghost itself stays behind.
 */
export function GhostHand({ costume = 'sheet', size = 20 }) {
    const { id, url } = useIds();
    const [light, mid, , edge] = TONES[costume];
    return (_jsxs("svg", { className: "ghost-hand", viewBox: "0 0 24 20", width: size, height: (size * 20) / 24, "aria-hidden": "true", children: [_jsx("defs", { children: _jsxs("radialGradient", { id: id('hand'), cx: "40%", cy: "25%", r: "90%", children: [_jsx("stop", { offset: "0", stopColor: light }), _jsx("stop", { offset: "0.5", stopColor: mid }), _jsx("stop", { offset: "1", stopColor: edge })] }) }), _jsx("ellipse", { cx: "12", cy: "16.5", rx: "9.5", ry: "2.6", fill: "#2a1650", opacity: "0.22" }), _jsx("ellipse", { cx: "12", cy: "10", rx: "10.5", ry: "7.6", fill: url('hand') })] }));
}
