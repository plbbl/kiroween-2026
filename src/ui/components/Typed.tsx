import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../shell.tsx';

/**
 * A line the ghost says, typed out a letter at a time, the way a voice
 * comes. The rest of the line is already there, invisible, so the bubble
 * never changes size, and a screen reader hears the whole line at once.
 * Give it a `key` of the text so a new line starts from the beginning.
 */
export function Typed({ text, speed = 34, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [n, setN] = useState(() => (prefersReducedMotion() ? text.length : 0));
  useEffect(() => {
    if (n >= text.length) return;
    const wait = n === 0 ? delay : text[n] === ' ' ? speed / 2 : speed;
    const id = window.setTimeout(() => setN((v) => v + 1), wait);
    return () => clearTimeout(id);
  }, [n, text, speed, delay]);
  return (
    <>
      <span aria-hidden="true">{text.slice(0, n)}</span>
      <span className="typed-rest" aria-hidden="true">
        {text.slice(n)}
      </span>
      <span className="visually-hidden">{text}</span>
    </>
  );
}
