// Talking to the watch service, when this copy of Phylactery has one.
// The offline jar file and static hosts don't, and that's fine.

import { parseJar, type JarFile } from '../core/jar.ts';
import type { WatchConfig, WatchStatus } from '../core/watch.ts';

export interface WatchView {
  owner: string;
  confirmed: boolean;
  status: WatchStatus;
  config: WatchConfig;
  holders: string[];
  lastSign: string | null;
  nextAsk: string | null;
  jar: { owner: string; revision: number; sealedAt: string; keptAt: string } | null;
}

/**
 * A jar sealed or updated a moment ago, handed to the watch page within
 * this visit so the owner need not choose the file again. Memory only.
 */
let handedOver: JarFile | null = null;
export const jarHandoff = {
  give: (jar: JarFile) => {
    handedOver = jar;
  },
  peek: () => handedOver,
};

export class ApiError extends Error {}

async function call<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`api/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(data.error ?? 'The watch service is not answering.');
  return data as T;
}

export async function watchAvailable(): Promise<boolean> {
  if (location.protocol === 'file:') return false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch('api/health', { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok && ((await res.json()) as { service?: string }).service === 'phylactery-watch';
  } catch {
    return false;
  }
}

export const watchApi = {
  start: (body: { owner: { name: string; email: string }; holders: { name: string; email: string }[]; config: WatchConfig; jar?: string }) =>
    call<{ id: string }>('watch', body),
  keepJar: (token: string, jar: JarFile | null) => call<WatchView>('watch/jar', { token, jar: jar ? JSON.stringify(jar) : null }),
  openJar: async (token: string) => parseJar((await call<{ jar: string }>('watch/jar/open', { token })).jar),
  confirm: (token: string) => call<WatchView>('watch/confirm', { token }),
  checkin: (token: string) => call<WatchView>('watch/checkin', { token }),
  status: (token: string) => call<WatchView>('watch/status', { token }),
  pause: (token: string) => call<WatchView>('watch/pause', { token }),
  resume: (token: string) => call<WatchView>('watch/resume', { token }),
  remove: (token: string) => call<{ ok: true }>('watch/delete', { token }),
  optOut: (token: string) => call<{ owner: string }>('watch/optout', { token }),
};
