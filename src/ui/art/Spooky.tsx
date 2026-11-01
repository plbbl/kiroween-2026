import { useId, type CSSProperties } from 'react';

// The Halloween around the cast: the moon, bats, jack-o'-lanterns, cobwebs,
// a spider, and the hill with the old house. Drawn in the same soft style,
// gradients on plain shapes, so a page can hold many.

const INK = '#261d3a';

function useIds() {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `s${u}${name}`;
  return { id, url: (name: string) => `url(#${id(name)})` };
}

/** A jack-o'-lantern. Lit, its carved face glows; unlit, it is a plain pumpkin waiting. */
export function Pumpkin({
  size = 48,
  lit = false,
  face = true,
  line = false,
  className = '',
  style,
  title,
}: {
  size?: number;
  lit?: boolean;
  face?: boolean;
  line?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  const { id, url } = useIds();
  const carved = lit ? url('flame') : '#7a3410';
  return (
    <svg
      className={`pumpkin${lit ? ' lit' : ''} ${className}`}
      viewBox="0 0 64 60"
      width={size}
      height={(size * 60) / 64}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <radialGradient id={id('skin')} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffc27a" />
          <stop offset="0.5" stopColor="#ff8a2a" />
          <stop offset="1" stopColor="#d4560f" />
        </radialGradient>
        <radialGradient id={id('rib')} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ff9c45" />
          <stop offset="1" stopColor="#c24b0c" />
        </radialGradient>
        <radialGradient id={id('flame')} cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor="#fff6c2" />
          <stop offset="0.5" stopColor="#ffd25e" />
          <stop offset="1" stopColor="#ff9a1f" />
        </radialGradient>
        <radialGradient id={id('glow')}>
          <stop offset="0" stopColor="#ffb547" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
        </radialGradient>
      </defs>
      {lit && !line && <ellipse className="pumpkin-glow" cx="32" cy="36" rx="34" ry="28" fill={url('glow')} />}
      {/* Stem and a curl of vine. */}
      <path d="M31 14 C30 8 32 4 37 2" fill="none" stroke={line ? INK : '#6b4a2b'} strokeWidth={line ? 2 : 5} strokeLinecap="round" />
      {!line && <path d="M36 9 C42 4 49 6 49 11 C45 13 40 13 36 9 Z" fill="#57a83f" />}
      {/* Ribs: two behind, one in front. */}
      <ellipse cx="19" cy="36" rx="15" ry="19" fill={line ? '#fff' : url('rib')} stroke={line ? INK : 'none'} strokeWidth="2" />
      <ellipse cx="45" cy="36" rx="15" ry="19" fill={line ? '#fff' : url('rib')} stroke={line ? INK : 'none'} strokeWidth="2" />
      <ellipse cx="32" cy="36" rx="16" ry="21" fill={line ? '#fff' : url('skin')} stroke={line ? INK : 'none'} strokeWidth="2" />
      {!line && <ellipse cx="25" cy="25" rx="5" ry="3" transform="rotate(-30 25 25)" fill="#fff" opacity="0.45" />}
      {face && (
        <g fill={line ? INK : carved}>
          <path d="M19 31 L25 25 L28 33 Z" />
          <path d="M45 31 L39 25 L36 33 Z" />
          <path d="M32 35 L29.5 39 L34.5 39 Z" />
          <path d="M18 42 C24 49 40 49 46 42 L42 43 L40 46 L37 43.5 L34 47 L31 44 L28 47 L25 43.5 L22 46 Z" />
        </g>
      )}
    </svg>
  );
}

/** A small bat. With `flap`, its wings beat. */
export function Bat({ size = 40, color = '#2a1846', flap = true, className = '', style }: { size?: number; color?: string; flap?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <svg className={`bat${flap ? ' flap' : ''} ${className}`} viewBox="0 0 64 32" width={size} height={size / 2} style={style} aria-hidden="true">
      <g fill={color}>
        <path className="bat-wing left" d="M28 14 C22 6 12 4 2 8 C6 10 7 14 5 18 C10 16 13 18 13 22 C17 19 21 20 23 23 C24 19 26 16 28 14 Z" />
        <path className="bat-wing right" d="M36 14 C42 6 52 4 62 8 C58 10 57 14 59 18 C54 16 51 18 51 22 C47 19 43 20 41 23 C40 19 38 16 36 14 Z" />
        <ellipse cx="32" cy="16" rx="6.5" ry="8" />
        <path d="M27.5 10 L28 3.5 L30.6 8.4 Z M36.5 10 L36 3.5 L33.4 8.4 Z" />
      </g>
      <circle cx="29.6" cy="13" r="1.3" fill="#ffd25e" />
      <circle cx="34.4" cy="13" r="1.3" fill="#ffd25e" />
    </svg>
  );
}

/** A full moon with soft craters and a halo. */
export function Moon({ size = 160, cloud = false, className = '', style }: { size?: number; cloud?: boolean; className?: string; style?: CSSProperties }) {
  const { id, url } = useIds();
  return (
    <svg className={`moon ${className}`} viewBox="0 0 200 200" width={size} height={size} style={style} aria-hidden="true">
      <defs>
        <radialGradient id={id('halo')}>
          <stop offset="0.35" stopColor="#fff2c4" stopOpacity="0.5" />
          <stop offset="0.6" stopColor="#ffd98a" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('face')} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fffdf4" />
          <stop offset="0.6" stopColor="#fff4d6" />
          <stop offset="1" stopColor="#efdcab" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill={url('halo')} />
      <circle cx="100" cy="100" r="46" fill={url('face')} />
      <g fill="#e2cf9f" opacity="0.5">
        <ellipse cx="84" cy="88" rx="10" ry="8" />
        <ellipse cx="116" cy="110" rx="7" ry="6" />
        <ellipse cx="96" cy="122" rx="5" ry="4" />
        <ellipse cx="118" cy="82" rx="4" ry="3.5" />
      </g>
      {cloud && (
        <path
          className="moon-cloud"
          d="M40 128 C42 120 52 118 58 122 C62 113 76 112 82 120 C88 116 98 118 100 126 C110 124 118 130 116 136 L42 136 C36 136 34 130 40 128 Z"
          fill="#d9c8ff"
          opacity="0.55"
        />
      )}
    </svg>
  );
}

/** A cobweb hung in a corner; `corner` says which. */
export function Cobweb({
  size = 120,
  corner = 'top-left',
  color = 'currentColor',
  className = '',
  style,
}: {
  size?: number;
  corner?: 'top-left' | 'top-right';
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  // Threads fan out from the corner; rings sag between them.
  const angles = [0, 18, 36, 54, 72, 90];
  const point = (deg: number, r: number) => [Math.cos((deg * Math.PI) / 180) * r, Math.sin((deg * Math.PI) / 180) * r] as const;
  const rings = [26, 46, 66, 86];
  const ring = (r: number) =>
    angles
      .slice(0, -1)
      .map((a, i) => {
        const [x1, y1] = point(a, r);
        const [x2, y2] = point(angles[i + 1]!, r);
        const [mx, my] = point((a + angles[i + 1]!) / 2, r * 0.82);
        return `${i === 0 ? `M${x1} ${y1}` : ''} Q${mx} ${my} ${x2} ${y2}`;
      })
      .join(' ');
  return (
    <svg
      className={`cobweb ${className}`}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ ...style, transform: corner === 'top-right' ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      <g fill="none" stroke={color} strokeWidth="0.9" strokeLinecap="round">
        {angles.map((a) => {
          const [x, y] = point(a, 100);
          return <path key={a} d={`M0 0 L${x} ${y}`} />;
        })}
        {rings.map((r) => (
          <path key={r} d={ring(r)} />
        ))}
      </g>
    </svg>
  );
}

/** A little spider hanging on its thread. */
export function Spider({ size = 34, className = '', style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg className={`spider ${className}`} viewBox="0 0 40 40" width={size} height={size} style={style} aria-hidden="true">
      <g fill="none" stroke="#2a1846" strokeWidth="2" strokeLinecap="round">
        <path d="M14 18 C8 14 5 15 3 19 M14 21 C8 20 5 23 4 27 M15 24 C10 25 8 29 9 33 M26 18 C32 14 35 15 37 19 M26 21 C32 20 35 23 36 27 M25 24 C30 25 32 29 31 33" />
      </g>
      <ellipse cx="20" cy="22" rx="7.5" ry="8.5" fill="#2a1846" />
      <circle cx="20" cy="13.5" r="5" fill="#2a1846" />
      <circle cx="18" cy="13" r="1.6" fill="#fff" />
      <circle cx="22" cy="13" r="1.6" fill="#fff" />
      <circle cx="18.3" cy="13.3" r="0.8" fill="#2a1846" />
      <circle cx="22.3" cy="13.3" r="0.8" fill="#2a1846" />
    </svg>
  );
}

/**
 * The hill at the bottom of the world: an old house with a crooked tower,
 * a bare tree, a fence, a few stones and pumpkins. One silhouette colour;
 * at night the windows and the pumpkins glow.
 */
export function Skyline({ night, className = '' }: { night: boolean; className?: string }) {
  const fill = night ? '#0f0820' : 'rgba(122, 64, 214, 0.17)';
  const glow = night ? '#ffc65a' : 'rgba(122, 64, 214, 0.06)';
  return (
    <svg className={`skyline ${className}`} viewBox="0 0 1440 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g fill={fill}>
        {/* Rolling hills. */}
        <path d="M0 160 C160 120 300 128 430 150 C560 172 640 118 780 112 C930 106 1010 152 1130 150 C1250 148 1340 120 1440 128 L1440 220 L0 220 Z" />
        {/* The old house, with a crooked tower. */}
        <path d="M200 140 L200 92 L186 92 L222 58 L258 92 L246 92 L246 140 Z" />
        <path d="M232 96 L232 44 L226 44 L240 14 L254 44 L250 44 L250 110 Z" />
        <path d="M168 140 L168 104 L160 104 L182 84 L204 104 L196 104 L196 140 Z" />
        {/* A bare tree. */}
        <path d="M1182 152 C1186 120 1184 100 1176 82 C1166 74 1152 72 1140 62 C1154 66 1166 66 1174 72 C1172 60 1164 50 1152 44 C1166 46 1176 56 1180 70 C1184 56 1190 44 1202 36 C1194 50 1190 64 1190 80 C1198 70 1210 66 1222 66 C1210 72 1198 80 1194 94 C1192 112 1194 132 1198 152 Z" />
        {/* Fence. */}
        {[880, 900, 920, 940, 960, 980].map((x) => (
          <path key={x} d={`M${x} 140 L${x} 116 L${x + 4} 110 L${x + 8} 116 L${x + 8} 140 Z`} />
        ))}
        <rect x="876" y="120" width="116" height="4" />
        <rect x="876" y="132" width="116" height="4" />
        {/* Stones. */}
        <path d="M560 160 L560 138 C560 128 580 128 580 138 L580 160 Z" />
        <path d="M600 162 L600 146 C600 138 614 138 614 146 L614 162 Z" />
        <path d="M1290 150 L1290 128 C1290 118 1310 118 1310 128 L1310 150 Z" />
        {/* Pumpkins on the hill. */}
        <ellipse cx="690" cy="150" rx="13" ry="10" />
        <ellipse cx="716" cy="154" rx="9" ry="7" />
        <ellipse cx="420" cy="152" rx="11" ry="8.5" />
      </g>
      {/* Lit windows and carved faces. */}
      <g fill={glow}>
        <rect x="214" y="104" width="7" height="10" rx="1" />
        <rect x="226" y="104" width="7" height="10" rx="1" />
        <rect x="238" y="60" width="5" height="8" rx="1" />
        <rect x="176" y="112" width="6" height="9" rx="1" />
        <path d="M684 148 L687 145 L688 149 Z M696 148 L693 145 L692 149 Z M684 153 C688 156 692 156 696 153 Z" />
        <path d="M712 152 L714 150 L715 153 Z M720 152 L718 150 L717 153 Z" />
        <path d="M415 150 L418 147 L419 151 Z M425 150 L422 147 L421 151 Z" />
      </g>
    </svg>
  );
}

/**
 * The world behind every page: by day a lilac afternoon with cobwebs in the
 * corners, a spider on its thread and the hill far away; at night the moon,
 * fog over the hill, lit windows. Bats cross now and then. The night set
 * falls in from the top with the night itself.
 */
export function Scenery() {
  return (
    <div className="scenery no-print" aria-hidden="true">
      <div className="scenery-set day-set">
        <Cobweb className="scenery-web left" size={150} color="rgba(122, 64, 214, 0.2)" />
        <Cobweb className="scenery-web right" corner="top-right" size={120} color="rgba(122, 64, 214, 0.16)" />
        <div className="scenery-spider">
          <Spider size={26} />
        </div>
      </div>
      <div className="scenery-set night-set nightfall">
        <Moon size={190} className="scenery-moon" />
        <Cobweb className="scenery-web left" size={150} color="rgba(205, 184, 255, 0.18)" />
        <Cobweb className="scenery-web right" corner="top-right" size={120} color="rgba(205, 184, 255, 0.14)" />
        <div className="scenery-bats">
          <Bat size={64} color="#0b0714" className="flyer f1" />
          <Bat size={46} color="#0b0714" className="flyer f2" />
          <Bat size={54} color="#0b0714" className="flyer f3" />
        </div>
      </div>
    </div>
  );
}

/**
 * The bottom of every page: the hill with the old house, where the page ends,
 * so it never sits under the words. Fog and lit windows at night.
 */
export function HillScene() {
  return (
    <div className="hill-scene no-print" aria-hidden="true">
      <Skyline night={false} className="hill day-hill" />
      <div className="hill night-hill nightfall">
        <Skyline night />
        <div className="scenery-fog" />
      </div>
    </div>
  );
}

/** A little lantern with a candle inside: what the watch ghost carries. */
export function Lantern({ size = 44, lit = true, className = '', style }: { size?: number; lit?: boolean; className?: string; style?: CSSProperties }) {
  const { id, url } = useIds();
  return (
    <svg className={`lantern${lit ? ' lit' : ''} ${className}`} viewBox="0 0 40 60" width={size} height={size * 1.5} style={style} aria-hidden="true">
      <defs>
        <radialGradient id={id('light')} cx="50%" cy="55%" r="60%">
          <stop offset="0" stopColor="#fff3c0" />
          <stop offset="0.5" stopColor="#ffd25e" stopOpacity={lit ? 1 : 0.3} />
          <stop offset="1" stopColor="#ff9a1f" stopOpacity={lit ? 0.9 : 0.2} />
        </radialGradient>
        <radialGradient id={id('halo')}>
          <stop offset="0" stopColor="#ffc65a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffc65a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {lit && <circle className="lantern-halo" cx="20" cy="36" r="20" fill={url('halo')} />}
      <path d="M14 10 C14 4 26 4 26 10" fill="none" stroke="#3a2366" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11 12 L29 12 L27 16 L13 16 Z" fill="#3a2366" />
      <path d="M13 16 L27 16 L29 48 L11 48 Z" fill={url('light')} stroke="#3a2366" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 16 L20 48" stroke="#3a2366" strokeWidth="1.4" opacity="0.5" />
      {lit && <path className="lantern-flame" d="M20 26 C23 30 23 35 20 37 C17 35 17 30 20 26 Z" fill="#fff" opacity="0.9" />}
      <path d="M9 48 L31 48 L29 53 L11 53 Z" fill="#3a2366" />
    </svg>
  );
}
