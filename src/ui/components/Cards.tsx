import { cardToQrText, cardToWords } from '../../core/cards.ts';
import type { HolderCards } from '../../core/jar.ts';
import { sigilSeed } from '../../core/sigil.ts';
import { Qr } from './Qr.tsx';
import { Sigil } from './Sigil.tsx';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const NUMBER_WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function roman(n: number): string {
  return ROMAN[n] ?? String(n);
}

export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

interface CardProps {
  owner: string;
  card: HolderCards;
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

export function ShardFace({ owner, card, index, total, threshold }: CardProps) {
  const seed = sigilSeed(card.shard.jarId, card.x);
  return (
    <section className="card-face shard-face" aria-label={`Shard card for ${card.name}`}>
      <header className="card-head">
        <span>The Phylactery of {owner}</span>
        <span>
          Shard {roman(index + 1)} of {roman(total)}
        </span>
      </header>
      <div className="card-body">
        <Sigil seed={seed} size={124} strokeWidth={1.4} title={`Sigil of ${card.name}'s card`} />
        <div className="card-who">
          <p className="card-held">Held by</p>
          <p className="card-name">{card.name}</p>
          <p className="card-rule">
            Any {numberWord(threshold)} of the {numberWord(total)} cards will open the vessel. Fewer reveal nothing.
          </p>
        </div>
        <Qr text={cardToQrText(card.shard)} size={136} label={`Code for ${card.name}'s shard`} />
      </div>
      <WordGrid words={cardToWords(card.shard)} columns={5} />
      <footer className="card-foot">
        When the time comes, gather with the other holders and open the Grimoire file, or any copy of Phylactery. Keep this
        card somewhere safe. Never post a photograph of it.
      </footer>
    </section>
  );
}

export function SealFace({ owner, card }: CardProps) {
  const seed = sigilSeed(card.shard.jarId, card.x);
  const first = owner.split(/\s+/)[0] ?? owner;
  return (
    <section className="card-face seal-face" aria-label={`Personal seal for ${card.name}`}>
      <header className="card-head">
        <span>Your seal</span>
        <span>For {card.name} alone</span>
      </header>
      <div className="card-body seal-body">
        <div className="card-who">
          <p className="card-name small">{card.hasLetter ? `${first} wrote a letter to you.` : `There is no separate letter for you.`}</p>
          <p className="card-rule">
            {card.hasLetter
              ? 'After the vessel is opened, this seal opens your letter. Do not show it at the circle.'
              : 'Keep this half anyway. It belongs with your card.'}
          </p>
        </div>
        <Sigil seed={seed} size={64} strokeWidth={1.6} title="The same sigil as your shard" />
        <Qr text={cardToQrText(card.seal)} size={110} label={`Code for ${card.name}'s seal`} />
      </div>
      <WordGrid words={cardToWords(card.seal)} columns={6} />
    </section>
  );
}

export function PrintableCard(props: CardProps) {
  return (
    <article className="print-card">
      <ShardFace {...props} />
      <div className="fold-line" aria-hidden="true">
        <span>Fold here. The inside half is your seal, for your eyes only.</span>
      </div>
      <SealFace {...props} />
    </article>
  );
}
