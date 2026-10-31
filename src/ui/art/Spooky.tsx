import { useId, type CSSProperties } from 'react';

// Halloween bits and pieces, drawn like the cast: soft vinyl, gradients
// only. Each one is decoration, so each one is hidden from screen readers.

function useIds(prefix: string) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  return { id: (n: string) => `${prefix}${u}${n}`, url: (n: string) => `url(#${prefix}${u}${n})` };
}

/** A jack-o'-lantern with a cute carved face. Lit, the face glows and flickers. */
export function Pumpkin({ size = 80, lit = true, wink = false, phase = 0 }: { size?: number; lit?: boolean; wink?: boolean; phase?: number }) {
  const { id, url } = useIds('pk');
  return (
    <svg className={`pumpkin${lit ? ' lit' : ''}`} viewBox="0 0 100 92" width={size} height={(size * 92) / 100} aria-hidden="true" style={{ '--phase': `${-phase}s` } as CSSProperties}>
      <defs>
        <radialGradient id={id('skin')} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffc27a" />
          <stop offset="0.5" stopColor="#ff8f3d" />
          <stop offset="1" stopColor="#d4581a" />
        </radialGradient>
        <radialGradient id={id('mid')} cx="45%" cy="28%" r="80%">
          <stop offset="0" stopColor="#ffcf8c" />
          <stop offset="0.55" stopColor="#ff9b48" />
          <stop offset="1" stopColor="#e0661f" />
        </radialGradient>
        <radialGradient id={id('fire')} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#fff4b8" />
          <stop offset="0.5" stopColor="#ffd25a" />
          <stop offset="1" stopColor="#ff9a2e" />
        </radialGradient>
        <radialGradient id={id('glow')}>
          <stop offset="0" stopColor="#ffb547" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('stem')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fbf5a" />
          <stop offset="1" stopColor="#4f7f2e" />
        </linearGradient>
      </defs>
      {lit && <circle className="pumpkin-glow" cx="50" cy="56" r="50" fill={url('glow')} />}
      <ellipse cx="50" cy="88" rx="38" ry="4" fill="#2a1650" opacity="0.2" />
      <ellipse cx="29" cy="57" rx="23" ry="28" fill={url('skin')} />
      <ellipse cx="71" cy="57" rx="23" ry="28" fill={url('skin')} />
      <ellipse cx="50" cy="56" rx="25" ry="31" fill={url('mid')} />
      <path d="M38 30 C33 44 33 70 38 84 M62 30 C67 44 67 70 62 84" fill="none" stroke="#c4551a" strokeOpacity="0.45" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M40 34 C38 40 37 46 37 52" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
      <path d="M49 27 C48 18 51 11 58 8" fill="none" stroke={url('stem')} strokeWidth="7" strokeLinecap="round" />
      <path d="M57 13 C64 8 72 10 74 15 C68 19 61 18 57 13 Z" fill="#7fc25a" />
      <g className="pumpkin-face" fill={lit ? url('fire') : '#5a2a10'}>
        {wink ? (
          <path d="M31 50 Q37 44 43 50" fill="none" stroke={lit ? '#ffd25a' : '#5a2a10'} strokeWidth="3.6" strokeLinecap="round" />
        ) : (
          <path d="M37 42 L44 53 L30 53 Z" strokeLinejoin="round" stroke={lit ? '#ffd25a' : '#5a2a10'} strokeWidth="2" />
        )}
        <path d="M63 42 L70 53 L56 53 Z" strokeLinejoin="round" stroke={lit ? '#ffd25a' : '#5a2a10'} strokeWidth="2" />
        <path d="M33 62 C40 74 60 74 67 62 C61 65 57 66 54 66 L54 70 L48 70 L48 66 C44 66 39 65 33 62 Z" />
      </g>
    </svg>
  );
}

/** A small round bat. Its wings flap; give it `flap={false}` to keep still. */
export function Bat({ size = 60, flap = true }: { size?: number; flap?: boolean }) {
  const { id, url } = useIds('bt');
  return (
    <svg className={`bat${flap ? ' flap' : ''}`} viewBox="0 0 100 64" width={size} height={(size * 64) / 100} aria-hidden="true">
      <defs>
        <radialGradient id={id('fur')} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#7d63a8" />
          <stop offset="0.6" stopColor="#4a3470" />
          <stop offset="1" stopColor="#2c1d48" />
        </radialGradient>
        <radialGradient id={id('wing')} cx="50%" cy="20%" r="90%">
          <stop offset="0" stopColor="#6b4b9e" />
          <stop offset="1" stopColor="#321f55" />
        </radialGradient>
      </defs>
      <path className="bat-wing left" d="M40 30 C30 16 14 14 2 22 C8 24 10 30 8 36 C14 33 19 36 20 42 C25 37 31 38 34 42 C35 37 37 33 40 30 Z" fill={url('wing')} />
      <path className="bat-wing right" d="M60 30 C70 16 86 14 98 22 C92 24 90 30 92 36 C86 33 81 36 80 42 C75 37 69 38 66 42 C65 37 63 33 60 30 Z" fill={url('wing')} />
      <path d="M38 22 L36 8 L45 17 Z M62 22 L64 8 L55 17 Z" fill={url('fur')} />
      <ellipse cx="50" cy="32" rx="16" ry="15" fill={url('fur')} />
      <ellipse cx="44" cy="30" rx="3.2" ry="3.8" fill="#fff" />
      <ellipse cx="56" cy="30" rx="3.2" ry="3.8" fill="#fff" />
      <circle cx="44.6" cy="30.6" r="1.8" fill="#1b1028" />
      <circle cx="56.6" cy="30.6" r="1.8" fill="#1b1028" />
      <path d="M46.5 37.5 L47.5 40.5 L48.5 37.5 M51.5 37.5 L52.5 40.5 L53.5 37.5" fill="#fff" stroke="#fff" strokeWidth="0.8" strokeLinejoin="round" />
      <ellipse cx="40" cy="36" rx="3" ry="1.8" fill="#ff86ab" opacity="0.55" />
      <ellipse cx="60" cy="36" rx="3" ry="1.8" fill="#ff86ab" opacity="0.55" />
    </svg>
  );
}

/** A few bats crossing the sky now and then, high above the page. */
export function FlyingBats({ count = 3 }: { count?: number }) {
  const bats = [
    { top: 12, size: 34, dur: 26, delay: 2 },
    { top: 22, size: 24, dur: 32, delay: 11 },
    { top: 7, size: 20, dur: 38, delay: 19 },
  ].slice(0, count);
  return (
    <div className="flying-bats" aria-hidden="true">
      {bats.map((b, i) => (
        <div key={i} className="flying-bat" style={{ top: `${b.top}%`, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}>
          <div className="flying-bat-bob">
            <Bat size={b.size} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A crescent moon with a soft glow. */
export function Moon({ size = 90 }: { size?: number }) {
  const { id, url } = useIds('mn');
  return (
    <svg className="moon" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <defs>
        <radialGradient id={id('glow')}>
          <stop offset="0.35" stopColor="#ffe9a8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('face')} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fffbe6" />
          <stop offset="0.6" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#f2c867" />
        </radialGradient>
        <mask id={id('cut')}>
          <rect width="100" height="100" fill="#fff" />
          <circle cx="64" cy="40" r="28" fill="#000" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="50" fill={url('glow')} />
      <circle cx="50" cy="50" r="30" fill={url('face')} mask={url('cut')} />
      <circle cx="33" cy="58" r="3" fill="#e8bf5c" opacity="0.5" mask={url('cut')} />
      <circle cx="40" cy="71" r="2" fill="#e8bf5c" opacity="0.5" mask={url('cut')} />
    </svg>
  );
}

/** A spider web for a corner, with a tiny spider bobbing on its thread. */
export function Web({ size = 120, corner = 'top-left', spider = true }: { size?: number; corner?: 'top-left' | 'top-right'; spider?: boolean }) {
  const flip = corner === 'top-right' ? 'scale(-1 1) translate(-120 0)' : undefined;
  const rays = [0, 18, 36, 54, 72, 90].map((deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)] as const);
  // Each ring sags a little towards the corner between two rays.
  const ring = (r: number) =>
    rays
      .map(([x, y], i) => {
        if (i === 0) return `M${(x * r).toFixed(1)} ${(y * r).toFixed(1)}`;
        const [px, py] = rays[i - 1]!;
        const sag = 0.82;
        return `Q${(((x + px) / 2) * r * sag).toFixed(1)} ${(((y + py) / 2) * r * sag).toFixed(1)} ${(x * r).toFixed(1)} ${(y * r).toFixed(1)}`;
      })
      .join(' ');
  return (
    <svg className={`web ${corner}`} viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <g transform={flip} fill="none" stroke="currentColor" strokeLinecap="round">
        {rays.map(([x, y], i) => (
          <path key={i} d={`M0 0 L${(x * 118).toFixed(1)} ${(y * 118).toFixed(1)}`} strokeWidth="1.2" />
        ))}
        {[28, 52, 78, 104].map((r) => (
          <path key={r} d={ring(r)} strokeWidth="1" />
        ))}
        {spider && (
          <g className="web-spider">
            <path d="M74 52 L74 88" strokeWidth="0.9" />
            <g transform="translate(74 92)" stroke="none">
              <path d="M-7 -2 L-12 -6 M-7 1 L-13 1 M-7 4 L-12 8 M7 -2 L12 -6 M7 1 L13 1 M7 4 L12 8" stroke="#3a2a55" strokeWidth="1.4" />
              <circle r="7" fill="#3a2a55" />
              <circle cx="-2.4" cy="-1" r="1.6" fill="#fff" />
              <circle cx="2.4" cy="-1" r="1.6" fill="#fff" />
              <circle cx="-2.2" cy="-0.8" r="0.8" fill="#1b1028" />
              <circle cx="2.6" cy="-0.8" r="0.8" fill="#1b1028" />
            </g>
          </g>
        )}
      </g>
    </svg>
  );
}

/** A little iron lantern with a candle glowing inside. */
export function Lantern({ size = 60, phase = 0 }: { size?: number; phase?: number }) {
  const { id, url } = useIds('ln');
  return (
    <svg className="lantern" viewBox="0 0 60 96" width={size} height={(size * 96) / 60} aria-hidden="true" style={{ '--phase': `${-phase}s` } as CSSProperties}>
      <defs>
        <radialGradient id={id('glow')}>
          <stop offset="0" stopColor="#ffcf6b" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffcf6b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('iron')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5a4a72" />
          <stop offset="0.5" stopColor="#3b2f4f" />
          <stop offset="1" stopColor="#241b33" />
        </linearGradient>
        <radialGradient id={id('light')} cx="50%" cy="60%" r="60%">
          <stop offset="0" stopColor="#fff2b8" />
          <stop offset="0.6" stopColor="#ffc457" />
          <stop offset="1" stopColor="#e88a2a" />
        </radialGradient>
      </defs>
      <circle className="lantern-glow" cx="30" cy="58" r="30" fill={url('glow')} />
      <circle cx="30" cy="8" r="6" fill="none" stroke={url('iron')} strokeWidth="3" />
      <path d="M14 26 L30 13 L46 26 Z" fill={url('iron')} />
      <rect x="15" y="26" width="30" height="48" rx="4" fill={url('light')} />
      <path d="M15 34 L45 34 M15 66 L45 66 M30 26 L30 74" stroke={url('iron')} strokeWidth="2.4" />
      <rect x="12" y="24" width="36" height="5" rx="2.5" fill={url('iron')} />
      <rect x="11" y="72" width="38" height="7" rx="3" fill={url('iron')} />
      <path d="M22 40 C22 36 24 34 26 33" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** A wrapped candy, for scattering. */
export function Candy({ size = 34, hue = 'pink' }: { size?: number; hue?: 'pink' | 'mint' | 'sun' }) {
  const fill = { pink: '#ff8fb8', mint: '#7be0b5', sun: '#ffc75a' }[hue];
  return (
    <svg className="candy" viewBox="0 0 60 30" width={size} height={size / 2} aria-hidden="true">
      <path d="M14 15 L2 5 L4 15 L2 25 Z M46 15 L58 5 L56 15 L58 25 Z" fill={fill} opacity="0.8" />
      <ellipse cx="30" cy="15" rx="17" ry="12" fill={fill} />
      <path d="M20 8 C26 12 30 18 32 26 M30 4 C34 10 38 16 40 24" stroke="#fff" strokeOpacity="0.55" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="24" cy="9" rx="5" ry="2.5" fill="#fff" opacity="0.5" />
    </svg>
  );
}
