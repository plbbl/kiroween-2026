import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { CardError, parseCard } from '../../core/cards.ts';
import { JarError, openWithKey } from '../../core/jar.ts';
import { Ghost } from '../../ui/art/Ghost.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { initialsOf } from '../../ui/art/WaxSeal.tsx';
import { CardInput } from '../../ui/components/CardInput.tsx';
import { jarFromText } from '../../ui/grimoire.ts';
import { href } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';
/**
 * The owner opens their own jar with their key card, to change what is in
 * it. A jar file opened from disk already carries its jar; otherwise the
 * owner chooses the file first.
 */
export function OpenForUpdate({ jar: given, onOpen }) {
    const [jar, setJar] = useState(given);
    const [fileError, setFileError] = useState('');
    const [over, setOver] = useState(false);
    const readFile = async (file) => {
        setFileError('');
        try {
            setJar(jarFromText(await file.text()));
        }
        catch (e) {
            setFileError(e instanceof JarError ? e.message : 'That file isn’t a jar.');
        }
    };
    const tryKey = async (text) => {
        if (!jar)
            return 'Choose your jar file first.';
        let card;
        try {
            card = parseCard(text);
        }
        catch (e) {
            return e instanceof CardError ? e.message : 'That key could not be read.';
        }
        if (card.kind !== 'key')
            return 'That’s a friend’s card. This needs your own key, the page printed for you.';
        try {
            const owned = await openWithKey(jar, card);
            sound.chime();
            window.scrollTo({ top: 0, behavior: 'instant' });
            onOpen({ jar, key: card, owned });
            return null;
        }
        catch (e) {
            return e instanceof JarError ? e.message : 'That key did not open the jar.';
        }
    };
    const first = jar?.owner.split(/\s+/)[0];
    return (_jsxs("div", { className: "page update-page", children: [_jsxs("section", { className: "narrow center", children: [_jsx("p", { className: "tag pop", children: "update" }), _jsx("h1", { className: "pop", style: { '--d': '80ms' }, children: first ? `${first}’s jar` : 'Change what’s inside' }), _jsx("p", { className: "lede rise", style: { '--d': '160ms' }, children: "With your key, write new words into the same jar. Your friends keep their cards." })] }), _jsxs("section", { className: "narrow update-steps", children: [_jsxs("div", { className: `card update-step${jar ? ' done' : ''}`, children: [_jsx("span", { className: "todo-num", children: "1" }), jar ? (_jsxs("div", { className: "update-jar", children: [_jsx(Jar, { initials: initialsOf(jar.owner), size: 96 }), _jsxs("div", { children: [_jsxs("h3", { children: [jar.owner, "\u2019s jar"] }), _jsxs("p", { className: "muted", children: ["Sealed ", new Date(jar.sealedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), jar.revision && jar.revision > 1 ? ` · version ${jar.revision}` : '', " \u00B7 ", jar.holders.map((h) => h.name.split(/\s+/)[0]).join(', ')] }), !given && (_jsx("button", { type: "button", className: "text-btn", onClick: () => setJar(null), children: "Choose another file" }))] })] })) : (_jsxs("label", { className: `update-drop${over ? ' over' : ''}`, onDragOver: (e) => {
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
                                        } }), _jsx("h3", { children: "Your jar file" }), _jsx("span", { className: "muted", children: "Drop it here, or tap to choose it. It is read on this device only." }), fileError && _jsx("span", { className: "error", children: fileError })] }))] }), _jsxs("div", { className: `card update-step${jar ? '' : ' waiting'}`, children: [_jsx("span", { className: "todo-num", children: "2" }), _jsxs("div", { children: [_jsx("h3", { children: "Your key" }), _jsx("p", { className: "muted", children: "The page printed for you when you sealed the jar. Not a friend\u2019s card." }), _jsx(CardInput, { kind: "key", onCard: tryKey, disabled: !jar })] })] }), _jsxs("p", { className: "note", children: [_jsx(Ghost, { size: 30, mood: "wink" }), _jsxs("span", { children: ["Lost your key? Then this jar can\u2019t be changed, but it still opens for your circle. You can always", ' ', _jsx("a", { href: href('seal'), children: "seal a new jar" }), " with new cards."] })] })] })] }));
}
