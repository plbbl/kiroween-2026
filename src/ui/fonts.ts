// Fonts are bundled into the page (no requests to a font CDN), so the app
// and every downloaded jar work offline and leak nothing. Only the Latin
// subset in woff2 is included to keep the single file small.

import cg500 from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2';
import cg500i from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2';
import cg600 from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2';
import eb400 from '@fontsource/eb-garamond/files/eb-garamond-latin-400-normal.woff2';
import eb400i from '@fontsource/eb-garamond/files/eb-garamond-latin-400-italic.woff2';
import eb500 from '@fontsource/eb-garamond/files/eb-garamond-latin-500-normal.woff2';
import plex400 from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2';

const faces: [family: string, weight: number, style: 'normal' | 'italic', url: string][] = [
  ['Cormorant Garamond', 500, 'normal', cg500],
  ['Cormorant Garamond', 500, 'italic', cg500i],
  ['Cormorant Garamond', 600, 'normal', cg600],
  ['EB Garamond', 400, 'normal', eb400],
  ['EB Garamond', 400, 'italic', eb400i],
  ['EB Garamond', 500, 'normal', eb500],
  ['IBM Plex Mono', 400, 'normal', plex400],
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
