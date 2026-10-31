// The promise "nothing leaves your hands" is checked, not hoped for.
//
//   npm run check:offline
//
// Only two files may talk to a network: the app's client for its own watch
// service, and the watch service's mail adapter. Everything else, the
// cryptography above all, must not even contain a way to. The jar file's
// Content-Security-Policy (connect-src 'none') is the second fence.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const ALLOWED = new Set(['src/ui/watchApi.ts', 'src/watch-service/adapters.ts']);
const NETWORK = /\b(fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|navigator\.connection|importScripts)\b/;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.(ts|tsx|js|mjs)$/.test(name) && !/\.test\.ts$/.test(name)) yield path;
  }
}

const problems = [];
for (const path of files(join(root, 'src'))) {
  const rel = relative(root, path).split('\\').join('/');
  if (ALLOWED.has(rel)) continue;
  readFileSync(path, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (NETWORK.test(line) && !line.trim().startsWith('//')) problems.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
}

if (problems.length) {
  console.error(`Network access outside ${[...ALLOWED].join(' and ')}:\n${problems.join('\n')}`);
  // Exit code 2 lets a Kiro PreToolUse/PreTaskExec hook block the change.
  process.exit(2);
}
console.log('offline: only the watch client and the mail adapter can reach a network');
