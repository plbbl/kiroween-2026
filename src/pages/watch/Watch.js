import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_WATCH, holderMessage, ownerReminder, runWatch } from '../../core/watch.ts';
import { DEMO_JAR } from '../../demo/demo.ts';
import { Ghost } from '../../ui/art/Ghost.tsx';
import { numberWord, plural } from '../../ui/text.ts';
import { useAtmosphere } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';
import { watchAvailable } from '../../ui/watchApi.ts';
import { LinkAction, linkActionOf, StartWatch } from './RealWatch.tsx';
const OWNER = DEMO_JAR.owner;
const FIRST = OWNER.split(' ')[0];
const HOLDERS = DEMO_JAR.holders.map((h) => h.name);
const MOOD = {
    well: { mood: 'happy', say: 'All good! See you soon.' },
    paused: { mood: 'sleep', say: 'Resting while you’re away.' },
    due: { mood: 'curious', say: 'Still here?' },
    reminding: { mood: 'worried', say: 'Hello? Just tap to say you’re okay.' },
    notified: { mood: 'sad', say: 'I’ve asked your friends to check on you.' },
};
function Segmented({ label, value, options, onChange }) {
    return (_jsxs("div", { className: "segmented-field", children: [_jsx("span", { className: "label", children: label }), _jsx("div", { className: "segmented", role: "radiogroup", "aria-label": label, children: options.map((o) => (_jsx("button", { type: "button", role: "radio", "aria-checked": value === o.value, className: value === o.value ? 'on' : '', onClick: () => onChange(o.value), children: o.label }, o.value))) })] }));
}
export function Watch({ params }) {
    useAtmosphere('day');
    const [service, setService] = useState(null);
    useEffect(() => {
        void watchAvailable().then(setService);
    }, []);
    const [config, setConfig] = useState(DEFAULT_WATCH);
    const [actions, setActions] = useState([]);
    const [day, setDay] = useState(0);
    const [playing, setPlaying] = useState(false);
    const horizon = Math.max(21, Math.ceil((config.cadenceDays + config.graceDays + 7) / 7) * 7);
    const run = useMemo(() => runWatch(config, actions, day), [config, actions, day]);
    const full = useMemo(() => runWatch(config, actions, horizon), [config, actions, horizon]);
    const paused = run.status === 'paused';
    // Back after friends were asked: they are told all is well.
    const relieved = run.status === 'well' && run.events.some((e) => e.kind === 'notify' && e.at < run.lastSign);
    const face = relieved ? { mood: 'happy', say: 'Phew! I told your friends you’re okay.' } : MOOD[run.status];
    useEffect(() => {
        if (!playing)
            return;
        const t = window.setInterval(() => {
            setDay((d) => {
                if (d >= horizon) {
                    setPlaying(false);
                    return d;
                }
                return Math.round((d + 0.125) * 1000) / 1000;
            });
        }, 70);
        return () => clearInterval(t);
    }, [playing, horizon]);
    // A soft sound whenever a new message goes out.
    const sent = run.events.filter((e) => e.kind === 'reminder' || e.kind === 'notify').length;
    const lastSent = useRef(0);
    useEffect(() => {
        if (sent > lastSent.current)
            sound.strike();
        lastSent.current = sent;
    }, [sent]);
    const act = (type) => {
        setActions((a) => [...a, { at: day, type }]);
        if (type === 'checkin')
            sound.chime();
    };
    const reset = () => {
        setPlaying(false);
        setActions([]);
        setDay(0);
    };
    const messages = run.events.filter((e) => e.kind === 'reminder' || e.kind === 'notify' || e.kind === 'checkin' || e.kind === 'pause' || e.kind === 'resume');
    // Like a chat: the newest message is always in view.
    const inbox = useRef(null);
    useEffect(() => {
        const el = inbox.current;
        if (el)
            el.scrollTop = el.scrollHeight;
    }, [messages.length]);
    const pct = (at) => `${(Math.min(at, horizon) / horizon) * 100}%`;
    const remindersNow = run.events.filter((e) => e.kind === 'reminder' && e.at > run.lastSign).length;
    // Opened from an emailed link: that link is the page; the preview follows.
    const linked = !!linkActionOf(params);
    // Where the watch service runs, starting a real watch comes first, beside the rhythm it will use.
    const realFirst = service === true && !linked;
    return (_jsxs("div", { className: "page watch-page", children: [linked ? (_jsxs("div", { className: "narrow", children: [_jsx(LinkAction, { params: params }), _jsx("h2", { className: "center section-title how-it-works", children: "How the watch works" })] })) : (_jsxs("section", { className: "narrow center watch-head", children: [_jsxs("div", { className: "watch-hero", children: [_jsx("div", { className: "speech pop", children: face.say }, relieved ? 'relieved' : run.status), _jsx(Ghost, { mood: face.mood, size: 130, float: true, shadow: true })] }), _jsx("p", { className: "tag", children: "watch" }), _jsx("h1", { children: "Still here?" }), _jsx("p", { className: "lede", children: "One gentle question now and then. Go quiet, and your friends are asked to look in on you." })] })), _jsxs("section", { className: "wrap watch-grid", children: [_jsxs("div", { className: "card rhythm", children: [_jsx("h2", { className: "card-title", children: "Your rhythm" }), _jsx(Segmented, { label: "Ask me every", value: config.cadenceDays, options: [
                                    { value: 1, label: 'day' },
                                    { value: 3, label: '3 days' },
                                    { value: 7, label: 'week' },
                                    { value: 14, label: '2 weeks' },
                                    { value: 30, label: 'month' },
                                ], onChange: (cadenceDays) => setConfig({ ...config, cadenceDays }) }), _jsx(Segmented, { label: "Wait for my answer", value: config.graceDays, options: [2, 4, 7, 14].map((v) => ({ value: v, label: `${v}d` })), onChange: (graceDays) => setConfig({ ...config, graceDays }) }), _jsx(Segmented, { label: "Remind me", value: config.reminders, options: [1, 2, 3, 5].map((v) => ({ value: v, label: `${v}×` })), onChange: (reminders) => setConfig({ ...config, reminders }) }), _jsxs("p", { className: "rhythm-sum", children: ["Friends are asked only after ", _jsxs("b", { children: [config.cadenceDays + config.graceDays, " days"] }), " of silence and ", _jsx("b", { children: numberWord(config.reminders) }), ' ', "reminder", config.reminders > 1 ? 's' : '', ". Never sooner."] })] }), _jsxs("div", { className: "watch-main", children: [realFirst && (_jsxs(_Fragment, { children: [_jsx(StartWatch, { config: config }), _jsx("h2", { className: "section-title how-title", children: "See how it works" })] })), _jsxs("div", { className: "card timeline", children: [_jsxs("div", { className: "spread", children: [_jsxs("h2", { className: "card-title", children: [_jsx("span", { className: "tag try-tag", children: "try it" }), " Day ", _jsx("span", { className: "day-num", children: Math.floor(day) })] }), _jsx("span", { className: `status-pill s-${run.status}`, children: run.status === 'reminding' ? `reminder ${remindersNow} of ${config.reminders}` : run.status === 'notified' ? 'friends asked' : run.status })] }), _jsxs("div", { className: "track", "aria-label": `Day ${Math.floor(day)} of ${horizon}`, children: [_jsx("div", { className: "track-line" }), _jsx("div", { className: "track-past", style: { width: pct(day) } }), Array.from({ length: horizon + 1 }, (_, d) => (_jsx("span", { className: `day${d % 7 === 0 ? ' week' : ''}`, style: { left: pct(d) }, children: d % 7 === 0 && _jsx("i", { children: d }) }, d))), full.events
                                                .filter((e) => e.at <= horizon)
                                                .map((e, i) => (_jsx("span", { className: `mark m-${e.kind}${e.at <= day ? ' passed' : ''}`, style: { left: pct(e.at) }, title: `${e.kind}, day ${e.at.toFixed(1)}` }, i))), _jsx("span", { className: "walker", style: { left: pct(day) }, "aria-hidden": "true", children: _jsx(Ghost, { mood: face.mood, size: 54, float: true }) })] }), _jsxs("div", { className: "legend", children: [_jsxs("span", { children: [_jsx("i", { className: "m-checkin" }), " you said hi"] }), _jsxs("span", { children: [_jsx("i", { className: "m-due" }), " a hello is due"] }), _jsxs("span", { children: [_jsx("i", { className: "m-reminder" }), " a reminder"] }), _jsxs("span", { children: [_jsx("i", { className: "m-notify" }), " friends asked"] })] }), _jsxs("div", { className: "row controls", children: [_jsx("button", { type: "button", className: "btn primary small", onClick: () => setPlaying(!playing), disabled: day >= horizon, children: playing ? 'Pause time' : day >= horizon ? 'That’s all' : 'Let time pass' }), _jsx("button", { type: "button", className: "btn small", onClick: () => act('checkin'), disabled: paused, children: run.status === 'notified' ? 'Knock knock, I’m here!' : 'Say “I’m here”' }), _jsx("button", { type: "button", className: "btn small", onClick: () => act(paused ? 'resume' : 'pause'), children: paused ? 'Back again' : 'Go away for a bit' }), _jsx("button", { type: "button", className: "text-btn quiet", onClick: reset, children: "Start over" })] })] }), _jsxs("section", { className: "card inbox", "aria-labelledby": "inbox-title", children: [_jsxs("div", { className: "spread", children: [_jsx("h2", { id: "inbox-title", className: "card-title", children: "What would be sent" }), _jsx("span", { className: "faint", children: messages.length > 0 && `${messages.length} ${plural(messages.length, 'message')}` })] }), messages.length === 0 ? (_jsxs("div", { className: "inbox-empty", children: [_jsx(Ghost, { mood: "sleep", size: 56, float: true }), _jsx("p", { className: "faint", children: "Quiet so far. Let time pass, and don\u2019t answer." })] })) : (_jsx("ol", { className: "inbox-list", ref: inbox, tabIndex: 0, "aria-label": "Messages, oldest first", children: messages.map((e, i) => (_jsx(Message, { event: e, of: config.reminders, silentDays: config.cadenceDays + config.graceDays, afterNotify: e.kind === 'checkin' && messages[i - 1]?.kind === 'notify' }, `${e.kind}-${e.at}-${e.n ?? 0}`))) })), _jsx("p", { className: "inbox-foot faint", children: "A preview with June\u2019s demo jar: nothing here is really sent. A real watch knows names, email addresses and times, never what your jar says." })] })] })] }), _jsx("div", { className: "narrow service", children: service === false && (_jsxs("p", { className: "note", children: [_jsx(Ghost, { size: 30, mood: "sleep" }), _jsx("span", { children: "This copy of Phylactery has no watch service (the offline jar file never does), so here you can only try the rhythm. Everything else works." })] })) })] }));
}
const friendsLine = HOLDERS.map((h) => h.split(' ')[0]).join(', ');
function Message({ event, of, silentDays, afterNotify = false }) {
    const when = `day ${Math.floor(event.at)}`;
    if (event.kind === 'checkin' || event.kind === 'pause' || event.kind === 'resume') {
        const text = event.kind === 'checkin' ? 'I’m here!' : event.kind === 'pause' ? 'Away for a while.' : 'Back again!';
        return (_jsxs(_Fragment, { children: [_jsxs("li", { className: "msg from-owner pop", children: [_jsxs("span", { className: "msg-meta", children: [FIRST, " \u00B7 ", when] }), _jsx("p", { children: text })] }), afterNotify && (_jsxs("li", { className: "msg to-friends relief pop", children: [_jsxs("span", { className: "msg-meta", children: ["to ", friendsLine, " \u00B7 ", when] }), _jsxs("p", { className: "msg-title", children: [OWNER, " is okay"] }), _jsxs("p", { children: ["Good news: ", OWNER, " just answered us. All is well, and there is nothing more to do. Thank you for caring."] })] }))] }));
    }
    if (event.kind === 'reminder') {
        const m = ownerReminder(FIRST, event.n ?? 1, of);
        return (_jsxs("li", { className: "msg to-owner pop", children: [_jsxs("span", { className: "msg-meta", children: ["to ", FIRST, " \u00B7 ", when] }), _jsx("p", { className: "msg-title", children: m.subject }), _jsx("p", { children: m.body })] }));
    }
    const m = holderMessage(OWNER, HOLDERS[0], { days: silentDays, asked: of + 1 });
    return (_jsxs("li", { className: "msg to-friends pop", children: [_jsxs("span", { className: "msg-meta", children: ["to ", friendsLine, " \u00B7 ", when] }), _jsx("p", { className: "msg-title", children: m.subject }), _jsx("p", { children: m.body.split('\n\n').slice(1, 3).join(' ') })] }));
}
