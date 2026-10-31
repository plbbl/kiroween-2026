// End-to-end walk through the built app with Playwright, saving a
// screenshot of every important state. Run after `npm run build`:
//
//   npm run e2e            screenshots go to e2e/shots/
//
// It opens dist/index.html straight from disk, the same way a downloaded
// Grimoire is opened, so it also proves the app needs no server.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Playwright may be installed globally rather than in this project.
const { chromium } = createRequire(import.meta.url)('playwright');

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
const page = await context.newPage();
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const shot = (name, full = true) => page.screenshot({ path: join(shots, `${name}.png`), fullPage: full });
const settle = (ms = 1800) => page.waitForTimeout(ms);

// Home
await page.goto(app);
await settle(2600);
await shot('01-home');
check(await page.getByRole('heading', { name: 'Phylactery' }).isVisible(), 'home shows the title');

// Seal a vessel
await page.goto(`${app}#/seal`);
await settle(800);
await page.getByLabel('Your name').fill('Ada Lovelace');
await shot('02-seal-name', false);
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByLabel('Your message to everyone').fill('If you are reading this, thank you for coming.\n\nBe gentle with each other.');
await settle(600);
await shot('03-seal-message', false);
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: 'Add an account' }).click();
await page.getByPlaceholder('Email, bank, photos…').fill('Password manager');
await page.getByPlaceholder('Login, where the password is').fill('master password: engine-of-difference');
await page.getByRole('button', { name: 'Add a place' }).click();
await page.getByPlaceholder('Will, deed, insurance, spare key…').fill('Notebooks');
await page.getByPlaceholder('Blue folder, top drawer of the desk').fill('The cedar chest');
await settle(600);
await shot('04-seal-leave', false);
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByLabel('The farewell').fill('Something brief, with music.');
await page.getByRole('button', { name: 'Continue' }).click();
const names = ['Charles', 'Mary', 'Augustus'];
const nameInputs = page.getByPlaceholder('Their name');
for (let i = 0; i < names.length; i++) await nameInputs.nth(i).fill(names[i]);
await page.getByRole('button', { name: 'Write them a letter' }).first().click();
await page.getByPlaceholder('Dear Charles,').fill('Dear Charles,\n\nThe engine was always yours.');
await page.getByRole('radio', { name: '2 cards' }).click();
await settle(1200);
await shot('05-seal-circle');
await page.getByRole('button', { name: 'Continue' }).click();
await settle(1000);
await shot('06-seal-press');
await page.getByRole('button', { name: 'Press the seal' }).click();
await page.getByText('3 cards were made').waitFor({ timeout: 10000 });
await settle(2600);
await shot('07-sealed');
check(await page.getByText('3 cards were made').isVisible(), 'sealing makes three cards');

// Printed cards
await page.emulateMedia({ media: 'print' });
await settle(800);
await shot('08-print-cards');
const qrTexts = await page.locator('.print-card [aria-label^="Code for"]').count();
check(qrTexts === 6, 'each printed card has a shard code and a seal code');
const shardWords = await page.locator('.shard-face .word-grid').first().innerText();
const sealWords = await page.locator('.seal-face .word-grid').first().innerText();
const wordsOf = (t) => t.split('\n').map((l) => l.replace(/^\d+\s*/, '').trim()).filter(Boolean).join(' ');
await page.emulateMedia({ media: 'screen' });

// The Grimoire opens offline and the printed words open it
const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download the Grimoire' }).click()]);
const grimoirePath = join(shots, 'grimoire.html');
await download.saveAs(grimoirePath);
const g = await context.newPage();
g.on('pageerror', (e) => errors.push(`grimoire: ${e}`));
await g.goto(pathToFileURL(grimoirePath).href);
await g.waitForTimeout(1500);
check(await g.getByRole('heading', { name: 'The Phylactery of Ada Lovelace' }).isVisible(), 'the Grimoire opens straight into its séance');
const cards = await page.locator('.shard-face .word-grid').allInnerTexts();
for (const words of cards.slice(0, 2)) {
  await g.getByLabel(/The 30 words/).fill(wordsOf(words));
  await g.getByRole('button', { name: 'Offer this card' }).click();
  await g.waitForTimeout(400);
}
await g.getByText('Opened by').waitFor({ timeout: 15000 });
check(await g.getByText('Be gentle with each other.').isVisible(), 'two typed cards open the Grimoire');
await g.getByRole('button', { name: 'Break with your seal' }).click();
await g.getByLabel(/The 17 words/).fill(wordsOf(sealWords));
await g.getByRole('button', { name: 'Break this seal' }).click();
await g.getByText('The engine was always yours.').waitFor({ timeout: 5000 });
check(true, 'the personal seal opens its letter');
await g.close();
void shardWords;

// Demo séance
await page.goto(`${app}#/seance`);
await settle(1600);
await shot('09-seance-choose');
await page.getByRole('button', { name: /The demonstration vessel/ }).click();
await settle(2200);
await shot('10-seance-circle');
const table = page.locator('.demo-card');
await table.nth(0).click();
await settle(1500);
await shot('11-seance-one-lit');
// A wrong card is refused: the seal of a card, offered as a shard
await page.getByLabel(/The 30 words/).fill(demo.cards[2].sealWords);
check((await page.getByRole('button', { name: 'Offer this card' }).isDisabled()), 'a seal cannot be offered as a shard (word count)');
await table.nth(1).click();
await settle(1200);
await table.nth(3).click();
await settle(2300);
await shot('12-seance-opening', false);
await page.getByText('Opened by').waitFor({ timeout: 15000 });
await settle(3500);
await shot('13-reveal');
check(await page.getByText('If you are reading this, you found each other.').isVisible(), 'the demo vessel opens with three cards');
await page.getByRole('button', { name: 'Break with your seal' }).first().click();
await page.getByRole('button', { name: /from the demo/ }).first().click();
await settle(2600);
await shot('14-letter');
check(await page.getByText('I always thought you were the brave one.').isVisible(), 'Clara’s seal opens Clara’s letter');

// Watch
await page.goto(`${app}#/watch`);
await settle(1200);
await shot('15-watch');
await page.getByRole('button', { name: 'Let time pass' }).click();
await page.getByText('Your circle has been asked to check on you.').waitFor({ timeout: 30000 });
await page.getByRole('button', { name: 'Hold time' }).click();
await settle(1600);
await shot('16-watch-notified');
const border = await page.evaluate(() => getComputedStyle(document.querySelector('.frame')).borderTopWidth);
check(parseFloat(border) >= 12, `the mourning border widens when the circle is asked (${border})`);

// Guides
await page.goto(`${app}#/guides`);
await settle(1200);
await shot('17-guides');

// Phone
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const p = await phone.newPage();
p.on('pageerror', (e) => errors.push(`phone: ${e}`));
await p.goto(app);
await p.waitForTimeout(2600);
await p.screenshot({ path: join(shots, '18-phone-home.png'), fullPage: true });
await p.goto(`${app}#/seance`);
await p.waitForTimeout(800);
await p.getByRole('button', { name: /The demonstration vessel/ }).click();
await p.waitForTimeout(2000);
await p.screenshot({ path: join(shots, '19-phone-seance.png'), fullPage: true });

await browser.close();

check(errors.length === 0, `no page errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
writeFileSync(join(shots, 'result.txt'), failures.length ? failures.join('\n') : 'all passed');
if (failures.length) {
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
