import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';
import { KEY_WORDS, SEAL_WORDS, SHARD_WORDS } from '../../core/cards.ts';
import { isKnownWord, splitWords, suggest } from '../../core/words.ts';
function nativeDetector() {
    const BD = window.BarcodeDetector;
    try {
        return BD ? new BD({ formats: ['qr_code'] }) : null;
    }
    catch {
        return null;
    }
}
function decodeCanvas(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx)
        return null;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}
/** A friend who typed the other half of their card, or the owner's key, is told so. */
function wrongHalf(kind, count) {
    if (kind === 'shard' && count === SEAL_WORDS)
        return 'That looks like your private seal, the folded half. Use the 30 words on the outside.';
    if (kind === 'seal' && count === SHARD_WORDS)
        return 'That looks like the outside of your card. Use the 17 words on the folded half.';
    if (kind !== 'key' && count === KEY_WORDS)
        return 'That looks like the owner’s key. Use your own card.';
    return null;
}
export function CardInput({ kind, onCard, disabled = false }) {
    const [mode, setMode] = useState('words');
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const expected = kind === 'shard' ? SHARD_WORDS : kind === 'seal' ? SEAL_WORDS : KEY_WORDS;
    const where = kind === 'shard' ? 'on the outside of the card' : kind === 'seal' ? 'on the inside, your seal' : 'on your key';
    const action = kind === 'shard' ? 'Offer this card' : kind === 'seal' ? 'Break this seal' : 'Use my key';
    const submit = async (value) => {
        if (busy)
            return false;
        setBusy(true);
        try {
            const problem = await onCard(value);
            setError(problem ?? '');
            if (!problem)
                setText('');
            return !problem;
        }
        finally {
            setBusy(false);
        }
    };
    const words = splitWords(text);
    const unknown = words.filter((w) => !isKnownWord(w));
    const last = text.endsWith(' ') ? '' : (words[words.length - 1] ?? '');
    const hints = last && !isKnownWord(last) ? suggest(last, 4) : [];
    return (_jsxs("div", { className: "card-input", children: [_jsx("div", { className: "tabs", role: "tablist", "aria-label": "How to offer the card", children: [
                    ['words', 'Type the words', 'Words'],
                    ['camera', 'Scan the code', 'Scan'],
                    ['photo', 'Use a photo', 'Photo'],
                ].map(([m, label, short]) => (_jsxs("button", { role: "tab", "aria-selected": mode === m, className: `tab${mode === m ? ' on' : ''}`, onClick: () => setMode(m), children: [_jsx("span", { className: "tab-long", children: label }), _jsx("span", { className: "tab-short", "aria-hidden": "true", children: short })] }, m))) }), mode === 'words' && (_jsxs("form", { className: "words-form", onSubmit: (e) => {
                    e.preventDefault();
                    void submit(text);
                }, children: [_jsxs("label", { className: "field", children: [_jsxs("span", { children: ["The ", expected, " words ", where] }), _jsx("textarea", { className: "mono-input", rows: 4, value: text, spellCheck: false, autoCapitalize: "off", autoCorrect: "off", onChange: (e) => setText(e.target.value), placeholder: "first second third \u2026", disabled: disabled })] }), _jsxs("div", { className: "spread words-meta", children: [_jsxs("span", { className: words.length === expected ? 'ok' : 'faint', "aria-live": "polite", children: [wrongHalf(kind, words.length) ?? `${words.length} of ${expected} words`, unknown.length > 0 && _jsxs("span", { className: "error", children: [" \u00B7 not on the list: ", unknown.slice(0, 3).join(', ')] })] }), hints.length > 0 && (_jsx("span", { className: "hints", children: hints.map((h) => (_jsx("button", { type: "button", className: "hint-chip", onClick: () => setText(text.replace(/\S+$/, h) + ' '), children: h }, h))) }))] }), _jsx("button", { className: "btn primary", type: "submit", disabled: disabled || busy || words.length !== expected, children: action })] })), mode === 'camera' && _jsx(CameraScanner, { onCode: submit, disabled: disabled }), mode === 'photo' && _jsx(PhotoReader, { onCode: submit, disabled: disabled, onError: setError }), error && (_jsx("p", { className: "error", role: "alert", children: error }))] }));
}
function CameraScanner({ onCode, disabled }) {
    const video = useRef(null);
    const [state, setState] = useState('idle');
    const stream = useRef(null);
    // The scan loop reads the latest callback without restarting the camera.
    const latest = useRef({ onCode, disabled });
    useEffect(() => {
        latest.current = { onCode, disabled };
    }, [onCode, disabled]);
    const stop = () => {
        stream.current?.getTracks().forEach((t) => t.stop());
        stream.current = null;
        setState('idle');
    };
    useEffect(() => stop, []);
    useEffect(() => {
        if (state !== 'live')
            return;
        const detector = nativeDetector();
        const canvas = document.createElement('canvas');
        let cancelled = false;
        let pausedUntil = 0;
        let timer = 0;
        const tick = async () => {
            if (cancelled)
                return;
            const v = video.current;
            if (v && v.readyState >= 2 && Date.now() > pausedUntil && !latest.current.disabled) {
                let found = null;
                if (detector) {
                    try {
                        found = (await detector.detect(v))[0]?.rawValue ?? null;
                    }
                    catch {
                        found = null;
                    }
                }
                if (!found) {
                    const scale = Math.min(1, 720 / Math.max(v.videoWidth, 1));
                    canvas.width = Math.round(v.videoWidth * scale);
                    canvas.height = Math.round(v.videoHeight * scale);
                    canvas.getContext('2d', { willReadFrequently: true })?.drawImage(v, 0, 0, canvas.width, canvas.height);
                    found = decodeCanvas(canvas);
                }
                if (found) {
                    pausedUntil = Date.now() + 1800;
                    await latest.current.onCode(found);
                }
            }
            timer = window.setTimeout(tick, 180);
        };
        void tick();
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [state]);
    const start = async () => {
        setState('starting');
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            stream.current = s;
            if (video.current) {
                video.current.srcObject = s;
                await video.current.play();
            }
            setState('live');
        }
        catch {
            setState('denied');
        }
    };
    return (_jsxs("div", { className: "camera", children: [_jsxs("div", { className: `viewfinder${state === 'live' ? ' live' : ''}`, children: [_jsx("video", { ref: video, playsInline: true, muted: true, "aria-label": "Camera view" }), state !== 'live' && (_jsx("div", { className: "viewfinder-idle", children: state === 'denied' ? (_jsx("p", { children: "The camera could not be opened. You can type the words instead." })) : (_jsx("button", { className: "btn", onClick: start, disabled: state === 'starting', children: state === 'starting' ? 'Opening the camera…' : 'Open the camera' })) })), _jsx("span", { className: "corner a" }), _jsx("span", { className: "corner b" }), _jsx("span", { className: "corner c" }), _jsx("span", { className: "corner d" })] }), state === 'live' && (_jsxs("div", { className: "spread", children: [_jsx("p", { className: "faint", children: "Hold the code on the card inside the frame. Each card is read once." }), _jsx("button", { className: "btn small quiet", onClick: stop, children: "Close the camera" })] }))] }));
}
function PhotoReader({ onCode, disabled, onError }) {
    const [reading, setReading] = useState(false);
    const read = async (file) => {
        setReading(true);
        try {
            const bitmap = await createImageBitmap(file);
            const canvas = document.createElement('canvas');
            let found = null;
            for (const max of [1400, 900, 2200]) {
                const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
                canvas.width = Math.round(bitmap.width * scale);
                canvas.height = Math.round(bitmap.height * scale);
                canvas.getContext('2d', { willReadFrequently: true })?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                found = decodeCanvas(canvas);
                if (found)
                    break;
            }
            if (found)
                await onCode(found);
            else
                onError('No code could be found in that photo. Try a closer, sharper picture, or type the words.');
        }
        catch {
            onError('That file could not be read as an image.');
        }
        finally {
            setReading(false);
        }
    };
    return (_jsxs("label", { className: `dropzone${disabled ? ' disabled' : ''}`, children: [_jsx("input", { type: "file", accept: "image/*", disabled: disabled || reading, onChange: (e) => {
                    const f = e.target.files?.[0];
                    if (f)
                        void read(f);
                    e.target.value = '';
                } }), _jsx("span", { className: "dropzone-text", children: reading ? 'Reading the card…' : 'Choose a photo of the card' }), _jsx("span", { className: "faint", children: "The photo is read here, on this device, and not kept." })] }));
}
