// Netlify: the watch service at /api/*. Needs the environment variables
// RESEND_API_KEY, MAIL_FROM (e.g. "Phylactery <watch@your.domain>"),
// TICK_SECRET (any long random string) and URL (set by Netlify).
import { getStore } from '@netlify/blobs';
import { ResendMailer } from '../../src/watch-service/adapters.ts';
import { handle } from '../../src/watch-service/http.ts';
import type { WatchRecord, WatchStore } from '../../src/watch-service/service.ts';

export function blobStore(): WatchStore {
  const blobs = getStore({ name: 'watches', consistency: 'strong' });
  return {
    get: async (id) => ((await blobs.get(id, { type: 'json' })) as WatchRecord | null) ?? null,
    put: async (r) => void (await blobs.setJSON(r.id, r)),
    delete: async (id) => void (await blobs.delete(id)),
    ids: async () => (await blobs.list()).blobs.map((b) => b.key),
  };
}

export function deps() {
  return {
    store: blobStore(),
    mailer: new ResendMailer(process.env.RESEND_API_KEY ?? '', process.env.MAIL_FROM ?? ''),
    now: () => Date.now(),
    baseUrl: process.env.URL ?? 'http://localhost:8888/',
  };
}

export default async (req: Request) => handle(req, deps(), process.env.TICK_SECRET);

export const config = { path: '/api/*' };
