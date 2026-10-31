import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { circleBuddies } from '../../core/buddy.ts';
import { CardError, parseCard } from '../../core/cards.ts';
import { checkShard, JarError, jarIdBytes, openJar } from '../../core/jar.ts';
import { DEMO_CARDS, DEMO_JAR, isDemo } from '../../demo/demo.ts';
import { Candle } from '../../ui/art/Candle.tsx';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { Ghost } from '../../ui/art/Ghost.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { initialsOf } from '../../ui/art/WaxSeal.tsx';
import { BuddyCard } from '../../ui/components/Cards.tsx';
import { capitalised, numberWord } from '../../ui/text.ts';
import { CardInput } from '../../ui/components/CardInput.tsx';
import { jarFromText } from '../../ui/grimoire.ts';
import { href, useAtmosphere, useShell, wait } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';
import { watchApi } from '../../ui/watchApi.ts';
import { Reveal } from './Reveal.tsx';
const REFUSALS = {
    'other-jar': 'That card belongs to a different jar.',
    'unknown-holder': 'That card doesn’t match anyone in this circle.',
    duplicate: 'That card is already here.',
};
export function Seance({ embedded, params }) {
    useAtmosphere('night');
    const shell = useShell();
    const [jar, setJar] = useState(embedded);
    // A friend's link from the watch's email: the jar the owner left with it.
    const token = embedded ? null : params.get('jar');
    const [fetching, setFetching] = useState(!!token);
    const [linkError, setLinkError] = useState('');
    useEffect(() => {
        if (!token)
            return;
        let live = true;
        watchApi
            .openJar(token)
            .then((j) => live && setJar(j))
            .catch((e) => live && setLinkError(e instanceof Error ? e.message : 'That link did not open a jar.'))
            .finally(() => live && setFetching(false));
        return () => {
            live = false;
        };
    }, [token]);
    useEffect(() => {
        sound.startDrone();
        return () => {
            sound.stopDrone();
            shell.setCandlelight(0);
        };
    }, [shell]);
    if (fetching) {
        return (_jsx("div", { className: "page seance-page", children: _jsxs("section", { className: "narrow center", children: [_jsx(Ghost, { mood: "open", size: 110, float: true }), _jsx("p", { className: "lede", children: "Fetching the jar\u2026" })] }) }));
    }
    if (!jar)
        return _jsx(Choose, { onChoose: setJar, notice: linkError });
    return _jsx(Circle, { jar: jar, onLeave: embedded ? undefined : () => setJar(null) }, jar.jarId);
}
function Choose({ onChoose, notice = '' }) {
    const [error, setError] = useState(notice);
    const [over, setOver] = useState(false);
    const readFile = async (file) => {
        setError('');
        try {
            onChoose(jarFromText(await file.text()));
        }
        catch (e) {
            setError(e instanceof JarError ? e.message : 'That file isn’t a jar.');
        }
    };
    return (_jsxs("div", { className: "page seance-page", children: [_jsxs("section", { className: "narrow center", children: [_jsx("p", { className: "tag pop", children: "s\u00E9ance" }), _jsx("h1", { className: "pop", style: { '--d': '100ms' }, children: "Gather around" }), _jsx("p", { className: "lede rise", style: { '--d': '200ms' }, children: "Each friend\u2019s card lights a candle. Enough candles, and the little ghost wakes up." })] }), _jsxs("section", { className: "choose wrap", children: [_jsxs("button", { type: "button", className: "choose-card card pop", style: { '--d': '300ms' }, onClick: () => onChoose(DEMO_JAR), children: [_jsx("span", { className: "choose-art", children: _jsx(Jar, { initials: "JA", size: 130, warmth: 0.4 }) }), _jsx("span", { className: "tag", children: "try it" }), _jsx("span", { className: "choose-title", children: "June\u2019s jar" }), _jsx("span", { className: "muted", children: "June sealed hers with five cards. They\u2019re on the table. Any three open it." })] }), _jsxs("label", { className: `choose-card card drop pop${over ? ' over' : ''}`, style: { '--d': '420ms' }, onDragOver: (e) => {
                            e.preventDefault();
                            setOver(true);
                        }, onDragLeave: () => setOver(false), onDrop: (e) => {
                            e.preventDefault();
                            setOver(false);
                            const f = e.dataTransfer.files[0];
                            if (f)
                                void readFile(f);
                        }, children: [_jsx("input", { type: "file", accept: ".html,.json,text/html,application/json", onChange: (e) => {
                                    const f = e.target.files?.[0];
                                    if (f)
                                        void readFile(f);
                                    e.target.value = '';
                                } }), _jsx("span", { className: "choose-art", children: _jsx(Ghost, { costume: "witch", mood: "wow", size: 92, float: true }) }), _jsx("span", { className: "tag", children: "your circle" }), _jsx("span", { className: "choose-title", children: "A jar you were given" }), _jsx("span", { className: "muted", children: "Drop the jar file here, or tap to choose it. It is read on this device and nowhere else." })] })] }), error && (_jsx("p", { className: "error center", role: "alert", children: error }))] }));
}
/**
 * Candles stand evenly around the rug. 90° is the front, nearest the
 * viewer; no candle stands right behind the jar.
 */
function candleAngles(k) {
    const start = k % 2 === 1 ? 90 : 90 + 180 / k;
    return Array.from({ length: k }, (_, i) => (start + (i * 360) / k) % 360);
}
/** A buddy flying from a card on the table to its candle. */
function FlyingBuddy({ flight, onDone }) {
    const [arrived, setArrived] = useState(false);
    useLayoutEffect(() => {
        const raf = requestAnimationFrame(() => requestAnimationFrame(() => setArrived(true)));
        const t = setTimeout(onDone, 720);
        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(t);
        };
    }, [onDone]);
    const size = 70;
    const at = arrived ? flight.to : flight.from;
    const style = {
        left: at.left + at.width / 2 - size / 2,
        top: at.top + at.height / 2 - size / 2,
        transform: arrived ? 'scale(0.7) rotate(-8deg)' : 'scale(1.1)',
    };
    return (_jsx("div", { className: "flying", style: style, "aria-hidden": "true", children: _jsx(Ghost, { costume: flight.buddy.costume, emblem: flight.buddy.emblem, mood: "happy", size: size }) }));
}
function Circle({ jar, onLeave }) {
    const shell = useShell();
    const [offered, setOffered] = useState([]);
    const [justLit, setJustLit] = useState(null);
    const [phase, setPhase] = useState('gathering');
    const [wax, setWax] = useState('whole');
    const [opened, setOpened] = useState(null);
    const [announce, setAnnounce] = useState('');
    const [failure, setFailure] = useState('');
    const [burst, setBurst] = useState(0);
    const [flight, setFlight] = useState(null);
    const candleRefs = useRef([]);
    // The latest circle, readable from callbacks without re-creating them.
    const offeredRef = useRef([]);
    useEffect(() => {
        offeredRef.current = offered;
    }, [offered]);
    const k = jar.threshold;
    const demo = isDemo(jar);
    const angles = useMemo(() => candleAngles(k), [k]);
    const buddies = useMemo(() => circleBuddies(jarIdBytes(jar), jar.holders.map((h) => h.x)), [jar]);
    const first = jar.owner.split(/\s+/)[0] ?? jar.owner;
    const sealed = new Date(jar.sealedAt);
    const sealedOn = Number.isNaN(sealed.getTime()) ? '' : sealed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    useEffect(() => {
        shell.setCandlelight(phase === 'gathering' ? offered.length / k : 1);
    }, [shell, offered.length, k, phase]);
    const open = useCallback(async (circle) => {
        setPhase('waking');
        setAnnounce('Every candle is lit. The jar is waking up.');
        try {
            const [result] = await Promise.all([openJar(jar, circle.map((o) => o.shard)), wait(1500)]);
            setWax('cracking');
            sound.crack();
            await wait(600);
            setWax('broken');
            setOpened(result);
            setPhase('open');
            setBurst((b) => b + 1);
            sound.pop();
            setTimeout(() => sound.chime(), 180);
            setAnnounce('The seal is broken. The jar is open.');
            await wait(2600);
            setPhase('revealed');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        catch (e) {
            setPhase('gathering');
            setFailure(e instanceof Error ? e.message : 'The jar would not open.');
        }
    }, [jar]);
    const offer = useCallback((text, from) => {
        setFailure('');
        let card;
        try {
            card = parseCard(text);
        }
        catch (e) {
            return e instanceof CardError ? e.message : 'That card could not be read.';
        }
        if (card.kind === 'seal')
            return 'That’s a private seal, from the inside of a card. Keep it for the letters.';
        if (card.kind === 'key')
            return `That’s ${first}’s own key, for updating the jar. The circle opens it with their cards.`;
        const current = offeredRef.current;
        if (current.length >= k)
            return 'Every candle is already lit.';
        const check = checkShard(jar, card, current.map((o) => o.shard));
        if (!check.ok)
            return REFUSALS[check.reason] ?? 'That card was refused.';
        const next = [...current, { shard: card, holder: check.holder }];
        offeredRef.current = next;
        const light = () => {
            setOffered(next);
            setJustLit(next.length - 1);
            sound.strike();
            setTimeout(() => sound.ignite(), 80);
            setAnnounce(`${check.holder.name} is here. ${next.length} of ${k} candles lit.`);
            if (next.length === k)
                void open(next);
        };
        const target = candleRefs.current[next.length - 1];
        const buddy = buddies.get(check.holder.x);
        if (from && target && buddy) {
            setFlight({ buddy, from, to: target.getBoundingClientRect(), id: Date.now() });
            setTimeout(light, 620);
        }
        else {
            light();
        }
        return null;
    }, [jar, k, open, buddies, first]);
    const endFlight = useCallback(() => setFlight(null), []);
    if (phase === 'revealed' && opened) {
        return _jsx(Reveal, { jar: jar, opened: opened, circle: offered.map((o) => o.holder.name), buddies: buddies });
    }
    const jarState = phase === 'open' ? 'open' : phase === 'waking' || offered.length > 0 ? 'stirring' : 'sealed';
    const remaining = k - offered.length;
    const here = new Set(offered.map((o) => o.holder.x));
    return (_jsxs("div", { className: `page seance-page phase-${phase}`, children: [_jsx("p", { className: "visually-hidden", "aria-live": "assertive", children: announce }), flight && _jsx(FlyingBuddy, { flight: flight, onDone: endFlight }, flight.id), _jsxs("section", { className: "narrow center circle-head", children: [_jsx("p", { className: "tag pop", children: sealedOn ? `sealed ${sealedOn}` : 'séance' }), _jsxs("h1", { className: "pop", style: { '--d': '80ms' }, children: [first, "\u2019s jar"] }), _jsxs("p", { className: "lede rise", style: { '--d': '180ms' }, children: ["Any ", numberWord(k), " of ", numberWord(jar.total), " friends can open it."] })] }), _jsxs("div", { className: "altar", style: { '--lit': offered.length / k }, children: [_jsxs("svg", { className: "rug", viewBox: "0 0 1000 300", preserveAspectRatio: "none", "aria-hidden": "true", children: [_jsx("defs", { children: _jsxs("radialGradient", { id: "rug-fill", cx: "50%", cy: "50%", r: "50%", children: [_jsx("stop", { offset: "0%", stopColor: "#3b2470" }), _jsx("stop", { offset: "100%", stopColor: "#24163f" })] }) }), _jsx("ellipse", { cx: "500", cy: "150", rx: "470", ry: "138", fill: "url(#rug-fill)" }), _jsx("ellipse", { cx: "500", cy: "150", rx: "440", ry: "122", fill: "none", stroke: "#9b6dff", strokeOpacity: "0.55", strokeWidth: "3", strokeDasharray: "1 12", strokeLinecap: "round", vectorEffect: "non-scaling-stroke" }), _jsx("ellipse", { className: "rug-ring", cx: "500", cy: "150", rx: "440", ry: "122", fill: "none", strokeWidth: "4", strokeDasharray: "1 12", strokeLinecap: "round", vectorEffect: "non-scaling-stroke" })] }), _jsx("div", { className: "altar-glow" }), angles.map((deg, i) => {
                        const a = (deg * Math.PI) / 180;
                        const x = 50 + Math.cos(a) * 40;
                        const y = 62 + Math.sin(a) * 20;
                        const o = offered[i];
                        const buddy = o ? buddies.get(o.holder.x) : undefined;
                        return (_jsxs("div", { ref: (el) => {
                                candleRefs.current[i] = el;
                            }, className: "spot", style: { left: `${x}%`, top: `${y}%`, zIndex: Math.round(y * 10) }, children: [buddy && (_jsx("div", { className: `spot-buddy${Math.cos(a) < -0.2 ? ' left' : ''}${Math.abs(Math.cos(a)) <= 0.2 ? ' front' : ''}`, children: _jsx(Ghost, { costume: buddy.costume, emblem: buddy.emblem, tilt: buddy.tilt, mood: phase === 'open' ? 'happy' : 'open', size: 72, float: true, phase: i * 0.7, rim: 0.6 }) })), _jsx(Candle, { lit: !!o, justLit: justLit === i, phase: i * 0.83, size: 74, label: o ? `${o.holder.name}'s candle, lit` : 'A sleeping candle' }), _jsx("span", { className: `spot-name${o ? ' shown' : ''}`, children: o?.holder.name ?? '' })] }, i));
                    }), _jsxs("div", { className: "altar-jar", style: { zIndex: 600 }, children: [_jsx(Jar, { initials: initialsOf(jar.owner), state: jarState, wax: wax, warmth: phase === 'gathering' ? offered.length / k : 1, size: 210 }), _jsx(Sparkles, { burst: burst, radius: 200, count: 22 })] })] }), _jsx("section", { className: "narrow offering", children: phase === 'gathering' ? (_jsxs(_Fragment, { children: [!demo && (_jsx("ul", { className: "roster", "aria-label": "Who is here", children: jar.holders.map((h) => {
                                const b = buddies.get(h.x);
                                return (_jsxs("li", { className: here.has(h.x) ? 'here' : '', children: [_jsx(Ghost, { costume: b.costume, emblem: b.emblem, mood: here.has(h.x) ? 'happy' : 'sleep', size: 30 }), _jsx("span", { children: h.name })] }, h.x));
                            }) })), _jsxs("div", { className: "card offer-card", children: [_jsx("h2", { className: "center", children: offered.length === 0 ? 'Who’s here first?' : `${capitalised(numberWord(remaining))} more to go` }), demo && _jsx(DemoTable, { jar: jar, offered: offered, buddies: buddies, onOffer: offer }), _jsx(CardInput, { kind: "shard", onCard: (t) => offer(t) }), _jsx("p", { className: "faint far-away", children: "Someone far away? They can read you the 30 words on their card over the phone." }), failure && (_jsx("p", { className: "error", role: "alert", children: failure }))] }), !demo && (_jsxs("p", { className: "note circle-note", children: [_jsx(Ghost, { size: 30, mood: "wink" }), _jsxs("span", { children: [first, " gave each of you a card. The jar opens only when ", numberWord(k), " of you offer yours here. What you type stays on this device, and this page works without the internet."] })] })), !demo && !onLeave && (_jsxs("p", { className: "center faint owner-link", children: ["Sealed this jar yourself? ", _jsx("a", { href: `${href('seal')}?update`, children: "Update it with your key" }), "."] })), onLeave && (_jsx("p", { className: "center", children: _jsx("button", { type: "button", className: "text-btn quiet", onClick: onLeave, children: "Choose another jar" }) }))] })) : (_jsx("p", { className: "center waking-text pop", children: phase === 'waking' ? 'Wake up, little ghost…' : 'It’s open!' }, phase)) })] }));
}
function DemoTable({ jar, offered, buddies, onOffer, }) {
    const [note, setNote] = useState('');
    const [picked, setPicked] = useState(null);
    const used = new Set(offered.map((o) => o.holder.name));
    return (_jsxs("div", { className: "demo-table", children: [_jsxs("p", { className: "faint center", children: ["The cards are on the table. Tap any ", numberWord(jar.threshold), "."] }), _jsx("div", { className: "demo-cards", children: DEMO_CARDS.map((c, i) => {
                    const holder = jar.holders.find((h) => h.name === c.name);
                    return (_jsx(BuddyCard, { name: c.name, buddy: buddies.get(holder.x), index: i, total: DEMO_CARDS.length, className: `demo-card${used.has(c.name) ? ' used' : ''}${picked === c.name ? ' picked' : ''}`, disabled: used.has(c.name), style: { '--rot': `${[-4, 3, -2, 4, -3][i]}deg` }, onClick: (e) => {
                            const refused = onOffer(c.shard, e.currentTarget.getBoundingClientRect());
                            setNote(refused ?? '');
                            if (!refused)
                                setPicked(c.name);
                        } }, c.name));
                }) }), note && _jsx("p", { className: "error center", children: note }), _jsx("p", { className: "faint center", children: "or offer a real card below" })] }));
}
