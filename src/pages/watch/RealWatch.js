import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { JarError } from '../../core/jar.ts';
import { Sparkles } from '../../ui/art/Decor.tsx';
import { Ghost } from '../../ui/art/Ghost.tsx';
import { sound } from '../../ui/sound.ts';
import { firstName, numberWord, plural } from '../../ui/text.ts';
import { jarFromText } from '../../ui/grimoire.ts';
import { ApiError, jarHandoff, watchApi } from '../../ui/watchApi.ts';
/** A button that reads a jar file chosen by the owner. */
function JarFileButton({ label, onJar, className = 'btn small' }) {
    const [error, setError] = useState('');
    return (_jsxs("span", { className: "jar-file-button", children: [_jsxs("label", { className: className, children: [label, _jsx("input", { type: "file", accept: ".html,.json,text/html,application/json", onChange: async (e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (!f)
                                return;
                            try {
                                setError('');
                                onJar(jarFromText(await f.text()));
                            }
                            catch (err) {
                                setError(err instanceof JarError ? err.message : 'That file isn’t a jar.');
                            }
                        } })] }), error && _jsx("span", { className: "error", children: error })] }));
}
const versionOf = (j) => j.revision ?? 1;
const day = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : '';
/** Which emailed link, if any, opened this page. */
export const linkActionOf = (params) => ['confirm', 'here', 'manage', 'optout'].find((a) => params.has(a));
/** Handles the links in watch emails: #/watch?confirm=…, ?here=…, ?manage=…, ?optout=… */
export function LinkAction({ params }) {
    const action = linkActionOf(params);
    const token = action ? (params.get(action) ?? '') : '';
    const [view, setView] = useState(null);
    const [left, setLeft] = useState(null);
    const [deleted, setDeleted] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const ran = useRef('');
    useEffect(() => {
        if (!action || ran.current === `${action}:${token}`)
            return;
        ran.current = `${action}:${token}`;
        const run = async () => {
            try {
                if (action === 'confirm')
                    setView(await watchApi.confirm(token));
                if (action === 'here')
                    setView(await watchApi.checkin(token));
                if (action === 'manage')
                    setView(await watchApi.status(token));
                if (action === 'optout')
                    setLeft((await watchApi.optOut(token)).owner);
                if (action !== 'manage')
                    sound.chime();
            }
            catch (e) {
                setError(e instanceof ApiError ? e.message : 'The watch service is not answering.');
            }
        };
        void run();
    }, [action, token]);
    if (!action)
        return null;
    const act = async (fn) => {
        setBusy(true);
        setError('');
        try {
            setView(await fn());
        }
        catch (e) {
            setError(e instanceof ApiError ? e.message : 'Something went wrong.');
        }
        finally {
            setBusy(false);
        }
    };
    let mood = 'open';
    let title = 'One moment…';
    let body = '';
    if (error) {
        mood = 'worried';
        title = 'Hmm, that didn’t work';
        body = error;
    }
    else if (deleted) {
        mood = 'sleep';
        title = 'Your watch is gone';
        body = 'Everything about it was deleted. You can start a new one any time.';
    }
    else if (left !== null) {
        mood = 'happy';
        title = `You’ve left ${left}’s watch`;
        body = 'You won’t be asked to check on them again. Thank you.';
    }
    else if (view) {
        if (action === 'confirm') {
            mood = 'happy';
            title = 'You’re all set!';
            body = `We’ll ask “still here?” about every ${view.config.cadenceDays === 1 ? 'day' : `${view.config.cadenceDays} days`}. The first time will be ${day(view.nextAsk)}. Keep the email we sent: its manage link is your way back here.`;
        }
        else if (action === 'here') {
            mood = 'happy';
            title = `Thank you, ${firstName(view.owner)}!`;
            body = `Glad you’re here. We’ll ask again ${view.nextAsk ? `on ${day(view.nextAsk)}` : 'soon'}.`;
        }
        else {
            mood = view.status === 'paused' ? 'sleep' : view.status === 'well' ? 'happy' : 'worried';
            title = `${firstName(view.owner)}’s watch`;
            body = view.status === 'paused' ? 'Paused. Nothing will be sent until you resume.' : view.nextAsk ? `Next “still here?” on ${day(view.nextAsk)}.` : 'We are waiting for a sign from you.';
        }
    }
    return (_jsxs("section", { className: "card link-result pop", "aria-live": "polite", children: [_jsxs("div", { className: "link-ghost", children: [_jsx(Ghost, { mood: mood, size: 88, float: true }), (action === 'confirm' || action === 'here') && view && _jsx(Sparkles, { burst: `${action}-${view.lastSign}`, radius: 90 })] }), _jsx("h1", { children: title }), body && _jsx("p", { className: "muted", children: body }), error && action !== 'optout' && (_jsx("p", { className: "faint", children: "Each new email replaces the links in the one before. Try the newest email from us." })), action === 'manage' && view && !deleted && (_jsxs(_Fragment, { children: [_jsxs("ul", { className: "watch-facts", children: [_jsxs("li", { children: [_jsx("b", { children: view.holders.length }), " ", plural(view.holders.length, 'friend'), " would be asked: ", view.holders.join(', ')] }), _jsxs("li", { children: ["Ask every ", _jsx("b", { children: view.config.cadenceDays }), " ", plural(view.config.cadenceDays, 'day'), ", then wait ", _jsx("b", { children: view.config.graceDays }), " days with", ' ', _jsx("b", { children: numberWord(view.config.reminders) }), " ", plural(view.config.reminders, 'reminder')] }), view.lastSign && _jsxs("li", { children: ["Last sign from you: ", day(view.lastSign)] }), _jsx("li", { children: view.jar
                                    ? `A locked copy of your jar is kept: version ${view.jar.revision}, given ${day(view.jar.keptAt)}. If your friends are asked, each gets a link to it.`
                                    : 'No copy of your jar is kept. If your friends are asked, they will need the jar file you gave them.' })] }), _jsx(KeptJarActions, { view: view, busy: busy, onKeep: (jar) => act(() => watchApi.keepJar(token, jar)) }), _jsxs("div", { className: "row centered", children: [_jsx("button", { type: "button", className: "btn primary small", disabled: busy, onClick: () => act(() => watchApi.checkin(token)), children: "I\u2019m here!" }), view.status === 'paused' ? (_jsx("button", { type: "button", className: "btn small", disabled: busy, onClick: () => act(() => watchApi.resume(token)), children: "Resume" })) : (_jsx("button", { type: "button", className: "btn small", disabled: busy, onClick: () => act(() => watchApi.pause(token)), children: "Pause, I\u2019m away" })), _jsx("button", { type: "button", className: "text-btn quiet", disabled: busy, onClick: async () => {
                                    if (!window.confirm('Delete this watch and everything it knows? This cannot be undone.'))
                                        return;
                                    try {
                                        await watchApi.remove(token);
                                        setDeleted(true);
                                    }
                                    catch (e) {
                                        setError(e instanceof ApiError ? e.message : 'Something went wrong.');
                                    }
                                }, children: "Delete the watch" })] })] }))] }));
}
/** Give the watch the newest jar, or take the copy back. */
function KeptJarActions({ view, busy, onKeep }) {
    const fresh = jarHandoff.peek();
    const newer = fresh && (!view.jar || versionOf(fresh) > view.jar.revision || fresh.sealedAt !== view.jar.sealedAt);
    return (_jsxs("div", { className: "row centered kept-jar-actions", children: [newer && (_jsxs("button", { type: "button", className: "btn small primary", disabled: busy, onClick: () => onKeep(fresh), children: ["Keep the jar you just ", versionOf(fresh) > 1 ? 'updated' : 'sealed'] })), _jsx(JarFileButton, { label: view.jar ? 'Give a newer jar file' : 'Keep a copy of my jar file', onJar: onKeep }), view.jar && (_jsx("button", { type: "button", className: "text-btn quiet", disabled: busy, onClick: () => onKeep(null), children: "Remove the copy" }))] }));
}
/** Start a real watch. Shown only where the service is running. */
export function StartWatch({ config }) {
    // Coming from a jar just sealed: its names are already known; only the emails are new.
    const handed = jarHandoff.peek();
    const [owner, setOwner] = useState({ name: handed?.owner ?? '', email: '' });
    const [friends, setFriends] = useState(() => handed ? handed.holders.slice(0, 10).map((h) => ({ name: h.name, email: '' })) : [
        { name: '', email: '' },
        { name: '', email: '' },
    ]);
    const [state, setState] = useState('idle');
    const [error, setError] = useState('');
    const [jar, setJar] = useState(handed);
    const [keep, setKeep] = useState(true);
    const filled = friends.filter((f) => f.name.trim() || f.email.trim());
    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setState('sending');
        try {
            await watchApi.start({ owner, holders: filled, config, ...(jar && keep ? { jar: JSON.stringify(jar) } : {}) });
            setState('sent');
            sound.chime();
        }
        catch (err) {
            setState('idle');
            setError(err instanceof ApiError ? err.message : 'The watch service is not answering.');
        }
    };
    if (state === 'sent') {
        return (_jsxs("section", { className: "card start-watch sent pop", "aria-live": "polite", children: [_jsxs("div", { className: "link-ghost", children: [_jsx(Ghost, { mood: "happy", size: 88, float: true }), _jsx(Sparkles, { burst: "sent", radius: 90 })] }), _jsx("h2", { children: "Check your inbox" }), _jsxs("p", { className: "muted", children: ["We sent a link to ", _jsx("b", { children: owner.email }), ". Nothing happens until you tap it. If it isn\u2019t there in a few minutes, look in spam."] })] }));
    }
    return (_jsxs("form", { className: "card start-watch", onSubmit: submit, "aria-labelledby": "start-title", children: [_jsx("p", { className: "tag", children: "for real" }), _jsx("h2", { id: "start-title", children: "Start your watch" }), _jsxs("p", { className: "muted", children: ["It uses your rhythm", _jsx("span", { className: "rhythm-where", children: " (beside this)" }), ". We keep names, emails and times, and a locked copy of your jar only if you choose. Pause or delete it any time from the link we send."] }), _jsxs("div", { className: "person-grid", children: [_jsxs("label", { className: "field", children: [_jsx("span", { children: "Your name" }), _jsx("input", { type: "text", required: true, value: owner.name, onChange: (e) => setOwner({ ...owner, name: e.target.value }), autoComplete: "name" })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Your email" }), _jsx("input", { type: "email", required: true, value: owner.email, onChange: (e) => setOwner({ ...owner, email: e.target.value }), autoComplete: "email" })] })] }), _jsx("p", { className: "label friends-label", children: "Friends to ask, if you go quiet" }), friends.map((f, i) => (_jsxs("div", { className: "person-grid", children: [_jsxs("label", { className: "field", children: [_jsxs("span", { className: "visually-hidden", children: ["Friend ", i + 1, " name"] }), _jsx("input", { type: "text", placeholder: `Friend ${i + 1}’s name`, value: f.name, onChange: (e) => setFriends(friends.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))) })] }), _jsxs("label", { className: "field", children: [_jsxs("span", { className: "visually-hidden", children: ["Friend ", i + 1, " email"] }), _jsx("input", { type: "email", placeholder: "their@email", value: f.email, onChange: (e) => setFriends(friends.map((x, j) => (j === i ? { ...x, email: e.target.value } : x))) })] })] }, i))), _jsxs("div", { className: "keep-jar", children: [_jsx("p", { className: "label", children: "Your jar, for your friends" }), jar ? (_jsxs("label", { className: "keep-jar-check", children: [_jsx("input", { type: "checkbox", checked: keep, onChange: (e) => setKeep(e.target.checked) }), _jsxs("span", { children: ["Keep a locked copy of ", jar.owner, "\u2019s jar", versionOf(jar) > 1 ? ` (version ${versionOf(jar)})` : '', ". If your friends are ever asked, each gets a link to it, so no one has to keep the file for years. Without their cards (or your key) it can\u2019t be read, by us or anyone."] })] })) : (_jsxs("p", { className: "muted keep-jar-none", children: ["Optional: ", _jsx(JarFileButton, { label: "choose your jar file", onJar: setJar, className: "text-btn" }), " and we keep a locked copy, so no one has to keep the file for years."] }))] }), _jsxs("div", { className: "spread", children: [friends.length < 10 ? (_jsx("button", { type: "button", className: "text-btn", onClick: () => setFriends([...friends, { name: '', email: '' }]), children: "+ another friend" })) : (_jsx("span", {})), _jsx("button", { type: "submit", className: "btn primary", disabled: state === 'sending' || filled.length === 0, children: state === 'sending' ? 'Sending…' : 'Start the watch' })] }), filled.length === 0 && _jsx("p", { className: "faint start-hint", children: "Add at least one friend to start." }), error && (_jsx("p", { className: "error", role: "alert", children: error }))] }));
}
