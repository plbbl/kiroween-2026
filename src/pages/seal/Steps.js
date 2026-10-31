import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Candle } from '../../ui/art/Candle.tsx';
import { EmblemIcon } from '../../ui/art/Emblem.tsx';
import { Ghost } from '../../ui/art/Ghost.tsx';
import { capitalised, numberWord } from '../../ui/text.ts';
import { href } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';
/** Placeholder costumes for people before their cards exist. */
export const PREVIEW_COSTUMES = ['sheet', 'pumpkin', 'bat', 'franken', 'bow', 'witch', 'skeleton', 'mummy', 'sheet', 'pumpkin'];
export function StepName({ draft, setOwner }) {
    return (_jsxs(_Fragment, { children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Your name" }), _jsx("input", { type: "text", autoFocus: true, value: draft.owner, onChange: (e) => setOwner(e.target.value), placeholder: "As your people know you", autoComplete: "name" })] }), _jsxs("p", { className: "note", children: [_jsx(Ghost, { size: 30, mood: "wink" }), _jsx("span", { children: "Nothing is saved until you seal the jar: if you leave this page, or switch apps on a phone, your words may vanish. That is on purpose. Have your logins at hand before you start." })] }), _jsxs("p", { className: "faint update-link", children: ["Sealed one before? ", _jsx("a", { href: `${href('seal')}?update`, children: "Change what\u2019s inside" }), " with your key."] })] }));
}
const STARTERS = ['If you are reading this, ', 'Thank you for ', 'Please don’t worry about ', 'I want you to know ', 'Be gentle with each other.'];
export function StepMessage({ content, setContent }) {
    return (_jsxs(_Fragment, { children: [_jsxs("label", { className: "field", children: [_jsx("span", { className: "visually-hidden", children: "Your note to everyone" }), _jsx("textarea", { rows: 9, value: content.message, onChange: (e) => setContent({ message: e.target.value }), placeholder: "Write anything. There is no wrong way." })] }), _jsxs("div", { className: "starters", "aria-label": "Ways to begin", children: [_jsx("span", { className: "faint", children: "Stuck? Try" }), STARTERS.map((s) => (_jsx("button", { type: "button", className: "chip", onClick: () => setContent({ message: (content.message ? content.message.trimEnd() + '\n\n' : '') + s }), children: s.trim() }, s)))] })] }));
}
const WISHES = [
    { value: 'decide', label: 'Up to them' },
    { value: 'close', label: 'Close it' },
    { value: 'memorialize', label: 'Keep as a memorial' },
    { value: 'keep', label: 'Keep it running' },
    { value: 'hand-over', label: 'Hand it over' },
];
const QUICK_ACCOUNTS = ['Password manager', 'Email', 'Phone', 'Bank', 'Photos', 'Social media'];
export function StepLeave({ content, setContent }) {
    const accounts = content.accounts;
    const documents = content.documents;
    const setAccounts = (a) => setContent({ accounts: a });
    const setDocuments = (d) => setContent({ documents: d });
    const updateAccount = (i, patch) => setAccounts(accounts.map((a, j) => (j === i ? { ...a, ...patch } : a)));
    const updateDoc = (i, patch) => setDocuments(documents.map((d, j) => (j === i ? { ...d, ...patch } : d)));
    const addAccount = (service = '') => setAccounts([...accounts, { service, login: '', wish: 'decide', note: '' }]);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "sub-head", children: [_jsx("h3", { children: "Accounts" }), _jsx("span", { className: "faint", children: "Passwords are safe here. Everyone who opens the jar together will see them; for one person only, use a private letter." })] }), _jsx("div", { className: "starters", children: QUICK_ACCOUNTS.filter((q) => !accounts.some((a) => a.service === q)).map((q) => (_jsxs("button", { type: "button", className: "chip", onClick: () => addAccount(q), children: ["+ ", q] }, q))) }), accounts.length > 0 && (_jsx("ul", { className: "rows", "aria-label": "Accounts", children: accounts.map((a, i) => (_jsxs("li", { className: "row-card pop", children: [_jsxs("div", { className: "row-grid", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Service" }), _jsx("input", { type: "text", value: a.service, placeholder: "Email, bank, photos\u2026", onChange: (e) => updateAccount(i, { service: e.target.value }) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "How to get in" }), _jsx("textarea", { rows: 2, value: a.login, placeholder: "Login, and the password or where it is", onChange: (e) => updateAccount(i, { login: e.target.value }) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "What should happen" }), _jsx("select", { value: a.wish, onChange: (e) => updateAccount(i, { wish: e.target.value }), children: WISHES.map((w) => (_jsx("option", { value: w.value, children: w.label }, w.value))) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "A note" }), _jsx("input", { type: "text", value: a.note, placeholder: "Anything they should know", onChange: (e) => updateAccount(i, { note: e.target.value }) })] })] }), _jsx("button", { type: "button", className: "icon-btn small remove", onClick: () => setAccounts(accounts.filter((_, j) => j !== i)), "aria-label": `Remove ${a.service || 'this account'}`, children: "\u00D7" })] }, i))) })), _jsx("button", { type: "button", className: "btn small", onClick: () => addAccount(), children: "+ Add an account" }), _jsxs("div", { className: "sub-head spaced", children: [_jsx("h3", { children: "Where things are" }), _jsx("span", { className: "faint", children: "The will, the deed, the spare key." })] }), documents.length > 0 && (_jsx("ul", { className: "rows", "aria-label": "Places", children: documents.map((d, i) => (_jsxs("li", { className: "row-card pop", children: [_jsxs("div", { className: "row-grid two", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "What" }), _jsx("input", { type: "text", value: d.item, placeholder: "Will, deed, insurance, spare key\u2026", onChange: (e) => updateDoc(i, { item: e.target.value }) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Where" }), _jsx("input", { type: "text", value: d.location, placeholder: "Blue folder, top drawer of the desk", onChange: (e) => updateDoc(i, { location: e.target.value }) })] })] }), _jsx("button", { type: "button", className: "icon-btn small remove", onClick: () => setDocuments(documents.filter((_, j) => j !== i)), "aria-label": `Remove ${d.item || 'this place'}`, children: "\u00D7" })] }, i))) })), _jsx("button", { type: "button", className: "btn small", onClick: () => setDocuments([...documents, { item: '', location: '' }]), children: "+ Add a place" })] }));
}
const WISH_FIELDS = [
    ['farewell', 'The farewell', 'A gathering or none, music, a place…', 'flower', '#e0457a'],
    ['body', 'Your body', 'Organ donation, burial or cremation…', 'heart', '#8e47ff'],
    ['dependents', 'Who depends on you', 'Children, parents, pets, plants…', 'bone', '#d0832a'],
    ['other', 'Anything else', 'A promise to keep, a thing to return…', 'spark', '#2f9e7a'],
];
export function StepWishes({ content, setContent }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "wish-grid", children: WISH_FIELDS.map(([key, label, placeholder, icon, color]) => (_jsxs("label", { className: "field wish-tile", children: [_jsxs("span", { className: "wish-label", children: [_jsx(EmblemIcon, { name: icon, size: 18, color: color, title: "" }), " ", label] }), _jsx("textarea", { rows: 4, value: content.wishes[key], placeholder: placeholder, onChange: (e) => setContent({ wishes: { ...content.wishes, [key]: e.target.value } }) })] }, key))) }), _jsxs("p", { className: "note", children: [_jsx(EmblemIcon, { name: "key", size: 22, color: "#8e47ff", title: "" }), _jsx("span", { children: "These are wishes, not a legal will. If you have a will, say where it is in the previous step." })] })] }));
}
/**
 * `locked` when updating a jar: the circle and the threshold are part of
 * every printed card, so only the letters can change; `costumes` are then
 * the real buddies on those cards.
 */
export function StepCircle({ draft, setDraft, locked = false, costumes = PREVIEW_COSTUMES }) {
    const n = draft.holders.length;
    const key = (name) => name.trim().toLowerCase();
    const twice = (name) => !!key(name) && draft.holders.filter((h) => key(h.name) === key(name)).length > 1;
    const update = (i, patch) => setDraft({ ...draft, holders: draft.holders.map((h, j) => (j === i ? { ...h, ...patch } : h)) });
    const setHolders = (holders) => setDraft({ ...draft, holders, threshold: Math.min(Math.max(2, draft.threshold), Math.max(2, holders.length)) });
    return (_jsxs(_Fragment, { children: [_jsx("ul", { className: "people", "aria-label": "Your circle", children: draft.holders.map((h, i) => (_jsxs("li", { className: "person pop", style: { '--d': `${i * 60}ms` }, children: [_jsxs("div", { className: "person-row", children: [_jsx("span", { className: "person-ghost", "aria-hidden": "true", children: _jsx(Ghost, { costume: costumes[i], mood: h.name.trim() ? 'happy' : 'open', size: 46, float: true, phase: i * 0.5 }) }), locked ? (_jsx("span", { className: "person-name", children: h.name })) : (_jsxs("label", { className: "field", children: [_jsxs("span", { className: "visually-hidden", children: ["Name of person ", i + 1] }), _jsx("input", { type: "text", value: h.name, placeholder: `Friend ${i + 1}`, "aria-invalid": twice(h.name) || undefined, "aria-describedby": twice(h.name) ? 'same-name' : undefined, onChange: (e) => update(i, { name: e.target.value }) })] })), _jsx("button", { type: "button", className: `chip${h.writing ? ' on' : ''}`, onClick: () => update(i, { writing: !h.writing }), "aria-expanded": h.writing, children: h.writing ? '✓ Letter' : '+ Letter' }), n > 2 && !locked && (_jsx("button", { type: "button", className: "icon-btn small", onClick: () => setHolders(draft.holders.filter((_, j) => j !== i)), "aria-label": `Remove ${h.name || `friend ${i + 1}`}`, children: "\u00D7" }))] }), twice(h.name) && draft.holders.findIndex((x) => key(x.name) === key(h.name)) !== i && (_jsx("p", { className: "field-error", id: "same-name", children: "Someone else in the circle has this name. Add a surname or a nickname, so each card is clear." })), h.writing && (_jsxs("label", { className: "field letter-field pop", children: [_jsxs("span", { children: ["A letter only ", h.name.trim() || 'they', " can open"] }), _jsx("textarea", { rows: 6, value: h.letter, placeholder: `Dear ${h.name.trim() || '…'},`, onChange: (e) => update(i, { letter: e.target.value }) })] }))] }, i))) }), n < 10 && !locked && (_jsx("button", { type: "button", className: "btn small", onClick: () => setHolders([...draft.holders, { name: '', letter: '', writing: false }]), children: "+ Add a friend" })), _jsxs("div", { className: "threshold", "data-theme": "night", children: [_jsx("h3", { children: "How many must gather?" }), _jsx("p", { className: "faint", children: locked ? 'Set when the jar was sealed, and printed on every card.' : 'Tap a candle. Fewer is easier to gather; more is safer if a card goes missing.' }), _jsx("div", { className: "threshold-candles", role: "radiogroup", "aria-label": "Cards needed to open the jar", children: draft.holders.map((_, i) => {
                            const k = i + 1;
                            return (_jsxs("button", { type: "button", className: "threshold-candle", role: "radio", "aria-checked": draft.threshold === k, "aria-label": `${k} cards`, disabled: k < 2 || locked, onClick: () => {
                                    setDraft({ ...draft, threshold: k });
                                    sound.strike();
                                }, children: [_jsx(Candle, { lit: i < draft.threshold, justLit: i === draft.threshold - 1, size: 64, phase: i * 0.6 }, `${i}-${i < draft.threshold}`), _jsx("span", { children: k })] }, i));
                        }) }), _jsxs("p", { className: "threshold-text", children: [capitalised(numberWord(draft.threshold)), " of ", numberWord(n), " can open it"] })] })] }));
}
