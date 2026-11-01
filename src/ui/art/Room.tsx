import type { CSSProperties } from 'react';
import { Bat } from './Spooky.tsx';
import { Candle } from './Candle.tsx';
import { WatchingGhost } from './WatchingGhost.tsx';

/** An arched window onto the night: the moon, a cloud, a few stars, and the frame's cross. */
function ArchedWindow() {
  return (
    <svg className="room-window" viewBox="0 0 240 330" aria-hidden="true">
      <defs>
        <linearGradient id="room-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f1450" />
          <stop offset="0.65" stopColor="#3b2290" />
          <stop offset="1" stopColor="#5a33c2" />
        </linearGradient>
        <radialGradient id="room-moon" cx="0.42" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#fffbe6" />
          <stop offset="1" stopColor="#f3dfa0" />
        </radialGradient>
        <radialGradient id="room-moon-glow">
          <stop offset="0" stopColor="#fff2c4" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff2c4" stopOpacity="0" />
        </radialGradient>
        <clipPath id="room-arch">
          <path d="M28 322 L28 122 A92 92 0 0 1 212 122 L212 322 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#room-arch)">
        <rect width="240" height="330" fill="url(#room-glass)" />
        <circle cx="150" cy="96" r="70" fill="url(#room-moon-glow)" />
        <circle cx="150" cy="96" r="30" fill="url(#room-moon)" />
        <circle cx="140" cy="88" r="5" fill="#ead39a" opacity="0.7" />
        <circle cx="160" cy="106" r="3.5" fill="#ead39a" opacity="0.6" />
        <path className="room-cloud" d="M96 122 C98 112 112 110 118 118 C122 108 140 110 140 122 C150 122 152 132 142 134 L100 134 C90 134 88 124 96 122 Z" fill="#c9b6f2" opacity="0.5" />
        <g fill="#fff" opacity="0.8">
          <circle cx="70" cy="80" r="1.6" />
          <circle cx="92" cy="58" r="1.1" />
          <circle cx="62" cy="150" r="1.2" />
          <circle cx="188" cy="176" r="1.4" />
          <circle cx="176" cy="226" r="1" />
        </g>
        {/* Far hills through the glass. */}
        <path d="M28 290 C70 262 104 270 132 282 C162 294 190 270 212 276 L212 322 L28 322 Z" fill="#241455" />
      </g>
      <path d="M28 322 L28 122 A92 92 0 0 1 212 122 L212 322 Z" fill="none" stroke="#1b1036" strokeWidth="12" />
      <path d="M120 30 L120 322 M28 200 L212 200" stroke="#1b1036" strokeWidth="8" />
      <rect x="14" y="318" width="212" height="12" rx="4" fill="#24154a" />
    </svg>
  );
}

/** A heavy curtain, gathered to one side. */
function Curtain({ side }: { side: 'left' | 'right' }) {
  return (
    <svg className={`room-curtain ${side}`} viewBox="0 0 120 360" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`room-velvet-${side}`} x1="0" x2="1">
          <stop offset="0" stopColor="#2a0f45" />
          <stop offset="0.5" stopColor="#47186d" />
          <stop offset="1" stopColor="#2a0f45" />
        </linearGradient>
      </defs>
      <path d="M0 0 H120 C104 70 112 150 84 214 C72 244 88 300 110 360 H0 Z" fill={`url(#room-velvet-${side})`} />
      <path d="M30 0 C34 90 26 190 22 360 M62 0 C66 80 58 170 52 360 M92 0 C90 60 86 130 74 210" stroke="#1d0a33" strokeWidth="3" fill="none" opacity="0.6" />
    </svg>
  );
}

/**
 * The séance room around the table: an arched window onto the moon, velvet
 * curtains, a beam of moonlight on the rug, an ancestor's portrait whose eyes
 * follow you, a candle in a sconce, and fog along the floor that thickens as
 * candles are lit and rolls away when the jar opens.
 */
export function SeanceRoom() {
  return (
    <div className="seance-room" aria-hidden="true">
      <div className="room-moonbeam" />
      <div className="room-window-wrap">
        <ArchedWindow />
        <span className="room-rod" />
        <Curtain side="left" />
        <Curtain side="right" />
        {/* Bats roosting by the window fly off as the circle arrives. */}
        <div className="room-bats">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={`room-bat b${i}`} style={{ '--i': i } as CSSProperties}>
              <Bat size={30 + (i % 3) * 8} color="#0b0714" />
            </span>
          ))}
        </div>
      </div>
      <div className="room-portrait">
        <span className="portrait-string" />
        <div className="portrait-frame">
          <WatchingGhost costume="vampire" mood="open" size={74} />
        </div>
      </div>
      <div className="room-sconce">
        <Candle lit size={30} phase={0.4} label="" />
        <span className="sconce-arm" />
      </div>
      <div className="room-fog f1" />
      <div className="room-fog f2" />
    </div>
  );
}
