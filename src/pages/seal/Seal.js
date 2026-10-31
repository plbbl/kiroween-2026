import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { circleBuddies } from '../../core/buddy.ts';
import { emptyContent, jarIdBytes, resealJar, sealJar, validateSealInput } from '../../core/jar.ts';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { Ghost } from '../../ui/art/Ghost.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { initialsOf } from '../../ui/art/WaxSeal.tsx';
import { capitalised, numberWord, plural } from '../../ui/text.ts';
import { useAtmosphere, useLeaveWarning, wait } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';
import { Sealed, Updated } from './Sealed.tsx';
import { OpenForUpdate } from './Update.tsx';
import { StepCircle, StepLeave, StepMessage, StepName, StepWishes } from './Steps.tsx';
const STEPS = [
    {
        label: 'You',
        title: () => 'Hi! Whose jar is this?',
        sub: 'A little ghost will keep what you write here, safe in a jar.',
        art: _jsx(Ghost, { mood: "happy", size: 86, float: true }),
    },
    {
        label: 'Note',
        title: () => 'A note for everyone',
        sub: 'Everyone in your circle will read this first.',
        art: _jsx(Ghost, { mood: "wink", costume: "bow", size: 86, float: true }),
    },
    {
        label: 'Things',
        title: () => 'The things only you know',
        sub: 'Accounts, how to get in, and where things are kept.',
        art: _jsx(Ghost, { mood: "open", costume: "witch", size: 86, float: true, emblem: "key" }),
    },
    {
        label: 'Wishes',
        title: () => 'How you’d like things done',
        sub: 'Gentle instructions for the people left to do them.',
        art: _jsx(Ghost, { mood: "happy", costume: "pumpkin", size: 86, float: true }),
    },
    {
        label: 'Circle',
        title: () => 'Who keeps the cards?',
        sub: 'One card each, for people who would come if you needed them.',
        art: (_jsxs("span", { className: "art-trio", children: [_jsx(Ghost, { costume: "bat", size: 56, float: true, phase: 0.3 }), _jsx(Ghost, { costume: "sheet", mood: "happy", size: 70, float: true, phase: 1 }), _jsx(Ghost, { costume: "franken", size: 56, float: true, phase: 1.7 })] })),
    },
    {
        label: 'Seal',
        title: (d) => `Ready, ${d.owner.trim().split(/\s+/)[0] || 'friend'}?`,
        sub: 'Once sealed, the cards are made. You will print them next.',
        art: null,
    },
];
// When updating, the circle and the name are fixed: only these two steps read differently.
const UPDATE_STEPS = {
    4: {
        ...STEPS[4],
        title: () => 'Letters for your circle',
        sub: 'The circle stays the same, so every card still works. To change who holds one, seal a new jar.',
    },
    5: {
        ...STEPS[5],
        title: (d) => `Ready, ${d.owner.trim().split(/\s+/)[0] || 'friend'}?`,
        sub: 'The same cards will open the new words. Nothing new to print.',
    },
};
function draftFrom({ jar, owned }) {
    return {
        owner: jar.owner,
        content: owned.content,
        holders: jar.holders.map((h) => ({ name: h.name, letter: owned.letters[h.x] ?? '', writing: !!owned.letters[h.x] })),
        threshold: jar.threshold,
    };
}
function initialDraft() {
    return {
        owner: '',
        content: emptyContent(),
        holders: [
            { name: '', letter: '', writing: false },
            { name: '', letter: '', writing: false },
            { name: '', letter: '', writing: false },
        ],
        threshold: 2,
    };
}
let kept = null;
export function Seal({ params, embedded }) {
    useAtmosphere('day');
    const [existing, setExisting] = useState(null);
    const [fresh, setFresh] = useState(0);
    if (params.has('update') && !existing)
        return _jsx(OpenForUpdate, { jar: embedded, onOpen: setExisting });
    const startOver = () => {
        kept = null;
        setFresh((n) => n + 1);
    };
    return _jsx(Wizard, { existing: existing, onStartOver: startOver }, existing?.jar.jarId ?? `new-${fresh}`);
}
function Wizard({ existing, onStartOver }) {
    const updating = existing !== null;
    const memory = updating ? null : kept;
    const costumes = useMemo(() => {
        if (!existing)
            return undefined;
        const buddies = circleBuddies(jarIdBytes(existing.jar), existing.jar.holders.map((h) => h.x));
        return existing.jar.holders.map((h) => buddies.get(h.x).costume);
    }, [existing]);
    const [draft, setDraft] = useState(() => (existing ? draftFrom(existing) : (memory?.draft ?? initialDraft())));
    const [step, setStep] = useState(updating ? 1 : (memory?.step ?? 0));
    const [reached, setReached] = useState(updating ? STEPS.length - 1 : (memory?.reached ?? 0));
    const [direction, setDirection] = useState(1);
    const [wax, setWax] = useState('none');
    const [corked, setCorked] = useState(false);
    const [burst, setBurst] = useState(0);
    const [result, setResult] = useState(memory?.result ?? null);
    const [updated, setUpdated] = useState(null);
    useEffect(() => {
        if (!updating)
            kept = { draft, step, reached, result };
    }, [updating, draft, step, reached, result]);
    const [error, setError] = useState('');
    const input = useMemo(() => ({
        owner: draft.owner,
        content: draft.content,
        threshold: draft.threshold,
        holders: draft.holders.map((h) => ({ name: h.name, letter: h.writing ? h.letter : '' })),
    }), [draft]);
    const problems = validateSealInput(input);
    // Nothing is stored anywhere, so ask before the tab is closed. Moving to
    // another page is safe: a new jar's draft is kept in memory (an update's
    // is not, so leaving an update asks too).
    const [original] = useState(() => JSON.stringify(draft));
    const unsaved = updating ? JSON.stringify(draft) !== original : !!(draft.owner || draft.content.message);
    useLeaveWarning(!result && !updated && unsaved ? 'What you wrote is not sealed yet, and is not saved anywhere. Leave anyway?' : null, {
        inApp: updating,
    });
    const goTo = (n) => {
        setDirection(n >= step ? 1 : -1);
        setStep(n);
        setReached((r) => Math.max(r, n));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    // On the circle step, Next stays available and explains what is missing only when pressed.
    const [tried, setTried] = useState(false);
    const canContinue = step === 0 ? draft.owner.trim().length > 0 : true;
    const next = () => {
        if (step === 4 && problems.length) {
            setTried(true);
            return;
        }
        goTo(step + 1);
    };
    const setContent = (patch) => setDraft((d) => ({ ...d, content: { ...d.content, ...patch } }));
    const seal = async () => {
        setError('');
        if (problems.length) {
            setError(problems[0]);
            return;
        }
        // The cork drops in, the wax is stamped, the ghost falls asleep.
        setCorked(true);
        setTimeout(() => sound.cork(), 260);
        const sealing = existing
            ? resealJar(existing.jar, existing.key, {
                content: draft.content,
                letters: Object.fromEntries(existing.jar.holders.map((h, i) => [h.x, draft.holders[i].writing ? draft.holders[i].letter : ''])),
            })
            : sealJar(input);
        sealing.catch(() => undefined); // handled below, once the wax is down
        await wait(380);
        setWax('pressing');
        sound.thud();
        setTimeout(() => setBurst((b) => b + 1), 420);
        try {
            const [sealed] = await Promise.all([sealing, wait(1700)]);
            if ('cards' in sealed)
                setResult(sealed);
            else
                setUpdated(sealed);
            window.scrollTo({ top: 0 });
        }
        catch (e) {
            setCorked(false);
            setWax('none');
            setError(e instanceof Error ? e.message : 'The jar could not be sealed.');
        }
    };
    if (result)
        return _jsx(Sealed, { result: result, onStartOver: onStartOver });
    if (updated)
        return _jsx(Updated, { jar: updated });
    const current = updating ? (UPDATE_STEPS[step] ?? STEPS[step]) : STEPS[step];
    const progress = step / (STEPS.length - 1);
    return (_jsx("div", { className: "page seal-page", children: _jsxs("div", { className: "narrow", children: [_jsxs("div", { className: "trail", "aria-label": `Step ${step + 1} of ${STEPS.length}`, children: [_jsx("div", { className: "trail-track", children: _jsx("div", { className: "trail-fill", style: { width: `${progress * 100}%` } }) }), _jsx("div", { className: "trail-ghost", style: { left: `${progress * 100}%` }, "aria-hidden": "true", children: _jsx(Ghost, { mood: "happy", size: 52, float: true }) }), _jsx("ol", { className: "trail-steps", children: STEPS.map((s, i) => (_jsxs("li", { style: { left: `${(i / (STEPS.length - 1)) * 100}%` }, children: [_jsx("button", { type: "button", className: `trail-dot${i <= step ? ' done' : ''}${i === step ? ' current' : ''}`, disabled: i > reached || (updating && i === 0), onClick: () => goTo(i), "aria-current": i === step ? 'step' : undefined, "aria-label": `Step ${i + 1}: ${s.label}` }), _jsx("span", { className: "trail-label", children: s.label })] }, s.label))) })] }), _jsxs("section", { className: `step-card card ${direction > 0 ? 'enter-right' : 'enter-left'}`, "aria-labelledby": "step-title", children: [current.art && _jsx("div", { className: "step-art", children: current.art }), _jsxs("p", { className: "tag", children: ["step ", step + 1, " of ", STEPS.length] }), _jsx("h1", { id: "step-title", className: "step-title", children: current.title(draft) }), _jsx("p", { className: "lede", children: current.sub }), _jsxs("div", { className: "step-body stack", style: { '--gap': '18px' }, children: [step === 0 && _jsx(StepName, { draft: draft, setOwner: (owner) => setDraft({ ...draft, owner }) }), step === 1 && _jsx(StepMessage, { content: draft.content, setContent: setContent }), step === 2 && _jsx(StepLeave, { content: draft.content, setContent: setContent }), step === 3 && _jsx(StepWishes, { content: draft.content, setContent: setContent }), step === 4 && _jsx(StepCircle, { draft: draft, setDraft: setDraft, locked: updating, costumes: costumes }), step === 5 && (_jsxs("div", { className: "seal-stage", children: [_jsxs("ul", { className: "summary", "aria-label": "What goes in the jar", children: [[
                                                    [draft.content.message.trim() ? draft.content.message.trim().split(/\s+/).length : 0, 'word in your note', 'words in your note'],
                                                    [draft.content.accounts.length, 'account'],
                                                    [draft.content.documents.length, 'place'],
                                                    [Object.values(draft.content.wishes).filter((w) => w.trim()).length, 'wish', 'wishes'],
                                                    [draft.holders.filter((h) => h.writing && h.letter.trim()).length, 'private letter'],
                                                ]
                                                    .filter(([n]) => n > 0)
                                                    .map(([n, one, many]) => (_jsxs("li", { children: [_jsx("b", { children: n }), " ", plural(n, one, many)] }, one))), _jsxs("li", { children: [_jsx("b", { children: capitalised(numberWord(draft.threshold)) }), " of ", numberWord(draft.holders.length), " to open"] })] }), _jsxs("div", { className: "seal-jar", children: [_jsx(Jar, { initials: initialsOf(draft.owner), wax: wax, corked: corked, state: wax === 'pressing' ? 'sealed' : 'stirring', warmth: 0.5, size: 180 }), _jsx(Sparkles, { burst: burst, radius: 130, count: 16 })] }), _jsx("button", { type: "button", className: "btn primary big", onClick: seal, disabled: corked, children: corked ? 'Sealing…' : updating ? 'Seal the new words' : 'Seal the jar' }), error && (_jsx("p", { className: "error", role: "alert", children: error }))] }))] }), step === 4 && tried && problems.length > 0 && !problems[0].includes('same name') && (_jsx("p", { className: "error", role: "status", children: problems[0] })), step < 5 && (_jsxs("div", { className: "step-nav", children: [step > (updating ? 1 : 0) ? (_jsx("button", { type: "button", className: "text-btn quiet", onClick: () => goTo(step - 1), children: "\u2190 Back" })) : (_jsx("span", {})), _jsx("button", { type: "button", className: "btn primary", onClick: next, disabled: !canContinue, children: step === 4 ? 'Almost done →' : 'Next →' })] })), step === 5 && (_jsxs("div", { className: "step-nav", children: [_jsx("button", { type: "button", className: "text-btn quiet", onClick: () => goTo(4), children: "\u2190 Back" }), _jsx("span", {})] }))] }, step)] }) }));
}
