// End-to-end walk through the built app with Playwright, saving a
// screenshot of every important state. Run after `npm run build`:
//
//   npm run e2e            screenshots go to e2e/shots/
//
// It opens dist/index.html straight from disk, the same way a downloaded
// jar file is opened, so it also proves the app needs no server.

import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Playwright may be installed globally rather than in this project.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const shots = join(here, 'shots');
mkdirSync(shots, { recursive: true });
const app = pathToFileURL(join(root, 'dist/index.html')).href;
const demo = JSON.parse(readFileSync(join(root, 'src/demo/demo.json'), 'utf8'));

const failures = [];
const errors = [];
const check = (ok, what) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures.push(what);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
// Pages that hold what cannot be made again ask before leaving; the walk-through always means to leave.
context.on('page', (p) => p.on('dialog', (d) => void d.accept()));
const page = await context.newPage();
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const shot = (name, full = true) => page.screenshot({ path: join(shots, `${name}.png`), fullPage: full });
const settle = (ms = 1500) => page.waitForTimeout(ms);
const next = () => page.getByRole('button', { name: /^(Next|Almost done)/ }).click();

// Accessibility: no serious or critical WCAG 2 A/AA violations on key screens.
const audits = [];
async function audit(pg, name) {
  await pg.addScriptTag({ content: axeSource });
  const violations = await pg.evaluate(async () => {
    const r = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] });
    return r.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
  });
  audits.push(...violations.map((v) => `${name}: ${v}`));
}

// Home
await page.goto(app);
await settle(2600);
await shot('01-home');
await audit(page, 'home');
check(await page.getByRole('heading', { name: 'Phylactery' }).isVisible(), 'home shows the title');

// Seal a jar
await page.goto(`${app}#/seal`);
await settle(900);
await page.getByLabel('Your name').fill('Ada Lovelace');
await shot('02-seal-name', false);
await audit(page, 'seal');
await next();
await settle(500);
await page.getByLabel('Your note to everyone').fill('If you are reading this, thank you for coming.\n\nBe gentle with each other.');
await shot('03-seal-message', false);
// A phone that drops the tab while you look something up must not lose the draft.
await page.reload();
await settle(900);
check(
  (await page.getByLabel('Your note to everyone').inputValue()).endsWith('Be gentle with each other.'),
  'a reload keeps the draft, in this tab only',
);
await next();
await settle(500);
await page.getByRole('button', { name: '+ Password manager' }).click();
await page.getByPlaceholder('Login, and the password or where it is').fill('master password: engine-of-difference');
await page.getByRole('button', { name: 'Add a place' }).click();
await page.getByPlaceholder('Will, deed, insurance, spare key…').fill('Notebooks');
await page.getByPlaceholder('Blue folder, top drawer of the desk').fill('The cedar chest');
await settle(500);
await shot('04-seal-leave');
await next();
await settle(500);
await page.getByLabel('The farewell').fill('Something brief, with music.');
await shot('05-seal-wishes', false);
await next();
await settle(500);
const names = ['Charles', 'Mary', 'Augustus'];
for (let i = 0; i < names.length; i++) await page.getByPlaceholder(`Friend ${i + 1}`).fill(names[i]);
await page.getByRole('button', { name: /^Write a letter for/ }).first().click();
await page.getByPlaceholder('Dear Charles,').fill('Dear Charles,\n\nThe engine was always yours.');
await page.getByRole('radio', { name: '2 cards' }).click();
await settle(1200);
await shot('06-seal-circle');
await audit(page, 'seal circle');
await next();
await settle(900);
await shot('07-seal-press', false);
await page.getByRole('button', { name: 'Seal the jar' }).click();
await page.getByRole('heading', { name: /Sealed!/ }).waitFor({ timeout: 10000 });
await page.getByText(/^Checked:/).waitFor({ timeout: 10000 });
await settle(2200);
await shot('08-sealed');
await audit(page, 'sealed');
check(await page.getByText('Any two of these three cards open it. Print them now; you can’t later.').isVisible(), 'sealing makes three cards');
check(await page.getByText('Checked: every two of you can open it, and no one alone.').isVisible(), 'the self-check proves every pair opens it');

// Printed cards, then the key on its own (the print dialog itself is skipped)
await page.evaluate(() => {
  window.print = () => {};
});
await page.getByRole('button', { name: 'Print the cards' }).click();
await page.emulateMedia({ media: 'print' });
await settle(600);
await shot('09-print-cards');
check((await page.locator('.print-card:not(.print-key) [aria-label^="Code for"]').count()) === 6, 'each printed card has a card code and a seal code');
check((await page.locator('.print-key').count()) === 0, 'the owner’s key is not printed with the cards');
check(
  !(await page.locator('.sealed-hero').isVisible()) && !(await page.locator('.todo').isVisible()) && (await page.locator('.print-card').first().isVisible()),
  'printing shows only the cards',
);
const wordsOf = (t) =>
  t
    .split('\n')
    .map((l) => l.replace(/^\d+\s*/, '').trim())
    .filter(Boolean)
    .join(' ');
const cardWords = await page.locator('.print-card:not(.print-key) .card-face:not(.seal-face) .word-grid').allInnerTexts();
const sealWords = await page.locator('.print-card .seal-face .word-grid').first().innerText();
await page.emulateMedia({ media: 'screen' });
await page.getByRole('button', { name: 'Print your key' }).click();
await page.emulateMedia({ media: 'print' });
check(
  (await page.locator('.print-key [aria-label^="Code for"]').count()) === 1 && (await page.locator('.print-card:not(.print-key)').count()) === 0,
  'the owner’s key prints on its own',
);
const keyWords = await page.locator('.print-key .word-grid').innerText();
await page.emulateMedia({ media: 'screen' });

// The jar file opens offline, and printed words open it
const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download the jar' }).click()]);
const jarPath = join(shots, 'jar.html');
await download.saveAs(jarPath);
await page.goto(`${app}#/watch`);
await settle(400);
await page.goto(`${app}#/seal`);
await settle(500);
check(await page.getByRole('heading', { name: /Sealed!/ }).isVisible(), 'the sealed cards survive a visit to another page');
const g = await context.newPage();
g.on('pageerror', (e) => errors.push(`jar file: ${e}`));
await g.goto(pathToFileURL(jarPath).href);
await g.waitForTimeout(1500);
check(await g.getByRole('heading', { name: 'Ada’s jar' }).isVisible(), 'the jar file opens straight into its séance');
await g.getByLabel(/The 30 words/).fill(wordsOf(keyWords));
check(await g.getByText(/owner’s own key, not a card/).isVisible(), 'the owner’s key typed at the séance is recognised, with where it does open the jar');
for (const words of cardWords.slice(0, 2)) {
  await g.getByLabel(/The 30 words/).fill(wordsOf(words));
  await g.getByRole('button', { name: 'Use this card' }).click();
  await g.waitForTimeout(500);
}
await g.getByText(/opened by/).waitFor({ timeout: 15000 });
check(await g.getByText('Be gentle with each other.').isVisible(), 'two typed cards open the jar file');
await g.getByRole('button', { name: 'Open with Charles’s seal' }).click();
await g.getByLabel(/The 17 words/).fill(wordsOf(sealWords));
await g.getByRole('button', { name: 'Open my letter' }).click();
await g.getByText('The engine was always yours.').waitFor({ timeout: 6000 });
check(true, 'the private seal opens its letter');

// The owner changes what is inside with their key; the same cards open the new words.
try {
  await g.goto(`${pathToFileURL(jarPath).href}#/seal?update`);
  await g.getByLabel(/The 28 words/).fill(wordsOf(keyWords));
  await g.getByRole('button', { name: 'Use my key' }).click();
  await g.getByRole('heading', { name: 'A note for everyone' }).waitFor({ timeout: 6000 });
  check((await g.getByLabel('Your note to everyone').inputValue()).includes('Be gentle with each other.'), 'the key opens the jar for its owner, words and all');
  await g.getByLabel('Your note to everyone').fill('Version two: the spare key moved to the blue bowl.');
  for (let i = 0; i < 3; i++) await g.getByRole('button', { name: /^Next/ }).click();
  await g.getByRole('button', { name: /^Almost done/ }).click();
  await g.getByRole('button', { name: 'Seal the new words' }).click();
  await g.getByRole('heading', { name: 'Updated!' }).waitFor({ timeout: 10000 });
  const [dl2] = await Promise.all([g.waitForEvent('download'), g.getByRole('button', { name: 'Download the jar' }).click()]);
  const jar2Path = join(shots, 'jar-v2.html');
  await dl2.saveAs(jar2Path);
  const h = await context.newPage();
  h.on('pageerror', (e) => errors.push(`updated jar file: ${e}`));
  await h.goto(pathToFileURL(jar2Path).href);
  await h.waitForTimeout(1200);
  for (const words of cardWords.slice(1, 3)) {
    await h.getByLabel(/The 30 words/).fill(wordsOf(words));
    await h.getByRole('button', { name: 'Use this card' }).click();
    await h.waitForTimeout(500);
  }
  await h.getByText(/opened by/).waitFor({ timeout: 15000 });
  check(await h.getByText('Version two: the spare key moved to the blue bowl.').isVisible(), 'after an update, the same printed cards open the new words');
  await h.close();

  // To change who holds the cards, the owner starts a new jar from the old one.
  await g.goto(`${pathToFileURL(jar2Path).href}#/seal?update`);
  await g.reload();
  await g.getByLabel(/The 28 words/).fill(wordsOf(keyWords));
  await g.getByRole('button', { name: 'Use my key' }).click();
  await g.getByRole('heading', { name: 'A note for everyone' }).waitFor({ timeout: 6000 });
  for (let i = 0; i < 3; i++) await g.getByRole('button', { name: /^Next/ }).click();
  await g.getByRole('button', { name: 'Start a new jar from this one' }).click();
  await g.getByRole('heading', { name: 'Who keeps the cards?' }).waitFor({ timeout: 6000 });
  await g.getByRole('button', { name: 'Remove Augustus' }).click();
  await g.getByRole('button', { name: /^Almost done/ }).click();
  check(await g.getByText(/A letter for/).isVisible(), 'a new jar from an old one keeps what was written, letters included');
  await g.getByRole('button', { name: 'Seal the jar' }).click();
  await g.getByRole('heading', { name: /Sealed!/ }).waitFor({ timeout: 10000 });
  check(
    (await g.getByText('Both cards are needed to open it. Print them now; you can’t later.').isVisible()) && (await g.getByText(/replaces your earlier one/).isVisible()),
    'the new jar has the new circle, and says what to do about the old cards',
  );
} catch (e) {
  check(false, `updating with the key: ${e.message}`);
}
await g.close();

// One click from the home page: June's jar, and three friends gathered for you.
await page.goto(`${app}#/seance?demo`);
await settle(1200);
await page.getByRole('button', { name: 'Pick three for me' }).click();
await page.getByText(/opened by/).waitFor({ timeout: 15000 });
check(true, 'one click gathers the demo circle and opens June’s jar');

// Demo séance
await page.goto(`${app}#/`);
await settle(300);
await page.goto(`${app}#/seance`);
await settle(1400);
await shot('10-seance-choose');
await page.getByRole('button', { name: /June’s jar/ }).click();
await settle(1800);
await shot('11-seance-circle');
await audit(page, 'seance');
const table = page.locator('.demo-card');
await table.nth(0).click();
await settle(1600);
await shot('12-seance-one', false);
await page.getByLabel(/The 30 words/).fill(demo.cards[2].sealWords);
check(await page.getByRole('button', { name: 'Use this card' }).isDisabled(), 'a seal cannot be offered as a card (word count)');
await table.nth(1).click();
await settle(1300);
await table.nth(3).click();
await settle(2000);
await page.evaluate(() => window.scrollTo(0, 0));
await shot('13-seance-waking', false);
await page.getByText(/opened by/).waitFor({ timeout: 15000 });
await settle(3000);
await shot('14-reveal');
await audit(page, 'reveal');
check(await page.getByText('If you are reading this, you found each other.').isVisible(), 'the demo jar opens with three cards');
await page.getByRole('button', { name: 'Open with Clara’s seal' }).click();
await page.getByRole('button', { name: /from the demo/ }).first().click();
await settle(2800);
await page.locator('.letter').first().scrollIntoViewIfNeeded();
await shot('15-letter', false);
check(await page.getByText('I always thought you were the brave one.').isVisible(), 'Clara’s seal opens Clara’s letter');

// Watch
await page.goto(`${app}#/watch`);
await settle(1200);
await shot('16-watch');
await audit(page, 'watch');
await page.getByRole('button', { name: 'Let time pass' }).click();
await page.getByText('I’ve asked your friends to check on you.').waitFor({ timeout: 30000 });
await page.getByRole('button', { name: 'Pause time' }).click();
await settle(1500);
await shot('17-watch-notified');
check(await page.locator('.status-pill.s-notified').isVisible(), 'the watch asks friends after the silence period');

// Guides
await page.goto(`${app}#/guides`);
await settle(1200);
await page.locator('.check').first().click();
await settle(600);
await shot('18-guides');
await audit(page, 'guides');

// Phone
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const p = await phone.newPage();
p.on('pageerror', (e) => errors.push(`phone: ${e}`));
await p.goto(app);
await p.waitForTimeout(2600);
await p.screenshot({ path: join(shots, '19-phone-home.png'), fullPage: true });
await p.goto(`${app}#/seance`);
await p.waitForTimeout(800);
await p.getByRole('button', { name: /June’s jar/ }).click();
await p.waitForTimeout(2000);
await p.screenshot({ path: join(shots, '20-phone-seance.png'), fullPage: true });
await p.goto(`${app}#/seal`);
await p.waitForTimeout(1200);
await p.screenshot({ path: join(shots, '21-phone-seal.png'), fullPage: true });

// Keyboard only: seal a jar, open June's jar and a letter, with no mouse at all.
{
  const kb = await context.newPage();
  kb.on('pageerror', (e) => errors.push(`keyboard: ${e}`));
  const k = kb.keyboard;
  const focused = () =>
    kb.evaluate(() => {
      const e = document.activeElement;
      return `${e.tagName.toLowerCase()} "${(e.getAttribute('aria-label') || e.textContent || e.getAttribute('placeholder') || '').trim()}"`;
    });
  const tabTo = async (re) => {
    for (let i = 0; i < 60; i++) {
      await k.press('Tab');
      if (re.test(await focused())) return;
    }
    throw new Error(`Tab never reached ${re}`);
  };
  const press = async (re, wait = 500) => {
    await tabTo(re);
    await k.press('Enter');
    await kb.waitForTimeout(wait);
  };
  try {
    await kb.goto(`${app}#/seal`);
    await kb.waitForTimeout(700);
    await k.type('Ada Lovelace');
    await press(/Next/);
    await tabTo(/^textarea/);
    await k.type('Be kind.');
    await press(/Next/);
    await press(/Next/);
    await press(/Next/);
    for (const n of ['Charles', 'Mary', 'Augustus']) {
      await tabTo(/input "Friend/);
      await k.type(n);
    }
    await press(/Almost done/, 700);
    await press(/Seal the jar/, 0);
    await kb.getByRole('heading', { name: /Sealed!/ }).waitFor({ timeout: 8000 });
    await kb.goto(`${app}#/seance`);
    await kb.waitForTimeout(700);
    await press(/June’s jar/, 900);
    for (let i = 0; i < 3; i++) await press(/button "\d\/5/, 900);
    await kb.getByText(/opened by/).waitFor({ timeout: 15000 });
    await press(/Open with .*seal/, 400);
    await press(/from the demo/, 0);
    await kb.locator('.letter').waitFor({ timeout: 5000 });
    check(true, 'the keyboard alone seals a jar, opens one and reads a letter');
  } catch (e) {
    check(false, `keyboard only: ${e.message}`);
  }
  await kb.close();
}

// The real watch: a local server with the watch service and a temporary outbox
const dataDir = mkdtempSync(join(tmpdir(), 'phylactery-e2e-'));
const port = 8700 + Math.floor(Math.random() * 200);
const server = spawn(process.execPath, ['--experimental-strip-types', join(root, 'server/dev.ts')], {
  env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, RESEND_API_KEY: '' },
  stdio: 'ignore',
});
try {
  const base = `http://localhost:${port}/`;
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}api/health`)).ok) break;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  const w = await context.newPage();
  w.on('pageerror', (e) => errors.push(`watch: ${e}`));
  await w.goto(`${base}#/watch`);
  await w.getByRole('button', { name: 'Start the watch' }).waitFor({ timeout: 5000 });
  await w.getByLabel('Your name').fill('Ada Lovelace');
  await w.getByLabel('Your email').fill('ada@example.com');
  await w.getByLabel('Friend 1 name').fill('Charles');
  await w.getByRole('button', { name: 'Start the watch' }).click();
  check(await w.getByText('Add Charles’s email.').isVisible(), 'a friend without an email is pointed out before anything is sent');
  await w.getByLabel('Friend 1 email').fill('charles@example.com');
  await w.getByRole('button', { name: 'Start the watch' }).click();
  await w.getByText('Check your inbox').waitFor();
  const outbox = await (await fetch(`${base}api/dev/outbox`)).json();
  check(outbox.length === 1 && outbox[0].to === 'ada@example.com', 'starting a watch emails only the owner, to confirm');
  await w.goto(base + /(#\/watch\?confirm=\S+)/.exec(outbox[0].text)[1]);
  await w.getByText('You’re all set!').waitFor({ timeout: 5000 });
  await w.screenshot({ path: join(shots, '22-watch-confirmed.png') });
  await w.goto(base + /(#\/watch\?manage=\S+)/.exec(outbox[0].text)[1]);
  await w.locator('.link-result').getByRole('button', { name: 'Pause, I’m away' }).click();
  await w.getByText('Paused. Nothing will be sent until you resume.').waitFor({ timeout: 5000 });
  check(true, 'the owner confirms and pauses a real watch from the emailed links');
  await w.locator('.kept-jar-actions input[type="file"]').setInputFiles(jarPath);
  await w.getByText(/A locked copy of your jar is kept: version 1/).waitFor({ timeout: 5000 });
  check(true, 'the owner gives the watch a locked copy of the jar file');
  await w.goto(`${base}#/seance?jar=notarealwatch.notarealsecretatall`);
  await w.getByText(/expired or was never valid/).waitFor({ timeout: 5000 });
  check(true, 'a dead link to a kept jar explains itself');
} catch (e) {
  check(false, `real watch flow: ${e}`);
} finally {
  server.kill();
  rmSync(dataDir, { recursive: true, force: true });
}

await browser.close();

for (const a of audits) console.log(`  a11y: ${a}`);
check(audits.length === 0, `no serious accessibility violations (${audits.length})`);
check(errors.length === 0, `no page errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
writeFileSync(join(shots, 'result.txt'), failures.length ? failures.join('\n') : 'all passed');
if (failures.length) {
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
