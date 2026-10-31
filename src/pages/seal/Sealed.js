import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { circleBuddies } from '../../core/buddy.ts';
import { verifyCircle } from '../../core/jar.ts';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { EmblemIcon } from '../../ui/art/Emblem.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { initialsOf } from '../../ui/art/WaxSeal.tsx';
import { BuddyCard, EnvelopeMark, PrintableCard, PrintableKey } from '../../ui/components/Cards.tsx';
import { capitalised, numberWord } from '../../ui/text.ts';
import { canMakeGrimoire, download, makeGrimoire, safeFilename } from '../../ui/grimoire.ts';
import { href, useLeaveWarning } from '../../ui/shell.tsx';
import { ApiError, jarHandoff, watchApi, watchAvailable } from '../../ui/watchApi.ts';
function combos(n, k) {
    let r = 1;
    for (let i = 1; i <= k; i++)
        r = (r * (n - k + i)) / i;
    return Math.round(r);
}
export function Sealed({ result, onStartOver }) {
    const { jar, cards } = result;
    const buddies = useMemo(() => circleBuddies(cards[0].shard.jarId, cards.map((c) => c.x)), [cards]);
    const [check, setCheck] = useState(null);
    const grimoireOk = canMakeGrimoire();
    const base = safeFilename(`${jar.owner}'s jar`);
    const k = jar.threshold;
    const n = cards.length;
    // The cards and the jar exist only in this page's memory until they are printed and downloaded.
    const [printed, setPrinted] = useState(false);
    const [saved, setSaved] = useState(false);
    const missing = [...(printed ? [] : ['print the cards']), ...(saved ? [] : ['download the jar file'])];
    useLeaveWarning(missing.length ? `You haven’t ${missing.join(' or ')} yet. Closing this page forgets them, and no one could open the jar. Close anyway?` : null, { inApp: false });
    useEffect(() => {
        let live = true;
        void verifyCircle(jar, cards).then((c) => live && setCheck(c));
        return () => {
            live = false;
        };
    }, [jar, cards]);
    return (_jsxs("div", { className: "page sealed-page", children: [_jsxs("section", { className: "narrow center sealed-hero", children: [_jsxs("div", { className: "sealed-jar pop", children: [_jsx(Jar, { initials: initialsOf(jar.owner), size: 250, warmth: 0.6 }), _jsx(Sparkles, { burst: "sealed", radius: 150, count: 18 })] }), _jsx("h1", { className: "sealed-title", children: "Sealed!" }), _jsxs("p", { className: "lede", children: [capitalised(numberWord(n)), " cards were made. Any ", numberWord(k), " of them open the jar. This is the only time they can be printed."] }), _jsxs("p", { className: `proof${check ? (check.ok ? ' ok' : ' bad') : ''}`, role: "status", children: [_jsx(EmblemIcon, { name: "spark", size: 18, title: "" }), !check && `Checking all ${combos(n, k)} ways to gather…`, check?.ok &&
                                `Checked: all ${check.opened} groups of ${numberWord(k)} open it${k > 2 ? `, and none of the ${check.refused} groups of ${numberWord(k - 1)} can` : ', and no one can alone'}.`, check && !check.ok && 'Something is wrong with these cards. Please seal the jar again.'] })] }), _jsx("section", { className: "fan wrap", "aria-label": "The cards", children: cards.map((c, i) => {
                    const mid = (n - 1) / 2;
                    return (_jsx(BuddyCard, { name: c.name, buddy: buddies.get(c.x), index: i, total: n, note: c.hasLetter ? `${c.name} has a private letter` : undefined, className: "fan-card pop", style: { '--rot': `${(i - mid) * 7}deg`, '--lift': `${Math.abs(i - mid) * 12}px`, '--d': `${200 + i * 110}ms` } }, c.x));
                }) }), cards.some((c) => c.hasLetter) && (_jsxs("p", { className: "fan-legend faint", children: [_jsx("span", { className: "buddy-card-note", children: _jsx(EnvelopeMark, {}) }), "a private letter, opened with that card\u2019s seal"] })), _jsxs("section", { className: "todo wrap", children: [_jsxs("article", { className: "todo-item card", children: [_jsx("span", { className: "todo-num", children: "1" }), _jsxs("div", { children: [_jsx("h3", { children: "Print the cards" }), _jsx("p", { className: "muted", children: "One page per friend, folded so the seal is inside. And one page for you: your key, to change the jar later." }), _jsx("button", { type: "button", className: "btn primary", onClick: () => {
                                            window.print();
                                            setPrinted(true);
                                        }, children: "Print or save as PDF" }), printed && _jsx("p", { className: "faint", children: "Printed? Check that every page came out before you leave." })] })] }), _jsxs("article", { className: "todo-item card", children: [_jsx("span", { className: "todo-num", children: "2" }), _jsxs("div", { children: [_jsx("h3", { children: "Give everyone their card and the jar file" }), _jsx("p", { className: "muted", children: "Tell each friend what the card is. Email them all the jar file: this app with your locked jar inside. It opens offline, and is safe to send." }), _jsx("button", { type: "button", className: "btn", disabled: !grimoireOk, onClick: () => {
                                            download(`${base}.html`, makeGrimoire(jar), 'text/html');
                                            setSaved(true);
                                        }, children: "Download the jar" }), !grimoireOk && _jsx("p", { className: "faint", children: "The jar file can only be made from the built app." })] })] }), _jsxs("article", { className: "todo-item card", children: [_jsx("span", { className: "todo-num", children: "3" }), _jsxs("div", { children: [_jsx("h3", { children: "Turn on the watch" }), _jsx("p", { className: "muted", children: "We ask now and then if you are still here, and only ask your friends to check on you if you go quiet." }), _jsx("a", { className: "btn", href: href('watch'), onClick: () => jarHandoff.give(jar), children: "Set the watch" })] })] })] }), _jsx("p", { className: "center start-over", children: _jsx("button", { type: "button", className: "text-btn quiet", onClick: () => {
                        if (missing.length && !window.confirm(`You haven’t ${missing.join(' or ')} yet. Seal a new jar and forget this one?`))
                            return;
                        onStartOver();
                    }, children: "Done? Seal another jar" }) }), _jsxs("div", { className: "print-area", "aria-hidden": "true", children: [cards.map((c, i) => (_jsx(PrintableCard, { owner: jar.owner, circle: cards.map((x) => x.name), card: c, buddy: buddies.get(c.x), index: i, total: n, threshold: k }, c.x))), _jsx(PrintableKey, { owner: jar.owner, keyCard: result.key })] })] }));
}
/** After the owner changed what is inside: the same cards, a new jar file. */
export function Updated({ jar }) {
    const grimoireOk = canMakeGrimoire();
    // The version in the name, so the newest file is easy to tell apart.
    const base = safeFilename(`${jar.owner}'s jar, version ${jar.revision ?? 2}`);
    const first = jar.owner.split(/\s+/)[0];
    const [service, setService] = useState(null);
    useEffect(() => {
        void watchAvailable().then(setService);
    }, []);
    return (_jsxs("div", { className: "page sealed-page", children: [_jsxs("section", { className: "narrow center sealed-hero", children: [_jsxs("div", { className: "sealed-jar pop", children: [_jsx(Jar, { initials: initialsOf(jar.owner), size: 250, warmth: 0.6 }), _jsx(Sparkles, { burst: "updated", radius: 150, count: 18 })] }), _jsx("h1", { className: "sealed-title", children: "Updated!" }), _jsxs("p", { className: "lede", children: ["Version ", jar.revision ?? 2, " of ", first, "\u2019s jar. Every card still opens it, and nothing new needs printing. Keep your key for next time."] })] }), _jsxs("section", { className: `todo wrap ${service ? 'todo-two' : 'todo-one'}`, children: [_jsxs("article", { className: "todo-item card", children: [_jsx("span", { className: "todo-num", children: "1" }), _jsxs("div", { children: [_jsx("h3", { children: "Send the new jar file" }), _jsx("p", { className: "muted", children: "Email it to the same friends, and ask them to delete the old one: it still opens with the cards, but shows the old words." }), _jsx("button", { type: "button", className: "btn primary", disabled: !grimoireOk, onClick: () => download(`${base}.html`, makeGrimoire(jar), 'text/html'), children: "Download the jar" }), !grimoireOk && _jsx("p", { className: "faint", children: "The jar file can only be made from the built app." })] })] }), service && _jsx(WatchCopy, { jar: jar })] })] }));
}
/** If the watch keeps a copy of the jar, replace it with the new version here. */
function WatchCopy({ jar }) {
    const [link, setLink] = useState('');
    const [state, setState] = useState('idle');
    const [error, setError] = useState('');
    const give = async (e) => {
        e.preventDefault();
        const token = /manage=([^&\s]+)/.exec(link)?.[1];
        if (!token) {
            setError('Paste the whole manage link from the email that confirmed your watch.');
            return;
        }
        setState('busy');
        setError('');
        try {
            await watchApi.keepJar(decodeURIComponent(token), jar);
            setState('done');
        }
        catch (err) {
            setState('idle');
            setError(err instanceof ApiError ? err.message : 'The watch service is not answering.');
        }
    };
    return (_jsxs("article", { className: "todo-item card", children: [_jsx("span", { className: "todo-num", children: "2" }), _jsxs("div", { children: [_jsx("h3", { children: "The watch\u2019s copy" }), state === 'done' && _jsx("p", { className: "muted", children: "Done. Your friends\u2019 links now open this version." }), state !== 'done' && (_jsxs("form", { className: "watch-copy", onSubmit: give, children: [_jsx("p", { className: "muted", children: "Does a watch keep a copy of your jar? Paste its manage link, from our email, to give it this version." }), _jsx("input", { type: "url", "aria-label": "Your watch\u2019s manage link", placeholder: "https://\u2026#/watch?manage=\u2026", value: link, onChange: (e) => setLink(e.target.value) }), _jsx("button", { type: "submit", className: "btn small", disabled: state === 'busy' || !link.trim(), children: state === 'busy' ? 'Giving…' : 'Give it this jar' }), error && _jsx("p", { className: "error", children: error })] }))] })] }));
}
