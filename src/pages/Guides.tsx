import { useEffect, useState, type CSSProperties } from 'react';
import { Ornament } from '../ui/components/Ornaments.tsx';
import { useAtmosphere } from '../ui/shell.tsx';

interface Item {
  title: string;
  body: string;
  link?: { href: string; label: string };
}

const BEFORE: Item[] = [
  {
    title: 'Name a Legacy Contact for your Apple Account',
    body: 'Apple gives the person you name an access key. With it and a death certificate they can request your photos, files and backups. It does not include passwords stored in your Apple keychain, so put the important ones in your vessel.',
    link: { href: 'https://support.apple.com/en-us/102631', label: 'Apple Support: add a Legacy Contact' },
  },
  {
    title: 'Set up Google’s Inactive Account Manager',
    body: 'Choose how long Google waits after your account goes quiet (three to eighteen months), and up to ten people who may then download your data. You can also ask for the account to be deleted.',
    link: { href: 'https://myaccount.google.com/inactive', label: 'Google: Inactive Account Manager' },
  },
  {
    title: 'Choose a legacy contact on Facebook',
    body: 'A legacy contact can look after your memorialised profile. They cannot read your messages. You can choose deletion instead.',
    link: { href: 'https://www.facebook.com/help/1568013990080948', label: 'Facebook Help: legacy contacts' },
  },
  {
    title: 'Give your password manager a way in',
    body: 'Most password managers have an emergency access feature or a printable emergency kit. The simplest plan is often to write the master password into your vessel and nothing else.',
    link: { href: 'https://bitwarden.com/help/emergency-access/', label: 'An example: Bitwarden emergency access' },
  },
  {
    title: 'Think about two-step sign-in',
    body: 'If your accounts need a code from your phone, your people will need the phone and its passcode, or your backup codes. Say in your vessel where they are.',
  },
  {
    title: 'Tell your circle they hold a card',
    body: 'Give the cards by hand if you can, and say what they are for. A card no one remembers is a card that will not come to the circle.',
  },
];

const AFTER: Item[] = [
  {
    title: 'In the first hours',
    body: 'If the death was at home and not expected, call 911. If it was expected, call their doctor or hospice. Then call a funeral home; they can collect the body and help with the next steps.',
  },
  {
    title: 'Order several certified death certificates',
    body: 'Banks, insurers and agencies will each want one. The funeral home can usually order them; otherwise ask the vital records office of the state where the death happened.',
    link: { href: 'https://www.usa.gov/death-certificate', label: 'USAGov: certified copies of a death certificate' },
  },
  {
    title: 'Look after the home, the car and the animals',
    body: 'Lock up, collect the mail, water the plants. Check the vessel for who takes the animals.',
  },
  {
    title: 'Tell Social Security and Medicare',
    body: 'Funeral homes often do this. If not, call Social Security. Payments for the month of death may need to be returned.',
    link: { href: 'https://www.usa.gov/social-security-report-a-death', label: 'USAGov: report a death to Social Security' },
  },
  {
    title: 'Notify the others who need to know',
    body: 'Employer, banks, insurers, pension, the three credit bureaus (ask for a deceased alert, which helps prevent identity theft), and the post office for forwarding.',
    link: { href: 'https://www.usa.gov/report-a-death', label: 'USAGov: agencies to notify' },
  },
  {
    title: 'Follow the wishes for each account',
    body: 'The vessel says which accounts to close, keep, memorialise or hand over. Download photos and files before anything is closed.',
  },
  {
    title: 'Find the will',
    body: 'If there is one, the vessel should say where. The executor named in it takes it to the probate court of the county. If there is none, that court can explain what happens next.',
  },
  {
    title: 'Let the days be slow',
    body: 'Almost nothing here is urgent. Eat something. Sleep. Let people help.',
  },
];

function Checklist({ items, id }: { items: Item[]; id: string }) {
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));
  return (
    <ol className="checklist">
      {items.map((it, i) => (
        <li key={it.title} className={done[i] ? 'done' : ''}>
          <label className="check">
            <input
              type="checkbox"
              checked={done[i]}
              onChange={() => setDone(done.map((d, j) => (j === i ? !d : d)))}
              aria-describedby={`${id}-${i}`}
            />
            <span className="check-box" aria-hidden="true" />
            <span className="check-title">{it.title}</span>
          </label>
          <p id={`${id}-${i}`}>{it.body}</p>
          {it.link && (
            <a href={it.link.href} target="_blank" rel="noreferrer noopener">
              {it.link.label}
            </a>
          )}
        </li>
      ))}
    </ol>
  );
}

export function Guides({ anchor }: { anchor: string }) {
  useAtmosphere('day', anchor === 'after' ? 9 : 3);

  useEffect(() => {
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [anchor]);

  return (
    <div className="page guides-page">
      <section className="column center">
        <p className="eyebrow ink">Guides</p>
        <h1 className="ink" style={{ '--d': '150ms' } as CSSProperties}>
          Before, and after
        </h1>
        <p className="lede ink" style={{ margin: '0 auto', '--d': '300ms' } as CSSProperties}>
          The vessel holds what only you know. The world has its own doors, too. These lists say where they are. The ticks are
          not saved anywhere.
        </p>
      </section>

      <section className="column guide" id="before">
        <p className="roman guide-num">I</p>
        <h2>Before: doors you can leave open</h2>
        <p className="muted">Each company has its own way to let someone in after you. Most people have never set one up.</p>
        <Checklist items={BEFORE} id="before" />
      </section>

      <Ornament />

      <section className="column guide" id="after">
        <p className="roman guide-num">II</p>
        <h2>After: for the days that follow</h2>
        <p className="muted">For the people left to do things. Written for the United States; other countries differ.</p>
        <Checklist items={AFTER} id="after" />
        <p className="faint">
          More help from the U.S. government: <a href="https://www.usa.gov/death-loved-one" target="_blank" rel="noreferrer noopener">USAGov, dealing with the death of a loved one</a>.
        </p>
      </section>
    </div>
  );
}
