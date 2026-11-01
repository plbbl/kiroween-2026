import { useState, type CSSProperties } from 'react';
import { CardError, parseCard } from '../../core/cards.ts';
import { JarError, openWithKey, type JarFile } from '../../core/jar.ts';
import { Ghost } from '../../ui/art/Ghost.tsx';
import { Jar } from '../../ui/art/Jar.tsx';
import { initialsOf } from '../../ui/art/WaxSeal.tsx';
import { CardInput } from '../../ui/components/CardInput.tsx';
import { jarFromText } from '../../ui/grimoire.ts';
import { href, useAtmosphere } from '../../ui/shell.tsx';
import { sound } from '../../ui/sound.ts';
import type { Existing } from './Seal.tsx';

/**
 * The owner opens their own jar with their key card, to change what is in
 * it. A jar file opened from disk already carries its jar; otherwise the
 * owner chooses the file first.
 */
export function OpenForUpdate({ jar: given, onOpen }: { jar: JarFile | null; onOpen: (e: Existing) => void }) {
  useAtmosphere('day');
  const [jar, setJar] = useState<JarFile | null>(given);
  const [fileError, setFileError] = useState('');
  const [over, setOver] = useState(false);

  const readFile = async (file: File) => {
    setFileError('');
    try {
      setJar(jarFromText(await file.text()));
    } catch (e) {
      setFileError(e instanceof JarError ? e.message : 'That file isn’t a jar.');
    }
  };

  const tryKey = async (text: string): Promise<string | null> => {
    if (!jar) return 'Choose your jar file first.';
    let card;
    try {
      card = parseCard(text);
    } catch (e) {
      return e instanceof CardError ? e.message : 'That key could not be read.';
    }
    if (card.kind !== 'key') return 'That’s a friend’s card. This needs your own key, the page printed for you.';
    try {
      const owned = await openWithKey(jar, card);
      sound.chime();
      window.scrollTo({ top: 0, behavior: 'instant' });
      onOpen({ jar, key: card, owned });
      return null;
    } catch (e) {
      return e instanceof JarError ? e.message : 'That key did not open the jar.';
    }
  };

  const first = jar?.owner.split(/\s+/)[0];

  return (
    <div className="page update-page">
      <section className="narrow center">
        <p className="tag pop">update</p>
        <h1 className="pop" style={{ '--d': '80ms' } as CSSProperties}>
          {first ? `${first}’s jar` : 'Change what’s inside'}
        </h1>
        <p className="lede rise" style={{ '--d': '160ms' } as CSSProperties}>
          With your key, write new words into the same jar. Your friends keep their cards.
        </p>
      </section>

      <section className="narrow update-steps">
        <div className={`card update-step${jar ? ' done' : ''}`}>
          <span className="todo-num">1</span>
          {jar ? (
            <div className="update-jar">
              <Jar initials={initialsOf(jar.owner)} size={96} />
              <div>
                <h3>{jar.owner}’s jar</h3>
                <p className="muted">
                  Sealed {new Date(jar.sealedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  {jar.revision && jar.revision > 1 ? ` · version ${jar.revision}` : ''} · {jar.holders.map((h) => h.name.split(/\s+/)[0]).join(', ')}
                </p>
                {!given && (
                  <button type="button" className="text-btn" onClick={() => setJar(null)}>
                    Choose another file
                  </button>
                )}
              </div>
            </div>
          ) : (
            <label
              className={`update-drop${over ? ' over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                const f = e.dataTransfer.files[0];
                if (f) void readFile(f);
              }}
            >
              <input
                type="file"
                accept=".html,.json,text/html,application/json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void readFile(f);
                  e.target.value = '';
                }}
              />
              <h3>Your jar file</h3>
              <span className="muted">Drop it here, or tap to choose it. It is read on this device only.</span>
              {fileError && <span className="error">{fileError}</span>}
            </label>
          )}
        </div>

        <div className={`card update-step${jar ? '' : ' waiting'}`}>
          <span className="todo-num">2</span>
          <div>
            <h3>Your key</h3>
            <p className="muted">The page printed for you when you sealed the jar. Not a friend’s card.</p>
            <CardInput kind="key" onCard={tryKey} disabled={!jar} />
          </div>
        </div>

        <p className="note">
          <Ghost size={30} mood="wink" />
          <span>
            Lost your key? Then this jar can’t be changed, but it still opens for your circle. You can always{' '}
            <a href={href('seal')}>seal a new jar</a> with new cards.
          </span>
        </p>
      </section>
    </div>
  );
}
