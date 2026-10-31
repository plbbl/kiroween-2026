import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The whole app builds into one self-contained index.html. Sealing a jar
// copies that file and embeds the encrypted jar in it, so the jar can be
// opened offline, decades later, without this website.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 100_000_000,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
