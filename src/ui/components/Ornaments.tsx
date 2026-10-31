// Small engraved marks used across the pages.

export function Fleuron() {
  return (
    <svg viewBox="0 0 60 28" aria-hidden="true">
      <path
        d="M30 4 L36 14 L30 24 L24 14 Z M30 9 L33 14 L30 19 L27 14 Z M2 14 C10 14 14 8 20 10 C23 11 23 15 20 16 C18 16.6 17 15 18.5 14 M58 14 C50 14 46 8 40 10 C37 11 37 15 40 16 C42 16.6 43 15 41.5 14 M20 18 C16 22 10 21 8 18 M40 18 C44 22 50 21 52 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Ornament() {
  return (
    <div className="ornament" aria-hidden="true">
      <Fleuron />
    </div>
  );
}

export function CornerMark() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M4 24 L4 4 L24 4 M8 20 L8 8 L20 8 M4 4 C10 10 12 12 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <circle cx="14" cy="14" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function Mark({ className }: { className?: string }) {
  // The wordmark: a stave crossed by a lid, standing on a plinth.
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M12 5 V19 M8.2 8.4 L12 5.8 L15.8 8.4 M8.5 17.5 H15.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function SealIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 8 C40 8 44 6 50 12 C56 18 56 24 56 32 C56 40 58 46 52 52 C46 58 40 56 32 56 C24 56 18 58 12 52 C6 46 8 40 8 32 C8 24 6 18 12 12 C18 6 24 8 32 8 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="32" cy="32" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M32 22 V42 M26 27 L32 23 L38 27 M27 40 H37" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function WatchIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M20 8 H44 M20 56 H44" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M22 8 C22 22 30 26 32 32 C34 26 42 22 42 8 M22 56 C22 42 30 38 32 32 C34 38 42 42 42 56"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M26 50 C28 46 36 46 38 50 Z" fill="currentColor" opacity="0.6" />
      <circle cx="32" cy="37" r="0.9" fill="currentColor" />
      <circle cx="32" cy="41" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function CandleIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 6 C36 13 38 18 35.5 22 C34 24.5 30 24.5 28.5 22 C26 18 28 13 32 6 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M32 24 V28" stroke="currentColor" strokeWidth="1.2" />
      <path d="M24 28 H40 V52 H24 Z M24 34 C27 36 28 31 31 34" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M14 54 Q32 62 50 54" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      {on ? (
        <path d="M16 9 C17.5 10.5 17.5 13.5 16 15 M18.5 6.5 C21.5 9.5 21.5 14.5 18.5 17.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      ) : (
        <path d="M16.5 9.5 L21 14 M21 9.5 L16.5 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      )}
    </svg>
  );
}
