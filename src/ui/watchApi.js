// Talking to the watch service, when this copy of Phylactery has one.
// The offline jar file and static hosts don't, and that's fine.
import { parseJar } from '../core/jar.ts';
/**
 * A jar sealed or updated a moment ago, handed to the watch page within
 * this visit so the owner need not choose the file again. Memory only.
 */
let handedOver = null;
export const jarHandoff = {
    give: (jar) => {
        handedOver = jar;
    },
    peek: () => handedOver,
};
export class ApiError extends Error {
}
async function call(path, body) {
    const res = await fetch(`api/${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({})));
    if (!res.ok)
        throw new ApiError(data.error ?? 'The watch service is not answering.');
    return data;
}
export async function watchAvailable() {
    if (location.protocol === 'file:')
        return false;
    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2500);
        const res = await fetch('api/health', { signal: ctrl.signal });
        clearTimeout(t);
        return res.ok && (await res.json()).service === 'phylactery-watch';
    }
    catch {
        return false;
    }
}
export const watchApi = {
    start: (body) => call('watch', body),
    keepJar: (token, jar) => call('watch/jar', { token, jar: jar ? JSON.stringify(jar) : null }),
    openJar: async (token) => parseJar((await call('watch/jar/open', { token })).jar),
    confirm: (token) => call('watch/confirm', { token }),
    checkin: (token) => call('watch/checkin', { token }),
    status: (token) => call('watch/status', { token }),
    pause: (token) => call('watch/pause', { token }),
    resume: (token) => call('watch/resume', { token }),
    remove: (token) => call('watch/delete', { token }),
    optOut: (token) => call('watch/optout', { token }),
};
