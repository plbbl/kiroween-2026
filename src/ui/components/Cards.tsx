import type { CSSProperties, MouseEvent } from 'react';
import type { Buddy } from '../../core/buddy.ts';
import { cardToQrText, cardToWords } from '../../core/cards.ts';
import type { HolderCards } from '../../core/jar.ts';
import { Ghost } from '../art/Ghost.tsx';
import { Qr } from './Qr.tsx';

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

export function capitalised(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The card as it appears on screen: a little ghost and a name. */
export function BuddyCard({
  name,
  buddy,
  index,
  total,
  note,
  style,
  onClick,
  disabled,
  className = '',
}: {
  name: string;
  buddy: Buddy;
  index: number;
  total: number;
  note?: string;
  style?: CSSProperties;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <span className="buddy-card-num mono">
        {index + 1}/{total}
      </span>
      <span className="buddy-card-art">
        <Ghost costume={buddy.costume} emblem={buddy.emblem} tilt={buddy.tilt} size={84} float phase={index * 0.6} />
      </span>
      <span className="buddy-card-name">{name}</span>
      {note && <span className="buddy-card-note">{note}</span>}
    </>
  );
  return onClick ? (
    <button type="button" className={`buddy-card ${className}`} style={style} onClick={onClick} disabled={disabled}>
      {body}
    </button>
  ) : (
    <div className={`buddy-card ${className}`} style={style}>
      {body}
    </div>
  );
}

interface PrintProps {
  owner: string;
  card: HolderCards;
  buddy: Buddy;
  index: number;
  total: number;
  threshold: number;
}

function WordGrid({ words, columns }: { words: string[]; columns: number }) {
  return (
    <ol className="word-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {words.map((w, i) => (
        <li key={i}>
          <span className="n">{i + 1}</span>
          {w}
        </li>
      ))}
    </ol>
  );
}

function ShardFace({ owner, card, buddy, index, total, threshold }: PrintProps) {
  return (
    <section className="card-face" aria-label={`Card for ${card.name}`}>
      <header className="card-head">
        <span>{owner}’s jar</span>
        <span>
          card {index + 1} of {total}
        </span>
      </header>
      <div className="card-body">
        <Ghost costume={buddy.costume} emblem={buddy.emblem} tilt={buddy.tilt} size={118} line title={`${card.name}'s ghost`} />
        <div className="card-who">
          <p className="card-held">Kept by</p>
          <p className="card-name">{card.name}</p>
          <p className="card-rule">
            Any {numberWord(threshold)} of the {numberWord(total)} cards open the jar. Fewer reveal nothing.
          </p>
        </div>
        <Qr text={cardToQrText(card.shard)} size={128} label={`Code for ${card.name}'s card`} />
      </div>
      <WordGrid words={cardToWords(card.shard)} columns={5} />
      <footer className="card-foot">
        When the time comes, gather with the others and open the jar file, or any copy of Phylactery. Keep this card safe, like a
        house key. Never post a photo of it.
      </footer>
    </section>
  );
}

function SealFace({ owner, card, buddy }: PrintProps) {
  const first = owner.split(/\s+/)[0] ?? owner;
  return (
    <section className="card-face seal-face" aria-label={`Private seal for ${card.name}`}>
      <header className="card-head">
        <span>your private seal</span>
        <span>for {card.name} only</span>
      </header>
      <div className="card-body">
        <Ghost costume={buddy.costume} emblem={buddy.emblem} tilt={buddy.tilt} size={70} line mood="wink" title={`${card.name}'s ghost, winking`} />
        <div className="card-who">
          <p className="card-name small">{card.hasLetter ? `${first} wrote you a letter.` : 'No separate letter for you.'}</p>
          <p className="card-rule">
            {card.hasLetter
              ? 'Once the jar is open, this seal opens your letter. Keep it folded. Show no one.'
              : 'Keep this half anyway. It belongs with your card.'}
          </p>
        </div>
        <Qr text={cardToQrText(card.seal)} size={104} label={`Code for ${card.name}'s seal`} />
      </div>
      <WordGrid words={cardToWords(card.seal)} columns={6} />
    </section>
  );
}

export function PrintableCard(props: PrintProps) {
  return (
    <article className="print-card">
      <ShardFace {...props} />
      <div className="fold-line" aria-hidden="true">
        <span>fold here · the half below is yours alone</span>
      </div>
      <SealFace {...props} />
    </article>
  );
}
