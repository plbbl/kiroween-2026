import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The hosted page may only talk to its own origin. A downloaded Grimoire
// replaces this with a stricter policy that allows no network at all
// (see src/ui/grimoire.ts).
const HOSTED_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob: mediastream:; connect-src 'self'; form-action 'none'; base-uri 'none'";

const csp: Plugin = {
  name: 'phylactery-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${HOSTED_CSP}" />`),
};

// The whole app builds into one self-contained index.html. Sealing a jar
// copies that file and embeds the encrypted jar in it, so the jar can be
// opened offline, decades later, without this website.
export default defineConfig({
  plugins: [react(), viteSingleFile(), csp],
  build: {
    target: 'es2022',
    assetsInlineLimit: 100_000_000,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
