import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { cardToQrText, cardToWords } from '../../core/cards.ts';
import { Ghost } from '../art/Ghost.tsx';
import { numberWord } from '../text.ts';
import { Qr } from './Qr.tsx';
/** A tiny envelope: this card's seal opens a private letter. */
export function EnvelopeMark() {
    return (_jsxs("svg", { width: "18", height: "13", viewBox: "0 0 18 13", "aria-hidden": "true", children: [_jsx("rect", { x: "1", y: "1", width: "16", height: "11", rx: "2.5", fill: "#fff", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { d: "M2 2.2 L9 7.6 L16 2.2", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" })] }));
}
/** The card as it appears on screen: a little ghost and a name. */
export function BuddyCard({ name, buddy, index, total, note, style, onClick, disabled, className = '', }) {
    const body = (_jsxs(_Fragment, { children: [_jsxs("span", { className: "buddy-card-num mono", children: [index + 1, "/", total] }), _jsx("span", { className: "buddy-card-art", children: _jsx(Ghost, { costume: buddy.costume, emblem: buddy.emblem, tilt: buddy.tilt, size: 96, float: true, phase: index * 0.6 }) }), _jsx("span", { className: "buddy-card-name", children: name }), note && (_jsxs("span", { className: "buddy-card-note", title: note, children: [_jsx(EnvelopeMark, {}), _jsx("span", { className: "visually-hidden", children: note })] }))] }));
    return onClick ? (_jsx("button", { type: "button", className: `buddy-card ${className}`, style: style, onClick: onClick, disabled: disabled, children: body })) : (_jsx("div", { className: `buddy-card ${className}`, style: style, children: body }));
}
/**
 * Where this copy of Phylactery lives, for a card found in a drawer years
 * later. Empty when running from a file, which has no address to print.
 */
function homeAddress() {
    if (typeof location === 'undefined' || !/^https?:$/.test(location.protocol))
        return '';
    return (location.host + location.pathname).replace(/\/index\.html$/, '/').replace(/\/$/, '');
}
function WordGrid({ words, columns }) {
    return (_jsx("ol", { className: "word-grid", style: { gridTemplateColumns: `repeat(${columns}, 1fr)` }, children: words.map((w, i) => (_jsxs("li", { children: [_jsx("span", { className: "n", children: String(i + 1).padStart(2, '0') }), w] }, i))) }));
}
const listNames = (names) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? ''));
function ShardFace({ owner, circle, card, buddy, index, total, threshold }) {
    const first = owner.split(/\s+/)[0];
    return (_jsxs("section", { className: "card-face", "aria-label": `Card for ${card.name}`, children: [_jsxs("header", { className: "card-head", children: [_jsxs("span", { children: [owner, "\u2019s jar"] }), _jsxs("span", { children: ["card ", index + 1, " of ", total] })] }), _jsxs("div", { className: "card-body", children: [_jsx(Ghost, { costume: buddy.costume, emblem: buddy.emblem, tilt: buddy.tilt, size: 118, line: true, title: `${card.name}'s ghost` }), _jsxs("div", { className: "card-who", children: [_jsx("p", { className: "card-held", children: "Kept by" }), _jsx("p", { className: "card-name", children: card.name }), _jsxs("p", { className: "card-rule", children: [listNames(circle.map((n) => n.split(/\s+/)[0])), " each hold one of ", numberWord(total), " cards. Any ", numberWord(threshold), " of you, together, open the jar. Fewer reveal nothing."] })] }), _jsx(Qr, { text: cardToQrText(card.shard), size: 128, label: `Code for ${card.name}'s card` })] }), _jsx(WordGrid, { words: cardToWords(card.shard), columns: 5 }), _jsxs("footer", { className: "card-foot", children: ["You also need ", first, "\u2019s jar file, which ", first, " emails to each of you (keep that email). When the time comes, gather, open it", homeAddress() ? ` (or ${homeAddress()}, then Séance)` : '', ", and each offer your card. Keep this card safe, like a house key. Never post a photo of it."] })] }));
}
function SealFace({ owner, card, buddy }) {
    const first = owner.split(/\s+/)[0] ?? owner;
    return (_jsxs("section", { className: "card-face seal-face", "aria-label": `Private seal for ${card.name}`, children: [_jsxs("header", { className: "card-head", children: [_jsx("span", { children: "your private seal" }), _jsxs("span", { children: ["for ", card.name, " only"] })] }), _jsxs("div", { className: "card-body", children: [_jsx(Ghost, { costume: buddy.costume, emblem: buddy.emblem, tilt: buddy.tilt, size: 70, line: true, mood: "wink", title: `${card.name}'s ghost, winking` }), _jsxs("div", { className: "card-who", children: [_jsx("p", { className: "card-name small", children: card.hasLetter ? `${first} wrote you a letter.` : 'For a letter, now or later.' }), _jsx("p", { className: "card-rule", children: card.hasLetter
                                    ? 'Once the jar is open, this seal opens your letter. Keep it folded. Show no one.'
                                    : `If ${first} leaves you a private letter, this half opens it once the jar is open. Keep it folded with your card.` })] }), _jsx(Qr, { text: cardToQrText(card.seal), size: 104, label: `Code for ${card.name}'s seal` })] }), _jsx(WordGrid, { words: cardToWords(card.seal), columns: 6 })] }));
}
export function PrintableCard(props) {
    return (_jsxs("article", { className: "print-card", children: [_jsx(ShardFace, { ...props }), _jsx("div", { className: "fold-line", "aria-hidden": "true", children: _jsx("span", { children: "fold here \u00B7 the half below is yours alone" }) }), _jsx(SealFace, { ...props })] }));
}
/** The owner's own page: the key that lets them change the jar later. */
export function PrintableKey({ owner, keyCard }) {
    return (_jsx("article", { className: "print-card print-key", children: _jsxs("section", { className: "card-face", "aria-label": `Key to ${owner}'s jar`, children: [_jsxs("header", { className: "card-head", children: [_jsxs("span", { children: [owner, "\u2019s jar"] }), _jsx("span", { children: "your key \u00B7 keep it, don\u2019t give it" })] }), _jsxs("div", { className: "card-body", children: [_jsx(Ghost, { mood: "happy", emblem: "key", size: 118, line: true, title: "The ghost in your jar" }), _jsxs("div", { className: "card-who", children: [_jsxs("p", { className: "card-held", children: ["For you, ", owner.split(/\s+/)[0]] }), _jsx("p", { className: "card-name", children: "Your key" }), _jsx("p", { className: "card-rule", children: "With this you can change what is in the jar later, and your friends keep their cards. It also opens the jar on its own, so keep it like a passport: not with the cards, not in a photo." })] }), _jsx(Qr, { text: cardToQrText(keyCard), size: 128, label: `Code for ${owner}'s key` })] }), _jsx(WordGrid, { words: cardToWords(keyCard), columns: 4 }), _jsxs("footer", { className: "card-foot", children: ["To change the jar: open your jar file", homeAddress() ? ` or ${homeAddress()}` : '', ", choose Seal, then \u201CChange what\u2019s inside\u201D, and give it your jar file and this key."] })] }) }));
}
