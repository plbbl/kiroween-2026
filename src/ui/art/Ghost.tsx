import type { CSSProperties } from 'react';
import type { Costume, Emblem as EmblemName } from '../../core/buddy.ts';
import { Emblem } from './Emblem.tsx';

export type Mood = 'open' | 'happy' | 'sleep' | 'wow' | 'worried' | 'sad' | 'wink';

export interface GhostProps {
  costume?: Costume;
  mood?: Mood;
  emblem?: EmblemName;
  size?: number;
  /** Bob gently up and down. */
  float?: boolean;
  /** Seconds of delay before the first blink and float, so ghosts never move in unison. */
  phase?: number;
  /** Line art for printing: white fills, black ink. */
  line?: boolean;
  tilt?: number;
  shadow?: boolean;
  className?: string;
  title?: string;
}

const INK = '#1a1420';

const BODY =
  'M20 118 C16 92 13 62 22 40 C31 18 50 11 64 12 C83 13 98 26 103 46 C109 70 106 96 102 118 C98 128 89 128 85 120 C80 130 70 131 65 121 C59 131 49 131 44 121 C38 130 25 129 20 118 Z';
const FRANKEN_BODY =
  'M21 118 C17 94 15 66 17 44 C18 27 25 20 40 19 L86 18 C99 18 104 27 105 42 C107 68 105 96 102 118 C98 128 89 128 85 120 C80 130 70 131 65 121 C59 131 49 131 44 121 C38 130 26 129 21 118 Z';

const FILL: Record<Costume, string> = {
  sheet: '#f8f6f2',
  franken: '#c9cd98',
  skeleton: '#231c2c',
  pumpkin: '#ff8f3f',
  witch: '#f8f6f2',
  bat: '#cdb8ff',
  bow: '#ffd0e2',
  mummy: '#f2ece0',
};

// A soft edge in a slightly deeper tone of each body colour.
const EDGE: Record<Costume, string> = {
  sheet: '#e2d8f5',
  franken: '#aeb27c',
  skeleton: '#231c2c',
  pumpkin: '#ec7a2c',
  witch: '#e2d8f5',
  bat: '#b39cf0',
  bow: '#f5b3cd',
  mummy: '#ddd2bf',
};

// Where each costume carries its emblem, clear of ribs, stitches and bandages.
const EMBLEM_AT: Record<Costume, [number, number]> = {
  sheet: [54, 92],
  franken: [38, 92],
  skeleton: [84, 84],
  pumpkin: [54, 92],
  witch: [54, 92],
  bat: [54, 98],
  bow: [54, 92],
  mummy: [54, 101],
};

function Eyes({ mood, dark, line }: { mood: Mood; dark: boolean; line: boolean }) {
  const ink = dark && !line ? '#f8f6f2' : INK;
  const arc = (d: string) => <path d={d} fill="none" stroke={ink} strokeWidth="4.6" strokeLinecap="round" />;
  const oval = (cx: number, ry = 9.5) => (
    <g>
      <ellipse cx={cx} cy={62} rx={6.6} ry={ry} fill={ink} />
      {!line && <circle cx={cx + 2} cy={57.5} r={2} fill={dark ? INK : '#fff'} opacity="0.9" />}
    </g>
  );
  switch (mood) {
    case 'happy':
      return (
        <>
          {arc('M41 64 Q48 54 55 64')}
          {arc('M69 64 Q76 54 83 64')}
        </>
      );
    case 'sleep':
      return (
        <>
          {arc('M41 60 Q48 68 55 60')}
          {arc('M69 60 Q76 68 83 60')}
        </>
      );
    case 'wink':
      return (
        <>
          {oval(48)}
          {arc('M69 64 Q76 54 83 64')}
        </>
      );
    case 'wow':
      return (
        <>
          {oval(48, 11)}
          {oval(76, 11)}
        </>
      );
    default:
      return (
        <>
          {oval(48)}
          {oval(76)}
        </>
      );
  }
}

function Face({ mood, dark, line }: { mood: Mood; dark: boolean; line: boolean }) {
  const ink = dark && !line ? '#f8f6f2' : INK;
  return (
    <>
      <g className="ghost-eyes">
        <Eyes mood={mood} dark={dark} line={line} />
      </g>
      {!line && mood !== 'sleep' && (
        <>
          <ellipse cx="37" cy="77" rx="7" ry="4" fill="#ff8fb8" opacity="0.55" />
          <ellipse cx="87" cy="77" rx="7" ry="4" fill="#ff8fb8" opacity="0.55" />
        </>
      )}
      {mood === 'happy' && <path d="M57 78 Q62 84 67 78" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />}
      {mood === 'wow' && <ellipse cx="62" cy="83" rx="4.5" ry="5.5" fill={ink} />}
      {mood === 'worried' && (
        <>
          <path d="M40 50 L54 45 M84 50 L70 45" stroke={ink} strokeWidth="3.4" strokeLinecap="round" />
          <path d="M58 82 Q62 79 66 82" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          {!line && <path className="ghost-sweat" d="M99 40 C95 47 97 52 101 52 C105 52 106 47 99 40 Z" fill="#8fd3ff" />}
        </>
      )}
      {mood === 'sad' && (
        <>
          <path d="M57 82 Q62 78 67 82" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          {!line && (
            <>
              <path className="ghost-tear" d="M47 73 C44 79 45 83 48 83 C51 83 52 79 47 73 Z" fill="#8fd3ff" />
              <path className="ghost-tear second" d="M77 73 C74 79 75 83 78 83 C81 83 82 79 77 73 Z" fill="#8fd3ff" />
            </>
          )}
        </>
      )}
    </>
  );
}

function Costume({ costume, line }: { costume: Costume; line: boolean }) {
  const stroke = line ? INK : undefined;
  switch (costume) {
    case 'franken':
      return (
        <>
          <path
            d="M17 44 C18 27 25 20 40 19 L86 18 C99 18 104 27 105 42 L97 37 L90 44 L82 36 L74 44 L66 36 L58 44 L50 36 L42 44 L34 36 L26 44 Z"
            fill={line ? '#fff' : '#7f8c4f'}
            stroke={stroke}
            strokeWidth={line ? 2.5 : 0}
            strokeLinejoin="round"
          />
          <path d="M70 92 L92 90 M74 87 L75 95 M81 86 L82 94 M88 86 L89 94" stroke={line ? INK : '#7f8c4f'} strokeWidth="2.6" strokeLinecap="round" />
          <rect x="6" y="74" width="12" height="10" rx="3" fill={line ? '#fff' : '#a7a2b0'} stroke={line ? INK : '#7b7586'} strokeWidth="2.4" />
          <rect x="106" y="74" width="12" height="10" rx="3" fill={line ? '#fff' : '#a7a2b0'} stroke={line ? INK : '#7b7586'} strokeWidth="2.4" />
        </>
      );
    case 'skeleton':
      return (
        <>
          <path
            d="M36 46 C36 33 48 28 62 28 C77 28 89 34 89 47 C89 58 84 61 82 68 C80 76 71 79 62 79 C51 79 44 75 42 68 C40 61 36 57 36 46 Z"
            fill="#f8f6f2"
            stroke={stroke}
            strokeWidth={line ? 2.5 : 0}
          />
          <path d="M62 69 L59 74 L65 74 Z" fill={INK} />
          <g stroke={line ? INK : '#f8f6f2'} strokeWidth="4" strokeLinecap="round" fill="none" opacity={line ? 1 : 0.95}>
            <path d="M62 86 L62 118" />
            <path d="M44 92 Q62 99 80 92" />
            <path d="M46 103 Q62 109 78 103" />
            <path d="M49 113 Q62 118 75 113" />
          </g>
        </>
      );
    case 'pumpkin':
      return (
        <>
          <path d="M42 26 C33 56 33 98 40 124 M84 26 C93 56 93 98 86 124" stroke={line ? INK : '#e06a1f'} strokeWidth="3" fill="none" strokeLinecap="round" opacity={line ? 0.6 : 1} />
          <path d="M60 15 C59 8 63 2 70 2" stroke={line ? INK : '#5f8a36'} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M66 6 C74 -2 86 2 86 2 C82 10 72 12 66 6 Z" fill={line ? '#fff' : '#7fb04a'} stroke={stroke} strokeWidth={line ? 2.2 : 0} />
        </>
      );
    case 'witch':
      return (
        <g transform="rotate(-8 62 20)">
          <ellipse cx="62" cy="22" rx="38" ry="8" fill={line ? '#fff' : '#3b2a55'} stroke={stroke} strokeWidth={line ? 2.5 : 0} />
          <path d="M42 22 C47 6 58 -14 84 -22 C74 -8 76 6 82 22 Z" fill={line ? '#fff' : '#3b2a55'} stroke={stroke} strokeWidth={line ? 2.5 : 0} strokeLinejoin="round" />
          <path d="M45 15 C56 18 70 18 80 15 L81 20 C70 23 56 23 44 20 Z" fill={line ? INK : '#8e47ff'} />
        </g>
      );
    case 'bat':
      return (
        <>
          <path d="M24 64 C12 54 0 58 -6 68 C2 66 6 72 4 79 C11 75 17 79 17 86 C20 78 22 70 24 64 Z" fill={line ? '#fff' : '#3b2a55'} stroke={stroke} strokeWidth={line ? 2.5 : 0} strokeLinejoin="round" />
          <path d="M100 64 C112 54 124 58 130 68 C122 66 118 72 120 79 C113 75 107 79 107 86 C104 78 102 70 100 64 Z" fill={line ? '#fff' : '#3b2a55'} stroke={stroke} strokeWidth={line ? 2.5 : 0} strokeLinejoin="round" />
          <path d="M55 84 L57 90 L59 84 M65 84 L67 90 L69 84" fill="#fff" stroke={line ? INK : 'none'} strokeWidth="1.5" strokeLinejoin="round" />
        </>
      );
    case 'bow':
      return (
        <g transform="translate(84 22) rotate(18)">
          <path d="M0 0 C-12 -12 -24 -6 -20 4 C-17 12 -6 8 0 0 Z" fill={line ? '#fff' : '#ff5c93'} stroke={line ? INK : '#e0457a'} strokeWidth="2.2" />
          <path d="M0 0 C12 -12 24 -6 20 4 C17 12 6 8 0 0 Z" fill={line ? '#fff' : '#ff5c93'} stroke={line ? INK : '#e0457a'} strokeWidth="2.2" />
          <circle r="4.5" fill={line ? '#fff' : '#e0457a'} stroke={line ? INK : 'none'} strokeWidth="2" />
        </g>
      );
    case 'mummy':
      return (
        <g stroke={line ? INK : '#d6cbb7'} strokeWidth="3.4" strokeLinecap="round" fill="none" opacity={line ? 0.55 : 1}>
          <path d="M24 44 L98 34" />
          <path d="M18 84 L104 76" />
          <path d="M20 100 L104 94" />
          <path d="M22 114 L100 110" />
        </g>
      );
    default:
      return null;
  }
}

export function Ghost({
  costume = 'sheet',
  mood = 'open',
  emblem,
  size = 120,
  float = false,
  phase = 0,
  line = false,
  tilt = 0,
  shadow = false,
  className = '',
  title,
}: GhostProps) {
  const dark = costume === 'skeleton';
  const body = costume === 'franken' ? FRANKEN_BODY : BODY;
  const style = { '--phase': `${-phase}s`, width: size, height: (size * 172) / 136 } as CSSProperties;
  return (
    <svg
      className={`ghost${float ? ' float' : ''}${line ? ' line' : ''} ${className}`}
      viewBox="-6 -32 136 172"
      style={style}
      role="img"
      aria-label={title ?? `A little ${costume === 'sheet' ? '' : costume + ' '}ghost`}
    >
      {shadow && <ellipse className="ghost-shadow" cx="62" cy="136" rx="34" ry="5" fill="#000" opacity="0.14" />}
      <g className="ghost-bob">
        <g transform={`rotate(${tilt} 62 70)`}>
          <g className="ghost-body">
            <path
              d={body}
              fill={line ? '#fff' : FILL[costume]}
              stroke={line ? INK : EDGE[costume]}
              strokeWidth={line ? 2.8 : 2.2}
              strokeLinejoin="round"
            />
            {!line && costume !== 'skeleton' && (
              <path d="M30 108 C34 116 40 118 44 116" fill="none" stroke="#000" strokeOpacity="0.06" strokeWidth="5" strokeLinecap="round" />
            )}
          </g>
          <Costume costume={costume} line={line} />
          <Face mood={mood} dark={dark && costume !== 'skeleton'} line={line} />
          {emblem && (
            <g transform={`translate(${EMBLEM_AT[costume][0]} ${EMBLEM_AT[costume][1]})`}>
              <Emblem name={emblem} size={17} color={line ? INK : dark ? '#f8f6f2' : 'rgba(26,20,32,0.5)'} />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
