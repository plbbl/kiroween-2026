import { useEffect, useRef, useState } from 'react';
import { Ghost, type GhostProps } from './Ghost.tsx';

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/**
 * A ghost that keeps an eye on you: it looks towards the pointer, and at
 * whatever field you are typing in. Only this little component re-renders
 * as the pointer moves.
 */
export function WatchingGhost(props: Omit<GhostProps, 'look'>) {
  const box = useRef<HTMLSpanElement>(null);
  const [look, setLook] = useState<{ x: number; y: number } | undefined>(undefined);

  useEffect(() => {
    let frame = 0;
    const aim = (x: number, y: number) => {
      const r = box.current?.getBoundingClientRect();
      if (!r) return;
      setLook({ x: clamp((x - (r.left + r.width / 2)) / 300), y: clamp((y - (r.top + r.height / 2)) / 220) });
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => aim(e.clientX, e.clientY));
    };
    const onFocus = (e: FocusEvent) => {
      const t = e.target as Element | null;
      if (!t?.matches?.('input, textarea, select')) return;
      const r = t.getBoundingClientRect();
      aim(r.left + Math.min(r.width / 2, 140), r.top + Math.min(r.height / 2, 30));
    };
    window.addEventListener('pointermove', onMove);
    document.addEventListener('focusin', onFocus);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('focusin', onFocus);
    };
  }, []);

  return (
    <span ref={box} className="watching-ghost">
      <Ghost {...props} look={look} />
    </span>
  );
}
