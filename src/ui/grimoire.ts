// The Grimoire: this very app, saved as one HTML file, with a sealed jar
// inside it. It runs without a network and can be kept anywhere, because
// the jar in it is encrypted.

import { parseJar, type JarFile } from '../core/jar.ts';

let pristine: string | null = null;

/** Call before React renders: keeps a copy of the untouched page. */
export function capturePristinePage(): void {
  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  clone.querySelector('#phylactery-jar')?.remove();
  clone.querySelector('meta[http-equiv="Content-Security-Policy"]')?.remove();
  const root = clone.querySelector('#root');
  if (root) root.innerHTML = '';
  pristine = '<!doctype html>\n' + clone.outerHTML;
}

export function canMakeGrimoire(): boolean {
  // In development the page loads its code from the dev server, so a copy
  // would not work offline. Only a production build is self-contained.
  return !!pristine && !import.meta.env.DEV;
}

const CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src blob: mediastream:; connect-src 'none'; form-action 'none'; base-uri 'none'";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/**
 * Where this copy of Phylactery lives, for a card or a file found years
 * later. Empty when running from a file, which has no address to give.
 */
export function homeAddress(): string {
  if (typeof location === 'undefined' || !/^https?:$/.test(location.protocol)) return '';
  return (location.host + location.pathname).replace(/\/index\.html$/, '/').replace(/\/$/, '');
}

export function makeGrimoire(jar: JarFile): string {
  if (!pristine) throw new Error('The page was not captured.');
  const home = homeAddress();
  const json = JSON.stringify(jar).replace(/</g, '\\u003c');
  const head =
    `<meta http-equiv="Content-Security-Policy" content="${CSP}">\n` +
    `<script id="phylactery-jar" type="application/json">${json}</script>\n`;
  return pristine
    .replace('use the Phylactery website instead', home ? `go to ${escapeHtml(home)} instead` : 'use the Phylactery website instead')
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(jar.owner)}’s jar · Phylactery</title>`)
    .replace(/<head>/i, `<head>\n${head}`);
}

/** Read a jar from a jar file (this app as HTML) or from its bare JSON. */
export function jarFromText(text: string): JarFile {
  const inner = /<script id="phylactery-jar" type="application\/json">([\s\S]*?)<\/script>/.exec(text)?.[1];
  return parseJar(inner ?? text);
}

export function download(filename: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function safeFilename(name: string): string {
  return name.replace(/[^\p{L}\p{N} ._,'’()-]/gu, '').trim() || 'Phylactery';
}
