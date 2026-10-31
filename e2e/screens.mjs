// Every screen and state, on a desktop and on a phone, for a visual review.
// Run after `npm run build`:
//
//   npm run screens                 both sizes, every part
//   npm run screens -- phone seance one size, one part (seal, update, seance, watch, guides, home, real)
//
// Screenshots go to e2e/screens/ (ignored by git). The e2e walk-through
// checks that things work; this is for looking at them.

import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const out = join(here, 'screens');
const sizes = process.argv[2] && process.argv[2] !== 'both' ? [process.argv[2]] : ['desk', 'phone'];
const part = process.argv[3] ?? 'all';
mkdirSync(out, { recursive: true });
const app = pathToFileURL(join(root, 'dist/index.html')).href;
const demo = JSON.parse(readFileSync(join(root, 'src/demo/demo.json'), 'utf8'));

const b = await chromium.launch();
// The owner's key from the seal part, for the update part.
let keyWords = '';
for (const which of sizes) {
  const phone = which === 'phone';
  const viewport = phone ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  const ctx = await b.newContext({ viewport, deviceScaleFactor: phone ? 2 : 1, acceptDownloads: true });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const wait = (ms) => p.waitForTimeout(ms);
  const pre = phone ? 'p' : 'd';
  const shot = (n, full = false) => p.screenshot({ path: `${out}/${pre}-${n}.png`, fullPage: full });
  const to = async (sel, dy = -100) => {
    await p.locator(sel).first().scrollIntoViewIfNeeded();
    await p.evaluate((d) => window.scrollBy(0, d), dy);
    await wait(450);
  };
  const next = () => p.getByRole('button', { name: /^(Next|Almost done)/ }).click();

  if (part === 'all' || part === 'seal') {
    await p.goto(app + '#/seal');
    await wait(900);
    await shot('s1-empty');
    await p.getByLabel('Your name').fill('Ada Lovelace');
    await next();
    await wait(600);
    await shot('s2-note');
    await p.getByLabel('Your note to everyone').fill('If you are reading this, thank you for coming.\n\nBe gentle with each other.');
    await next();
    await wait(600);
    await p.getByRole('button', { name: '+ Password manager' }).click();
    await p.getByPlaceholder('Login, and where the password is').fill('master password in the red notebook');
    await p.getByRole('button', { name: '+ Add a place' }).click();
    await p.getByPlaceholder('Will, deed, insurance, spare key…').fill('Will');
    await p.getByPlaceholder('Blue folder, top drawer of the desk').fill('Blue folder, top drawer');
    await wait(600);
    await shot('s3-things');
    await next();
    await wait(600);
    await p.getByLabel('The farewell').fill('Something brief, with music.');
    await shot('s4-wishes');
    await next();
    await wait(700);
    await shot('s5-circle');
    await p.getByPlaceholder('Friend 1').fill('Charles');
    await p.getByPlaceholder('Friend 2').fill('Charles');
    await wait(400);
    await to('.threshold', -300);
    await shot('s5-error');
    await p.getByPlaceholder('Friend 2').fill('Mary');
    await p.getByPlaceholder('Friend 3').fill('Augustus');
    await p.getByRole('button', { name: '+ Letter' }).first().click();
    await p.getByPlaceholder('Dear Charles,').fill('Dear Charles,\n\nThe engine was always yours.');
    await p.getByRole('radio', { name: '2 cards' }).click();
    await wait(700);
    await p.evaluate(() => window.scrollTo(0, 0));
    await wait(300);
    await shot('s5-filled');
    await next();
    await wait(900);
    await shot('s6-ready');
    await p.getByRole('button', { name: 'Seal the jar' }).evaluate((el) => el.click());
    await wait(300);
    await shot('s6-cork');
    await wait(450);
    await shot('s6-wax');
    await p.getByRole('heading', { name: /Sealed!/ }).waitFor({ timeout: 10000 });
    await wait(600);
    await shot('s7-sealed-checking');
    await wait(2000);
    await shot('s7-sealed');
    await to('.fan', -60);
    await shot('s7-cards');
    await to('.todo', -120);
    await shot('s7-steps');
    await p.emulateMedia({ media: 'print' });
    await wait(500);
    await p.screenshot({ path: `${out}/${pre}-s8-print.png`, fullPage: true });
    keyWords = (await p.locator('.print-key .word-grid').innerText())
      .split('\n')
      .map((l) => l.replace(/^\d+\s*/, '').trim())
      .filter(Boolean)
      .join(' ');
    await p.emulateMedia({ media: 'screen' });
    if (!phone) {
      const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Download the jar' }).click()]);
      await dl.saveAs(join(out, 'jar.html'));
    }
  }

  if ((part === 'all' || part === 'update') && keyWords) {
    // The owner changes what is inside the jar they just sealed (opened from its jar file).
    const jarFile = join(out, 'jar.html');
    const u = await ctx.newPage();
    await u.goto(`${phone ? app : pathToFileURL(jarFile).href}#/seal?update`);
    await u.waitForTimeout(800);
    await u.screenshot({ path: `${out}/${pre}-u1-open.png` });
    if (!phone) {
      await u.getByLabel(/The 28 words/).fill(keyWords);
      await u.getByRole('button', { name: 'Use my key' }).click();
      await u.getByRole('heading', { name: 'A note for everyone' }).waitFor();
      await u.waitForTimeout(500);
      await u.screenshot({ path: `${out}/${pre}-u2-wizard.png` });
      for (let i = 0; i < 3; i++) await u.getByRole('button', { name: /^Next/ }).click();
      await u.waitForTimeout(600);
      await u.screenshot({ path: `${out}/${pre}-u3-circle.png` });
      await u.getByRole('button', { name: /^Almost done/ }).click();
      await u.getByRole('button', { name: 'Seal the new words' }).click();
      await u.getByRole('heading', { name: 'Updated!' }).waitFor({ timeout: 10000 });
      await u.waitForTimeout(1500);
      await u.screenshot({ path: `${out}/${pre}-u4-updated.png`, fullPage: true });
    }
    await u.close();
  }

  if (part === 'all' || part === 'seance') {
    await p.goto(app + '#/seance');
    await wait(900);
    await shot('c1-choose');
    await p.getByRole('button', { name: /June’s jar/ }).click();
    await wait(1200);
    await shot('c2-circle');
    await to('.offer-card', -80);
    await shot('c3-table');
    await p.getByPlaceholder('first second third …').fill('apple banana cherry');
    await p.getByRole('button', { name: 'Offer this card' }).click().catch(() => {});
    await wait(500);
    await to('.card-input', -60);
    await shot('c4-typing-error');
    await p.getByPlaceholder('first second third …').fill('');
    await p.locator('.demo-card').nth(0).click();
    await wait(250);
    await shot('c5-picked');
    await wait(1400);
    await p.evaluate(() => window.scrollTo(0, 0));
    await wait(900);
    await shot('c6-one-lit');
    await p.locator('.demo-card').nth(1).click();
    await wait(1400);
    await p.locator('.demo-card').nth(3).click();
    await wait(700);
    await p.evaluate(() => window.scrollTo(0, 0));
    await wait(700);
    await shot('c7-waking');
    await wait(1700);
    await shot('c8-open');
    await p.getByText(/opened by/).waitFor({ timeout: 10000 });
    await wait(2500);
    await shot('r1-top');
    await to('.account-list', -160);
    await shot('r2-accounts');
    await to('.wish-cards', -160);
    await shot('r3-wishes');
    await to('.envelopes', -200);
    await shot('r4-letters');
    await p.getByRole('button', { name: 'Open with Ben’s seal' }).click();
    await wait(500);
    const ben = demo.cards.find((c) => c.name.startsWith('Ben'));
    await p.locator('.envelope-input textarea').fill(ben.shard);
    await p.locator('.envelope-input').getByRole('button', { name: /^Open/ }).click().catch(() => {});
    await wait(500);
    await to('.envelope-input', -160);
    await shot('r5-seal-wrong');
    await p.getByRole('button', { name: /from the demo/ }).first().click();
    await wait(2800);
    await to('.letter', -160);
    await shot('r6-letter');
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await wait(500);
    await shot('r7-end');
  }

  if (part === 'all' || part === 'watch') {
    await p.goto(app + '#/watch');
    await wait(900);
    await shot('w1-top');
    await to('.watch-grid', -110);
    await shot('w2-grid');
    await p.getByRole('button', { name: 'Let time pass' }).click();
    await p.getByText('Hello? Just tap to say you’re okay.').waitFor({ timeout: 30000 });
    await p.getByRole('button', { name: 'Pause time' }).click();
    await wait(700);
    await shot('w3-reminding');
    await p.getByRole('button', { name: 'Let time pass' }).click();
    await p.getByText('I’ve asked your friends to check on you.').waitFor({ timeout: 30000 });
    await p.getByRole('button', { name: 'Pause time' }).click();
    await wait(700);
    await p.evaluate(() => window.scrollTo(0, 0));
    await wait(400);
    await shot('w4-notified');
    await p.getByRole('button', { name: /Knock knock/ }).click();
    await wait(900);
    await p.evaluate(() => window.scrollTo(0, 0));
    await wait(400);
    await shot('w5-relieved');
    await to('.inbox', -110);
    await shot('w6-inbox');
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await wait(400);
    await shot('w7-end');
  }

  if (part === 'all' || part === 'guides') {
    await p.goto(app + '#/guides');
    await wait(900);
    await shot('g1-top');
    await p.locator('.check input').first().check({ force: true });
    await p.locator('.check input').nth(1).check({ force: true });
    await wait(600);
    await to('.check', -200);
    await shot('g2-checked');
    await p.goto(app + '#/guides#after');
    await wait(900);
    await shot('g3-after');
    await p.goto(app + '#/nowhere');
    await wait(900);
    await shot('g4-unknown');
  }

  if (part === 'all' || part === 'home') {
    await p.goto(app);
    await wait(2600);
    await shot('h1');
    for (let i = 2; i <= 4; i++) {
      await p.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
      await wait(700);
      await shot(`h${i}`);
    }
    const rm = await b.newContext({ viewport, deviceScaleFactor: phone ? 2 : 1, reducedMotion: 'reduce' });
    const q = await rm.newPage();
    await q.goto(app + '#/seance');
    await q.waitForTimeout(600);
    await q.getByRole('button', { name: /June’s jar/ }).click();
    await q.waitForTimeout(600);
    for (let i = 0; i < 3; i++) await q.locator('.demo-card').nth(i).click();
    await q.waitForTimeout(2600);
    await q.evaluate(() => window.scrollTo(0, 0));
    await q.screenshot({ path: `${out}/${pre}-m1-reduced-open.png` });
    await rm.close();
  }

  if (part === 'all' || part === 'real') {
    const dataDir = mkdtempSync(join(tmpdir(), 'phy-audit-'));
    const port = 8960 + (phone ? 1 : 0);
    const server = spawn(process.execPath, ['--experimental-strip-types', join(root, 'server/dev.ts')], {
      env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, RESEND_API_KEY: '' },
      stdio: 'ignore',
    });
    const base = `http://localhost:${port}/`;
    try {
      for (let i = 0; i < 50; i++) {
        try {
          if ((await fetch(`${base}api/health`)).ok) break;
        } catch {}
        await new Promise((r) => setTimeout(r, 100));
      }
      await p.goto(`${base}#/watch`);
      await p.getByRole('button', { name: 'Start the watch' }).waitFor();
      await to('.start-watch', -100);
      await shot('x1-form');
      await p.getByLabel('Your email').fill('not an email');
      await wait(300);
      await shot('x2-form-error');
      await p.getByLabel('Your name').fill('Ada Lovelace');
      await p.getByLabel('Your email').fill('ada@example.com');
      await p.getByLabel('Friend 1 name').fill('Charles');
      await p.getByLabel('Friend 1 email').fill('charles@example.com');
      await p.getByRole('button', { name: 'Start the watch' }).click();
      await p.getByText('Check your inbox').waitFor();
      await wait(900);
      await to('.start-watch', -100);
      await shot('x3-sent');
      const outbox = await (await fetch(`${base}api/dev/outbox`)).json();
      const link = (k) => base + new RegExp(`(#\\/watch\\?${k}=\\S+)`).exec(outbox[0].text)[1];
      await p.goto(link('confirm'));
      await p.getByText('You’re all set!').waitFor();
      await wait(900);
      await shot('x4-confirmed');
      await p.goto(link('manage'));
      await wait(1400);
      await shot('x5-manage');
      await p.goto(`${base}#/watch?here=nonsense.token`);
      await wait(1400);
      await shot('x6-bad-link');
    } finally {
      server.kill();
      rmSync(dataDir, { recursive: true, force: true });
    }
  }

  if (!phone && (part === 'all' || part === 'jarfile')) {
    try {
      const g = await ctx.newPage();
      await g.goto(pathToFileURL(join(out, 'jar.html')).href);
      await g.waitForTimeout(1500);
      await g.screenshot({ path: `${out}/${pre}-j1-jarfile.png` });
    } catch (e) {
      console.log('no jar file', e.message);
    }
  }

  console.log(`${which}: ${errors.length ? `page errors:\n${errors.join('\n')}` : 'no page errors'}`);
  await ctx.close();
}
await b.close();
console.log(`screenshots in ${out}`);
