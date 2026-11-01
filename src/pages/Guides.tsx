import { useEffect, useState, type CSSProperties } from 'react';
import type { Costume } from '../core/buddy.ts';
import type { Mood } from '../ui/art/Ghost.tsx';
import { useAtmosphere } from '../ui/shell.tsx';
import { Pumpkin } from '../ui/art/Spooky.tsx';
import { WatchingGhost } from '../ui/art/WatchingGhost.tsx';

interface Item {
  title: string;
  body: string;
  link?: { href: string; label: string };
}

const BEFORE: Item[] = [
  {
    title: 'Name a Legacy Contact for your Apple Account',
    body: 'They get an access key. With it and a death certificate they can ask for your photos, files and backups. Passwords in your Apple keychain are not included, so put the important ones in your jar.',
    link: { href: 'https://support.apple.com/en-us/102631', label: 'Apple Support' },
  },
  {
    title: 'Set up Google’s Inactive Account Manager',
    body: 'Choose how long Google waits after your account goes quiet (three to eighteen months), and up to ten people who may then download your data.',
    link: { href: 'https://myaccount.google.com/inactive', label: 'Google' },
  },
  {
    title: 'Choose a legacy contact on Facebook',
    body: 'They can look after your memorialized profile, but cannot read your messages. You can choose deletion instead.',
    link: { href: 'https://www.facebook.com/help/1568013990080948', label: 'Facebook Help' },
  },
  {
    title: 'Give your password manager a way in',
    body: 'Most have an emergency access feature or a printable emergency kit. The simplest plan: write the master password into your jar.',
    link: { href: 'https://bitwarden.com/help/emergency-access/', label: 'An example from Bitwarden' },
  },
  {
    title: 'Think about two-step sign-in',
    body: 'If your accounts need a code from your phone, your people will need the phone and its passcode, or your backup codes. Say where they are.',
  },
  {
    title: 'Tell your friends they hold a card',
    body: 'Give cards by hand if you can, and say what they are for. A card no one remembers won’t come to the séance.',
  },
];

const AFTER: Item[] = [
  {
    title: 'In the first hours',
    body: 'If the death was at home and not expected, call 911. If it was expected, call their doctor or hospice. Then a funeral home can help with what comes next.',
  },
  {
    title: 'Order a few certified death certificates',
    body: 'Banks, insurers and agencies will each want one. The funeral home can usually order them.',
    link: { href: 'https://www.usa.gov/death-certificate', label: 'USAGov' },
  },
  {
    title: 'Gather the circle and open the jar',
    body: 'Bring the jar file (or the link from the watch) and enough cards. If a card is lost, any others will do, as many as the card says. The owner’s own key page, if you find it, opens the jar alone: choose Seal, then “Change what’s inside”.',
  },
  {
    title: 'Look after the home, the car and the animals',
    body: 'Lock up, collect the mail, water the plants. The jar may say who takes the pets.',
  },
  {
    title: 'Tell Social Security and Medicare',
    body: 'Funeral homes often do this. If not, call Social Security. Payments for the month of death may need to be returned.',
    link: { href: 'https://www.usa.gov/social-security-report-a-death', label: 'USAGov' },
  },
  {
    title: 'Let the others know',
    body: 'Employer, banks, insurers, pension, the three credit bureaus (ask for a deceased alert, which helps prevent identity theft), and the post office.',
    link: { href: 'https://www.usa.gov/report-a-death', label: 'USAGov: who to notify' },
  },
  {
    title: 'Follow the wishes for each account',
    body: 'The jar says what to close, keep, memorialize or hand over. Download photos and files before anything is closed. For money, don’t sign in as them: banks and brokers act on a death certificate and the executor’s papers.',
  },
  {
    title: 'Find the will',
    body: 'If there is one, the jar should say where. The executor takes it to the county probate court, which can also explain what happens if there is none.',
  },
  {
    title: 'Let the days be slow',
    body: 'Almost nothing here is urgent. Eat something warm. Sleep. Let people help.',
  },
];

function Checklist({ items, id }: { items: Item[]; id: string }) {
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));
  const [open, setOpen] = useState<boolean[]>(() => items.map(() => false));
  const count = done.filter(Boolean).length;
  const flip = (list: boolean[], i: number) => list.map((v, j) => (j === i ? !v : v));
  return (
    <>
      <div className="meter" aria-hidden="true">
        <div className="meter-fill" style={{ width: `${(count / items.length) * 100}%` }} />
      </div>
      <p className="faint meter-text">
        {count} of {items.length} done
      </p>
      <ol className="checklist">
        {items.map((it, i) => (
          <li key={it.title} className={`${done[i] ? 'done' : ''}${open[i] ? ' open' : ''}`}>
            <div className="check-row">
              <label className="check">
                <input type="checkbox" checked={done[i]} onChange={() => setDone(flip(done, i))} aria-label={`Done: ${it.title}`} />
                {/* Done things light up like jack-o'-lanterns. */}
                <span className="check-box" aria-hidden="true">
                  <Pumpkin size={34} lit={done[i]} />
                </span>
              </label>
              <button type="button" className="check-title" aria-expanded={open[i]} aria-controls={`${id}-${i}`} onClick={() => setOpen(flip(open, i))}>
                <span>{it.title}</span>
                <svg className="chevron" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M3 5 L7 9 L11 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {open[i] && (
              <div className="check-body" id={`${id}-${i}`}>
                <p>{it.body}</p>
                {it.link && (
                  <a href={it.link.href} target="_blank" rel="noreferrer noopener">
                    {it.link.label} ↗
                  </a>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}

function GuideCard({ id, title, sub, costume, mood, items }: { id: string; title: string; sub: string; costume: Costume; mood: Mood; items: Item[] }) {
  return (
    <section className="card guide" id={id} aria-labelledby={`${id}-title`}>
      <div className="guide-ghost">
        <WatchingGhost costume={costume} mood={mood} size={84} float />
      </div>
      <h2 id={`${id}-title`}>{title}</h2>
      <p className="muted">{sub}</p>
      <Checklist items={items} id={id} />
    </section>
  );
}

export function Guides({ anchor }: { anchor: string }) {
  useAtmosphere('day');

  useEffect(() => {
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [anchor]);

  return (
    <div className="page guides-page">
      <section className="narrow center">
        <h1 className="pop" style={{ '--d': '100ms' } as CSSProperties}>
          Before, and after
        </h1>
        <p className="lede rise" style={{ '--d': '200ms' } as CSSProperties}>
          Doors to open now, and what to do later.
        </p>
      </section>
      <div className="narrow guides">
        <GuideCard id="before" title="Doors you can leave open" sub="Most people never set these up." costume="witch" mood="wink" items={BEFORE} />
        <GuideCard id="after" title="For the days that follow" sub="For those left behind. Written for the U.S." costume="sheet" mood="happy" items={AFTER} />
        <p className="center faint">
          More from the U.S. government:{' '}
          <a href="https://www.usa.gov/death-loved-one" target="_blank" rel="noreferrer noopener">
            dealing with the death of a loved one ↗
          </a>
        </p>
      </div>
    </div>
  );
}
