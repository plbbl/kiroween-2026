// A small local server: the built app plus the watch service.
//
//   npm run build && npm run serve        then open http://localhost:8787
//
// Mail is not sent: it is printed and kept in .data/outbox.json, and can be
// read at /api/dev/outbox (and the newest as HTML at /api/dev/mail). Watches are kept in .data/watches.json.
// With RESEND_API_KEY and MAIL_FROM set, real email is sent instead.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { OutboxMailer, ResendMailer } from '../src/watch-service/adapters.ts';
import { handle } from '../src/watch-service/http.ts';
import { mailHtml } from '../src/watch-service/mail-html.ts';
import { tick, type Mail, type Mailer, type WatchRecord, type WatchStore } from '../src/watch-service/service.ts';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const data = process.env.DATA_DIR ?? join(root, '.data');
mkdirSync(data, { recursive: true });
const port = Number(process.env.PORT ?? 8787);
const baseUrl = process.env.BASE_URL ?? `http://localhost:${port}/`;

class FileStore implements WatchStore {
  private file = join(data, 'watches.json');
  private read(): Record<string, WatchRecord> {
    return existsSync(this.file) ? JSON.parse(readFileSync(this.file, 'utf8')) : {};
  }
  async get(id: string) {
    return this.read()[id] ?? null;
  }
  async put(record: WatchRecord) {
    const all = this.read();
    all[record.id] = record;
    writeFileSync(this.file, JSON.stringify(all, null, 2));
  }
  async delete(id: string) {
    const all = this.read();
    delete all[id];
    writeFileSync(this.file, JSON.stringify(all, null, 2));
  }
  async ids() {
    return Object.keys(this.read());
  }
}

class LocalMailer implements Mailer {
  private outbox = new OutboxMailer();
  async send(mail: Mail) {
    await this.outbox.send(mail);
    writeFileSync(join(data, 'outbox.json'), JSON.stringify(this.outbox.sent, null, 2));
    console.log(`\n✉  to ${mail.to}: ${mail.subject}\n${mail.text}`);
  }
  get sent() {
    return this.outbox.sent;
  }
}

const local = new LocalMailer();
const mailer: Mailer = process.env.RESEND_API_KEY && process.env.MAIL_FROM ? new ResendMailer(process.env.RESEND_API_KEY, process.env.MAIL_FROM) : local;
const deps = { store: new FileStore(), mailer, now: () => Date.now(), baseUrl };
const tickSecret = process.env.TICK_SECRET ?? 'local';

const TYPES: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css' };

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', baseUrl);
  if (url.pathname === '/api/dev/outbox') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(local.sent));
    return;
  }
  // The newest mail as the HTML part a mail app would show; ?n=2 for the one before.
  if (url.pathname === '/api/dev/mail') {
    const mail = local.sent[local.sent.length - Number(url.searchParams.get('n') ?? 1)];
    res.writeHead(mail ? 200 : 404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(mail ? mailHtml(mail) : 'No mail yet.');
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(url, { method: req.method, headers: req.headers as Record<string, string>, body: req.method === 'GET' ? undefined : body });
    const response = await handle(request, deps, tickSecret);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }
  const file = normalize(join(dist, url.pathname === '/' ? 'index.html' : url.pathname));
  if (!file.startsWith(dist) || !existsSync(file)) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`Phylactery on ${baseUrl} (watch service on, mail ${mailer === local ? 'to .data/outbox.json' : 'via Resend'})`));

// The schedule: check once a minute what is due.
setInterval(() => void tick(deps).catch((e) => console.error('tick failed', e)), 60_000);
