// The watch service over HTTP, using the standard Request and Response
// types, so the same handler runs in Node, Netlify, Deno or a worker.
//
//   GET    /api/health
//   POST   /api/watch            { owner, holders, config }  start (sends a confirmation email)
//   POST   /api/watch/confirm    { token }
//   POST   /api/watch/checkin    { token }                   "I'm still here"
//   POST   /api/watch/status     { token }                   the owner's view
//   POST   /api/watch/pause      { token }
//   POST   /api/watch/resume     { token }
//   POST   /api/watch/delete     { token }
//   POST   /api/watch/optout     { token }                   a friend leaves a watch
//   POST   /api/watch/resend     { email }                   a new manage link, to the owner's address
//   POST   /api/watch/jar        { token, jar }              the owner keeps (or, with jar: null, removes) a locked copy
//   POST   /api/watch/jar/open   { token }                   a friend's link opens the kept copy
//   POST   /api/watch/tick       (header x-tick-secret)      send what is due
//
// Tokens travel in request bodies, never in URLs the server logs.

import { checkin, confirm, createWatch, fetchJar, keepJar, MAX_JAR_CHARS, optOut, remove, resendManage, setPaused, status, tick, WatchError, type Deps } from './service.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export async function handle(req: Request, deps: Deps, tickSecret?: string): Promise<Response> {
  const path = new URL(req.url).pathname.replace(/\/+$/, '');
  try {
    if (path === '/api/health') return json({ ok: true, service: 'phylactery-watch' });
    if (req.method !== 'POST') return json({ error: 'Not found.' }, 404);
    const text = await req.text();
    // Requests that carry a jar may be bigger; nothing else needs to be.
    const limit = path === '/api/watch' || path === '/api/watch/jar' ? MAX_JAR_CHARS + 20_000 : 20_000;
    if (text.length > limit) return json({ error: 'Too large.' }, 413);
    let body: { token?: unknown; jar?: unknown; email?: unknown } = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      return json({ error: 'Not JSON.' }, 400);
    }
    switch (path) {
      case '/api/watch':
        return json(await createWatch(deps, body), 201);
      case '/api/watch/confirm':
        return json(await confirm(deps, body.token));
      case '/api/watch/checkin':
        return json(await checkin(deps, body.token));
      case '/api/watch/status':
        return json(await status(deps, body.token));
      case '/api/watch/pause':
        return json(await setPaused(deps, body.token, true));
      case '/api/watch/resume':
        return json(await setPaused(deps, body.token, false));
      case '/api/watch/delete':
        await remove(deps, body.token);
        return json({ ok: true });
      case '/api/watch/optout':
        return json(await optOut(deps, body.token));
      case '/api/watch/resend':
        return json(await resendManage(deps, body.email));
      case '/api/watch/jar':
        return json(await keepJar(deps, body.token, body.jar));
      case '/api/watch/jar/open':
        return json(await fetchJar(deps, body.token));
      case '/api/watch/tick':
        if (!tickSecret || req.headers.get('x-tick-secret') !== tickSecret) return json({ error: 'Forbidden.' }, 403);
        return json(await tick(deps));
      default:
        return json({ error: 'Not found.' }, 404);
    }
  } catch (e) {
    if (e instanceof WatchError) return json({ error: e.message }, e.status);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}
