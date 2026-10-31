import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { installFonts } from './ui/fonts.ts';
import { capturePristinePage } from './ui/grimoire.ts';
import './ui/styles.css';
import './ui/pages.css';

capturePristinePage();
installFonts();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
