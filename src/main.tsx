import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { StoreProvider } from './lib/store';
import { CollabProvider } from './lib/collab';
import { ThemeProvider } from './lib/theme';
import { LangProvider } from './lib/i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <StoreProvider>
        <CollabProvider>
          {/* Monté ici, sous le magasin et la synchro : changer de langue
              re-rend l'application entière sans recharger les données. Sans ce
              fournisseur, FR / EN appelait une fonction vide — constaté par
              Beau le 12/09 : « je clique sur Français, rien ne se passe ». */}
          <LangProvider>
          <HashRouter>
            <App />
          </HashRouter>
          </LangProvider>
        </CollabProvider>
      </StoreProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
