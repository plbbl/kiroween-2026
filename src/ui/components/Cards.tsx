import type { CSSProperties, MouseEvent } from 'react';
import type { Buddy } from '../../core/buddy.ts';
import { cardToQrText, cardToWords, SHARD_SHARED_WORDS } from '../../core/cards.ts';
import type { KeyCard } from '../../core/cards.ts';
import type { HolderCards } from '../../core/jar.ts';
import { Ghost } from '../art/Ghost.tsx';
import { Cobweb } from '../art/Spooky.tsx';
import { homeAddress, safeFilename } from '../grimoire.ts';
import { numberWord } from '../text.ts';
import { Qr } from './Qr.tsx';

/** A tiny envelope: this card's seal opens a private letter. */
export function EnvelopeMark() {
  return (
    <svg width="18" height="13" viewBox="0 0 18 13" aria-hidden="true">
      <rect x="1" y="1" width="16" height="11" rx="2.5" fill="#fff" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 2.2 L9 7.6 L16 2.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
        <Ghost costume={buddy.costume} emblem={buddy.emblem} tilt={buddy.tilt} size={96} float phase={index * 0.6} />
      </span>
      <span className="buddy-card-name">{name}</span>
      {note && (
        <span className="buddy-card-note" title={note}>
          <EnvelopeMark />
          <span className="visually-hidden">{note}</span>
        </span>
      )}
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
  /** Everyone who holds a card, so each card says who to gather with. */
  circle: string[];
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
          <span className="n">{String(i + 1).padStart(2, '0')}</span>
          {w}
        </li>
      ))}
    </ol>
  );
}

const listNames = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? ''));

function ShardFace({ owner, circle, card, buddy, index, total, threshold }: PrintProps) {
  const first = owner.split(/\s+/)[0];
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
            {listNames(circle.map((n) => n.split(/\s+/)[0]!))} each hold one of {numberWord(total)} cards. Any {numberWord(threshold)} of you, together,
            open the jar. Fewer reveal nothing.
          </p>
        </div>
        <Qr text={cardToQrText(card.shard)} size={128} label={`Code for ${card.name}'s card`} />
      </div>
      <WordGrid words={cardToWords(card.shard)} columns={5} />
      <footer className="card-foot">
        You also need {first}’s jar file, “{safeFilename(`${owner}'s jar`)}.html”, which {first} emails to each of you (keep that email). When the
        time comes, gather, open it
        {homeAddress() ? ` (or ${homeAddress()}, then Séance)` : ''}, and each offer your card. Keep this card safe, like a house key. Never post a photo
        of it. Words {SHARD_SHARED_WORDS.from} to {SHARD_SHARED_WORDS.to} are the same on every card of this jar.
      </footer>
    </section>
  );
}

function SealFace({ owner, card, buddy }: PrintProps) {
  const first = owner.split(/\s+/)[0] ?? owner;
  return (
    <section className="card-face seal-face" aria-label={`Private seal for ${card.name}`}>
      <header className="card-head">
        <span>{owner}’s jar · your private seal</span>
        <span>for {card.name} only</span>
      </header>
      <div className="card-body">
        <Ghost costume={buddy.costume} emblem={buddy.emblem} tilt={buddy.tilt} size={70} line mood="wink" title={`${card.name}'s ghost, winking`} />
        <div className="card-who">
          <p className="card-name small">{card.hasLetter ? `${first} wrote you a letter.` : 'For a letter, now or later.'}</p>
          <p className="card-rule">
            {card.hasLetter
              ? 'Once the jar is open, this seal opens your letter. Keep it with your card, and show it to no one.'
              : `If ${first} leaves you a private letter, this half opens it once the jar is open. Keep it with your card.`}
          </p>
        </div>
        <Qr text={cardToQrText(card.seal)} size={104} label={`Code for ${card.name}'s seal`} />
      </div>
      <WordGrid words={cardToWords(card.seal)} columns={5} />
    </section>
  );
}

export function PrintableCard(props: PrintProps) {
  return (
    <article className="print-card">
      <Cobweb className="card-web" color="#000" size={64} corner="top-right" />
      <ShardFace {...props} />
      <div className="fold-line" aria-hidden="true">
        <span>cut here · the half below is yours alone</span>
      </div>
      <SealFace {...props} />
    </article>
  );
}

/** The owner's own page: the key that lets them change the jar later. */
export function PrintableKey({ owner, keyCard }: { owner: string; keyCard: KeyCard }) {
  return (
    <article className="print-card print-key">
      <section className="card-face" aria-label={`Key to ${owner}'s jar`}>
        <header className="card-head">
          <span>{owner}’s jar</span>
          <span>your key · keep it, don’t give it</span>
        </header>
        <div className="card-body">
          <Ghost mood="happy" emblem="key" size={118} line title="The ghost in your jar" />
          <div className="card-who">
            <p className="card-held">For you, {owner.split(/\s+/)[0]}</p>
            <p className="card-name">Your key</p>
            <p className="card-rule">
              With this you can change what is in the jar later, and your friends keep their cards. It also opens the jar on its own, private
              letters included, so keep it like a passport: not with the cards, not in a photo.
            </p>
          </div>
          <Qr text={cardToQrText(keyCard)} size={128} label={`Code for ${owner}'s key`} />
        </div>
        <WordGrid words={cardToWords(keyCard)} columns={4} />
        <footer className="card-foot">
          To change the jar, or to open it without the cards: open your jar file{homeAddress() ? ` or ${homeAddress()}` : ''}, choose Seal, then
          “Change what’s inside”, and give it your jar file and this key.
        </footer>
      </section>
    </article>
  );
}
