// Fonts are bundled into the page (no requests to a font CDN), so the app
// and every downloaded jar work offline and leak nothing. Only the Latin
// subset in woff2 is included to keep the single file small.

import fredoka500 from '@fontsource/fredoka/files/fredoka-latin-500-normal.woff2';
import fredoka600 from '@fontsource/fredoka/files/fredoka-latin-600-normal.woff2';
import mono400 from '@fontsource/fragment-mono/files/fragment-mono-latin-400-normal.woff2';
import nunito400 from '@fontsource/nunito/files/nunito-latin-400-normal.woff2';
import nunito400i from '@fontsource/nunito/files/nunito-latin-400-italic.woff2';
import nunito700 from '@fontsource/nunito/files/nunito-latin-700-normal.woff2';
import nunito800 from '@fontsource/nunito/files/nunito-latin-800-normal.woff2';

const faces: [family: string, weight: number, style: 'normal' | 'italic', url: string][] = [
  ['Fredoka', 500, 'normal', fredoka500],
  ['Fredoka', 600, 'normal', fredoka600],
  ['Nunito', 400, 'normal', nunito400],
  ['Nunito', 400, 'italic', nunito400i],
  ['Nunito', 700, 'normal', nunito700],
  ['Nunito', 800, 'normal', nunito800],
  ['Fragment Mono', 400, 'normal', mono400],
];

export function installFonts(): void {
  const css = faces
    .map(
      ([family, weight, style, url]) =>
        `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};font-display:swap;src:url(${url}) format('woff2');}`,
    )
    .join('\n');
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
}
