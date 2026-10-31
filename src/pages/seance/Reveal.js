import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { CardError, parseCard } from '../../core/cards.ts';
import { openLetter } from '../../core/jar.ts';
import { DEMO_CARDS, isDemo } from '../../demo/demo.ts';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { EmblemIcon } from '../../ui/art/Emblem.tsx';
import { Ghost, GhostHand } from '../../ui/art/Ghost.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { WaxSeal, initialsOf } from '../../ui/art/WaxSeal.tsx';
import { CardInput } from '../../ui/components/CardInput.tsx';
import { href, useLeaveWarning } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';
const WISH_LABELS = {
    decide: 'Up to you',
    close: 'Close it',
    memorialize: 'Keep as a memorial',
    keep: 'Keep it running',
    'hand-over': 'Hand it over',
};
const WISHES = [
    ['farewell', 'The farewell', 'flower', '#e0457a'],
    ['body', 'The body', 'heart', '#8e47ff'],
    ['dependents', 'Who depends on me', 'bone', '#d0832a'],
    ['other', 'Anything else', 'spark', '#2f9e7a'],
];
function Paragraphs({ text, start = 0, step = 380 }) {
    return (_jsx(_Fragment, { children: text
            .split(/\n{2,}/)
            .filter((p) => p.trim())
            .map((p, i) => (_jsx("p", { className: "rise", style: { '--d': `${start + i * step}ms` }, children: p.split('\n').map((line, j, all) => (_jsxs("span", { children: [line, j < all.length - 1 && _jsx("br", {})] }, j))) }, i))) }));
}
function names(list) {
    const first = list.map((n) => n.split(/\s+/)[0]);
    return first.length > 1 ? `${first.slice(0, -1).join(', ')} & ${first[first.length - 1]}` : (first[0] ?? '');
}
export function Reveal({ jar, opened, circle, buddies }) {
    const c = opened.content;
    const first = jar.owner.split(/\s+/)[0] ?? jar.owner;
    const wishes = WISHES.filter(([k]) => c.wishes[k].trim());
    const letters = jar.holders.filter((h) => h.hasLetter);
    // An open jar can only be opened again with the cards: leaving asks first.
    const [closing, setClosing] = useState(false);
    useLeaveWarning(isDemo(jar) || closing ? null : `Leaving closes ${first}’s jar. To read it again, the cards would be needed again. Leave anyway?`);
    useEffect(() => {
        if (closing)
            window.location.reload();
    }, [closing]);
    return (_jsxs("div", { className: "page reveal-page print-self", children: [_jsxs("header", { className: "narrow center reveal-head", children: [_jsxs("div", { className: "reveal-jar", children: [_jsx(Jar, { initials: initialsOf(jar.owner), state: "open", wax: "broken", warmth: 1, notes: false, size: 150, label: `${first}’s jar, open` }), _jsx(Sparkles, { burst: "reveal", radius: 120, count: 14 })] }), _jsxs("p", { className: "tag rise", children: ["opened by ", names(circle)] }), _jsxs("h1", { className: "rise", style: { '--d': '120ms' }, children: [first, " left you this"] })] }), _jsxs("div", { className: "narrow reveal-body", children: [c.message.trim() && (_jsxs("article", { className: "paper message rise", style: { '--d': '300ms' }, children: [_jsx("p", { className: "paper-tag", children: "to everyone" }), _jsx(Paragraphs, { text: c.message, start: 500 }), _jsxs("p", { className: "signature rise", style: { '--d': '1400ms' }, children: ["\u2014 ", first] })] })), c.accounts.length > 0 && (_jsxs("section", { className: "paper rise", style: { '--d': '400ms' }, "aria-labelledby": "accounts-title", children: [_jsxs("h2", { id: "accounts-title", className: "paper-title", children: [_jsx(EmblemIcon, { name: "key", size: 22, color: "#8e47ff", title: "" }), " Accounts"] }), _jsx("ul", { className: "account-list", children: c.accounts.map((a, i) => (_jsxs("li", { children: [_jsxs("div", { className: "spread", children: [_jsx("b", { children: a.service || 'An account' }), _jsx("span", { className: `pill wish-${a.wish}`, children: WISH_LABELS[a.wish] })] }), a.login && _jsx("code", { className: "login", children: a.login }), a.note && _jsx("p", { className: "muted", children: a.note })] }, i))) })] })), c.documents.length > 0 && (_jsxs("section", { className: "paper rise", style: { '--d': '500ms' }, "aria-labelledby": "places-title", children: [_jsxs("h2", { id: "places-title", className: "paper-title", children: [_jsx(EmblemIcon, { name: "moon", size: 22, color: "#e39a14", title: "" }), " Where things are"] }), _jsx("dl", { className: "places", children: c.documents.map((d, i) => (_jsxs("div", { children: [_jsx("dt", { children: d.item }), _jsx("dd", { children: d.location })] }, i))) })] })), wishes.length > 0 && (_jsxs("section", { className: "rise", style: { '--d': '600ms' }, "aria-labelledby": "wishes-title", children: [_jsx("h2", { id: "wishes-title", className: "center section-title", children: "Wishes" }), _jsx("div", { className: "wish-cards", children: wishes.map(([k, label, icon, color]) => (_jsxs("div", { className: "paper wish-card", children: [_jsx("span", { className: "wish-icon", style: { color }, children: _jsx(EmblemIcon, { name: icon, size: 22, title: "" }) }), _jsx("h3", { children: label }), _jsx("p", { children: c.wishes[k] })] }, k))) })] })), letters.length > 0 && (_jsxs("section", { className: "letters", "aria-labelledby": "letters-title", children: [_jsx("h2", { id: "letters-title", className: "center section-title", children: "Letters" }), _jsx("p", { className: "center muted", children: "Each one opens only with the private seal folded inside its reader\u2019s card." }), _jsx(Letters, { jar: jar, opened: opened, holders: letters, buddies: buddies })] })), _jsxs("section", { className: "center after", children: [_jsx(Ghost, { costume: "sheet", mood: "happy", size: 70, float: true }), isDemo(jar) ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "muted", children: "That was June\u2019s jar. Yours takes about ten minutes." }), _jsxs("div", { className: "row centered", children: [_jsx("a", { className: "btn primary", href: href('seal'), children: "Seal your own jar" }), _jsx("a", { className: "btn", href: `${href('guides')}#after`, target: "_blank", rel: "noopener", children: "For the days that follow" })] })] })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: "muted", children: "There is a gentle checklist for the days that follow. It opens in a new tab, so this stays open." }), _jsxs("div", { className: "row centered", children: [_jsx("a", { className: "btn primary", href: `${href('guides')}#after`, target: "_blank", rel: "noopener", children: "For the days that follow" }), _jsxs("button", { type: "button", className: "btn", onClick: () => window.print(), children: ["Print what ", first, " left"] })] }), _jsxs("p", { className: "faint", children: ["Nothing was saved.", ' ', _jsx("button", { type: "button", className: "text-btn quiet", onClick: () => {
                                                    if (window.confirm(`Close ${first}’s jar? To read it again, the cards would be needed again.`))
                                                        setClosing(true);
                                                }, children: "Close the jar" })] })] }))] })] })] }));
}
/**
 * The envelopes stay in one row. The seal is asked for, and the letters
 * are read, below the row, so opening one never moves the others.
 */
function Letters({ jar, opened, holders, buddies }) {
    const [asking, setAsking] = useState(null);
    const [read, setRead] = useState({});
    const holder = holders.find((h) => h.x === asking);
    const order = holders.filter((h) => read[h.x]);
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "envelopes", children: holders.map((h) => {
                    const buddy = buddies.get(h.x);
                    const isOpen = !!read[h.x];
                    const first = h.name.split(/\s+/)[0];
                    return (_jsxs("div", { className: `envelope-wrap${isOpen ? ' opened' : ''}${asking === h.x ? ' asking' : ''}`, children: [_jsxs("div", { className: "envelope", "aria-hidden": "true", children: [_jsx("span", { className: "envelope-buddy", children: _jsx(Ghost, { costume: buddy.costume, emblem: buddy.emblem, tilt: buddy.tilt, mood: isOpen || asking === h.x ? 'happy' : 'open', size: 64, phase: h.x * 0.7 }) }), _jsxs("span", { className: "envelope-hands", children: [_jsx(GhostHand, { costume: buddy.costume, size: 17 }), _jsx(GhostHand, { costume: buddy.costume, size: 17 })] }), _jsx("div", { className: "envelope-back" }), _jsx("div", { className: "envelope-letter" }), _jsx("div", { className: "envelope-front", children: _jsxs("span", { className: "envelope-to", children: ["for ", _jsx("span", { className: "full-name", children: h.name }), _jsx("span", { className: "first-name", children: first })] }) }), _jsx("div", { className: "envelope-flap", children: _jsx("span", { className: "envelope-seal", children: _jsx(WaxSeal, { initials: initialsOf(jar.owner), size: 46, state: isOpen ? 'broken' : 'whole' }) }) })] }), isOpen ? (_jsxs("a", { className: "btn small", href: `#letter-${h.x}`, onClick: (e) => {
                                    e.preventDefault();
                                    document.getElementById(`letter-${h.x}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, children: ["Read ", first, "\u2019s letter"] })) : (_jsxs("button", { type: "button", className: "btn small", "aria-expanded": asking === h.x, onClick: () => setAsking(asking === h.x ? null : h.x), children: ["Open with ", first, "\u2019s seal"] }))] }, h.x));
                }) }), holder && !read[holder.x] && (_jsx(SealEntry, { jar: jar, opened: opened, holder: holder, onOpen: (letter) => {
                    setRead({ ...read, [holder.x]: letter });
                    setAsking(null);
                } }, holder.x)), order.map((h) => {
                const letter = read[h.x];
                return (_jsxs("article", { id: `letter-${h.x}`, className: "letter", children: [_jsxs("p", { className: "paper-tag", children: ["for ", letter.to] }), _jsx(Paragraphs, { text: letter.text, start: 900, step: 260 })] }, h.x));
            })] }));
}
function SealEntry({ jar, opened, holder, onOpen }) {
    const demoCard = isDemo(jar) ? DEMO_CARDS.find((c) => c.name === holder.name) : undefined;
    const firstName = holder.name.split(/\s+/)[0];
    const tryOpen = async (text) => {
        let card;
        try {
            card = parseCard(text);
        }
        catch (e) {
            return e instanceof CardError ? e.message : 'That seal could not be read.';
        }
        if (card.kind !== 'seal')
            return 'That’s the outside of a card. This needs the private seal from the inside.';
        if (card.x !== holder.x)
            return `That seal belongs to someone else. This letter is for ${firstName}.`;
        try {
            const l = await openLetter(jar, opened, card);
            sound.crack();
            setTimeout(() => sound.chime(), 300);
            onOpen(l);
            return null;
        }
        catch (e) {
            return e instanceof Error ? e.message : 'That seal didn’t open the letter.';
        }
    };
    return (_jsxs("div", { className: "card envelope-input pop", children: [_jsxs("p", { className: "envelope-input-title", children: [firstName, "\u2019s private seal"] }), demoCard && (_jsxs("button", { type: "button", className: "btn small primary", onClick: () => void tryOpen(demoCard.seal), children: ["Use ", firstName, "\u2019s seal from the demo"] })), _jsx(CardInput, { kind: "seal", onCard: tryOpen })] }));
}
