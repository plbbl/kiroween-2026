import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';
import { KEY_WORDS, SEAL_WORDS, SHARD_WORDS } from '../../core/cards.ts';
import { isKnownWord, splitWords, suggest } from '../../core/words.ts';

type Mode = 'words' | 'camera' | 'photo';

interface CardInputProps {
  kind: 'shard' | 'seal' | 'key';
  /** Returns an error message, or null when the card was accepted. */
  onCard: (text: string) => string | null | Promise<string | null>;
  disabled?: boolean;
}

interface Detector {
  detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}

function nativeDetector(): Detector | null {
  const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
  try {
    return BD ? new BD({ formats: ['qr_code'] }) : null;
  } catch {
    return null;
  }
}

function decodeCanvas(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}

/** A friend who typed the other half of their card, or the owner's key, is told so. */
function wrongHalf(kind: CardInputProps['kind'], count: number): string | null {
  if (kind === 'shard' && count === SEAL_WORDS) return 'That looks like your private seal, the smaller half. Use the 30 words on the card itself.';
  if (kind === 'seal' && count === SHARD_WORDS) return 'That looks like the card itself. Use the 17 words on your private seal, the smaller half.';
  if (kind === 'shard' && count === KEY_WORDS) return 'That looks like the owner’s own key, not a card. The key opens the jar on its own: choose Seal, then “Change what’s inside”.';
  if (kind === 'seal' && count === KEY_WORDS) return 'That looks like the owner’s own key. A letter needs its reader’s private seal.';
  return null;
}

export function CardInput({ kind, onCard, disabled = false }: CardInputProps) {
  const [mode, setMode] = useState<Mode>('words');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const expected = kind === 'shard' ? SHARD_WORDS : kind === 'seal' ? SEAL_WORDS : KEY_WORDS;
  const where = kind === 'shard' ? 'on your card' : kind === 'seal' ? 'on your private seal' : 'on your key';
  const action = kind === 'shard' ? 'Use this card' : kind === 'seal' ? 'Open my letter' : 'Use my key';

  const submit = async (value: string) => {
    if (busy) return false;
    setBusy(true);
    try {
      const problem = await onCard(value);
      setError(problem ?? '');
      if (!problem) setText('');
      return !problem;
    } finally {
      setBusy(false);
    }
  };

  const words = splitWords(text);
  const unknown = words.filter((w) => !isKnownWord(w));
  const last = text.endsWith(' ') ? '' : (words[words.length - 1] ?? '');
  const hints = last && !isKnownWord(last) ? suggest(last, 4) : [];

  return (
    <div className="card-input">
      <div className="tabs" role="tablist" aria-label="How to offer the card">
        {(
          [
            ['words', 'Type the words', 'Words'],
            ['camera', 'Scan the code', 'Scan'],
            ['photo', 'Use a photo', 'Photo'],
          ] as const
        ).map(([m, label, short]) => (
          <button key={m} role="tab" aria-selected={mode === m} className={`tab${mode === m ? ' on' : ''}`} onClick={() => setMode(m)}>
            <span className="tab-long">{label}</span>
            <span className="tab-short" aria-hidden="true">
              {short}
            </span>
          </button>
        ))}
      </div>

      {mode === 'words' && (
        <form
          className="words-form"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(text);
          }}
        >
          <label className="field">
            <span>
              The {expected} words {where}
            </span>
            <textarea
              className="mono-input"
              rows={4}
              value={text}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              onChange={(e) => setText(e.target.value)}
              placeholder="first second third …"
              disabled={disabled}
            />
          </label>
          <div className="spread words-meta">
            <span className={words.length === expected ? 'ok' : 'faint'} aria-live="polite">
              {wrongHalf(kind, words.length) ?? `${words.length} of ${expected} words`}
              {unknown.length > 0 && <span className="error"> · not on the list: {unknown.slice(0, 3).join(', ')}</span>}
            </span>
            {hints.length > 0 && (
              <span className="hints">
                {hints.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className="hint-chip"
                    onClick={() => setText(text.replace(/\S+$/, h) + ' ')}
                  >
                    {h}
                  </button>
                ))}
              </span>
            )}
          </div>
          <button className="btn primary" type="submit" disabled={disabled || busy || words.length !== expected}>
            {action}
          </button>
        </form>
      )}

      {mode === 'camera' && <CameraScanner onCode={submit} disabled={disabled} />}
      {mode === 'photo' && <PhotoReader onCode={submit} disabled={disabled} onError={setError} />}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function CameraScanner({ onCode, disabled }: { onCode: (text: string) => Promise<boolean>; disabled: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<'idle' | 'starting' | 'live' | 'denied'>('idle');
  const stream = useRef<MediaStream | null>(null);
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
    if (state !== 'live') return;
    const detector = nativeDetector();
    const canvas = document.createElement('canvas');
    let cancelled = false;
    let pausedUntil = 0;
    let timer = 0;

    const tick = async () => {
      if (cancelled) return;
      const v = video.current;
      if (v && v.readyState >= 2 && Date.now() > pausedUntil && !latest.current.disabled) {
        let found: string | null = null;
        if (detector) {
          try {
            found = (await detector.detect(v))[0]?.rawValue ?? null;
          } catch {
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
    } catch {
      setState('denied');
    }
  };

  return (
    <div className="camera">
      <div className={`viewfinder${state === 'live' ? ' live' : ''}`}>
        <video ref={video} playsInline muted aria-label="Camera view" />
        {state !== 'live' && (
          <div className="viewfinder-idle">
            {state === 'denied' ? (
              <p>The camera could not be opened. You can type the words instead.</p>
            ) : (
              <button className="btn" onClick={start} disabled={state === 'starting'}>
                {state === 'starting' ? 'Opening the camera…' : 'Open the camera'}
              </button>
            )}
          </div>
        )}
        <span className="corner a" />
        <span className="corner b" />
        <span className="corner c" />
        <span className="corner d" />
      </div>
      {state === 'live' && (
        <div className="spread">
          <p className="faint">Hold the code on the card inside the frame. Each card is read once.</p>
          <button className="btn small quiet" onClick={stop}>
            Close the camera
          </button>
        </div>
      )}
    </div>
  );
}

function PhotoReader({ onCode, disabled, onError }: { onCode: (text: string) => Promise<boolean>; disabled: boolean; onError: (e: string) => void }) {
  const [reading, setReading] = useState(false);

  const read = async (file: File) => {
    setReading(true);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      let found: string | null = null;
      for (const max of [1400, 900, 2200]) {
        const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext('2d', { willReadFrequently: true })?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        found = decodeCanvas(canvas);
        if (found) break;
      }
      if (found) await onCode(found);
      else onError('No code could be found in that photo. Try a closer, sharper picture, or type the words.');
    } catch {
      onError('That file could not be read as an image.');
    } finally {
      setReading(false);
    }
  };

  return (
    <label className={`dropzone${disabled ? ' disabled' : ''}`}>
      <input
        type="file"
        accept="image/*"
        disabled={disabled || reading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void read(f);
          e.target.value = '';
        }}
      />
      <span className="dropzone-text">{reading ? 'Reading the card…' : 'Choose a photo of the card'}</span>
      <span className="faint">The photo is read here, on this device, and not kept.</span>
    </label>
  );
}
