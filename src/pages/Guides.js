import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Ghost } from '../ui/art/Ghost.tsx';
import { useAtmosphere } from '../ui/shell.tsx';
const BEFORE = [
    {
        title: 'Name a Legacy Contact for your Apple Account',
        body: 'They get an access key. With it and a death certificate they can ask for your photos, files and backups. Passwords in your Apple keychain are not included, so put the important ones in your jar.',
        link: { href: 'https://support.apple.com/en-us/102631', label: 'Apple Support' },
    },
    {
        title: 'Set up Google’s Inactive Account Manager',
        body: 'Choose how long Google waits after your account goes quiet (three to eighteen months), and up to ten people who may then download your data.',
        link: { href: 'https://myaccount.google.com/inactive', label: 'Google' },
    },
    {
        title: 'Choose a legacy contact on Facebook',
        body: 'They can look after your memorialised profile, but cannot read your messages. You can choose deletion instead.',
        link: { href: 'https://www.facebook.com/help/1568013990080948', label: 'Facebook Help' },
    },
    {
        title: 'Give your password manager a way in',
        body: 'Most have an emergency access feature or a printable emergency kit. The simplest plan: write the master password into your jar.',
        link: { href: 'https://bitwarden.com/help/emergency-access/', label: 'An example from Bitwarden' },
    },
    {
        title: 'Think about two-step sign-in',
        body: 'If your accounts need a code from your phone, your people will need the phone and its passcode, or your backup codes. Say where they are.',
    },
    {
        title: 'Tell your friends they hold a card',
        body: 'Give cards by hand if you can, and say what they are for. A card no one remembers won’t come to the séance.',
    },
];
const AFTER = [
    {
        title: 'In the first hours',
        body: 'If the death was at home and not expected, call 911. If it was expected, call their doctor or hospice. Then a funeral home can help with what comes next.',
    },
    {
        title: 'Order a few certified death certificates',
        body: 'Banks, insurers and agencies will each want one. The funeral home can usually order them.',
        link: { href: 'https://www.usa.gov/death-certificate', label: 'USAGov' },
    },
    {
        title: 'Look after the home, the car and the animals',
        body: 'Lock up, collect the mail, water the plants. The jar may say who takes the pets.',
    },
    {
        title: 'Tell Social Security and Medicare',
        body: 'Funeral homes often do this. If not, call Social Security. Payments for the month of death may need to be returned.',
        link: { href: 'https://www.usa.gov/social-security-report-a-death', label: 'USAGov' },
    },
    {
        title: 'Let the others know',
        body: 'Employer, banks, insurers, pension, the three credit bureaus (ask for a deceased alert, which helps prevent identity theft), and the post office.',
        link: { href: 'https://www.usa.gov/report-a-death', label: 'USAGov: who to notify' },
    },
    {
        title: 'Follow the wishes for each account',
        body: 'The jar says what to close, keep, memorialise or hand over. Download photos and files before anything is closed.',
    },
    {
        title: 'Find the will',
        body: 'If there is one, the jar should say where. The executor takes it to the county probate court, which can also explain what happens if there is none.',
    },
    {
        title: 'Let the days be slow',
        body: 'Almost nothing here is urgent. Eat something warm. Sleep. Let people help.',
    },
];
function Checklist({ items, id }) {
    const [done, setDone] = useState(() => items.map(() => false));
    const count = done.filter(Boolean).length;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "meter", "aria-hidden": "true", children: _jsx("div", { className: "meter-fill", style: { width: `${(count / items.length) * 100}%` } }) }), _jsxs("p", { className: "faint meter-text", children: [count, " of ", items.length, " done"] }), _jsx("ol", { className: "checklist", children: items.map((it, i) => (_jsxs("li", { className: done[i] ? 'done' : '', children: [_jsxs("label", { className: "check", children: [_jsx("input", { type: "checkbox", checked: done[i], onChange: () => setDone(done.map((d, j) => (j === i ? !d : d))), "aria-describedby": `${id}-${i}` }), _jsx("span", { className: "check-box", "aria-hidden": "true", children: _jsx("svg", { viewBox: "0 0 20 20", children: _jsx("path", { d: "M4.5 10.5 L8.5 14.5 L15.5 6" }) }) }), _jsx("span", { className: "check-title", children: it.title })] }), _jsx("p", { id: `${id}-${i}`, children: it.body }), it.link && (_jsxs("a", { href: it.link.href, target: "_blank", rel: "noreferrer noopener", children: [it.link.label, " \u2197"] }))] }, it.title))) })] }));
}
function GuideCard({ id, tag, title, sub, costume, mood, items }) {
    return (_jsxs("section", { className: "card guide", id: id, "aria-labelledby": `${id}-title`, children: [_jsx("div", { className: "guide-ghost", children: _jsx(Ghost, { costume: costume, mood: mood, size: 84, float: true }) }), _jsx("p", { className: "tag", children: tag }), _jsx("h2", { id: `${id}-title`, children: title }), _jsx("p", { className: "muted", children: sub }), _jsx(Checklist, { items: items, id: id })] }));
}
export function Guides({ anchor }) {
    useAtmosphere('day');
    useEffect(() => {
        if (anchor)
            document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [anchor]);
    return (_jsxs("div", { className: "page guides-page", children: [_jsxs("section", { className: "narrow center", children: [_jsx("p", { className: "tag pop", children: "guides" }), _jsx("h1", { className: "pop", style: { '--d': '100ms' }, children: "Before, and after" }), _jsx("p", { className: "lede rise", style: { '--d': '200ms' }, children: "The doors the world already has, and what to do when the time comes. Ticks stay on this page only." })] }), _jsxs("div", { className: "narrow guides", children: [_jsx(GuideCard, { id: "before", tag: "before", title: "Doors you can leave open", sub: "Each company has its own way to let someone in. Most people never set one up.", costume: "witch", mood: "wink", items: BEFORE }), _jsx(GuideCard, { id: "after", tag: "after", title: "For the days that follow", sub: "For the people left to do things. Written for the United States.", costume: "sheet", mood: "happy", items: AFTER }), _jsxs("p", { className: "center faint", children: ["More from the U.S. government:", ' ', _jsx("a", { href: "https://www.usa.gov/death-loved-one", target: "_blank", rel: "noreferrer noopener", children: "dealing with the death of a loved one \u2197" })] })] })] }));
}
