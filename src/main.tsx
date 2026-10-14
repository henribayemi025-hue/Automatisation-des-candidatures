import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import ResetPassword from './pages/ResetPassword';
import { StoreProvider } from './lib/store';
import { CollabProvider } from './lib/collab';
import { ThemeProvider } from './lib/theme';
import { LangProvider } from './lib/i18n';
import { OfflineProvider } from './lib/offline';
import './index.css';
import { captureSource } from './lib/source';

captureSource();
import { capterPartage } from './lib/partage';

// Un message partagé depuis le téléphone arrive dans l'adresse. On le met de
// côté et on nettoie AVANT le rendu — sinon il reste dans l'historique du
// navigateur et un rechargement le rejouerait.
if (capterPartage()) {
  window.location.hash = '#/rattrapage';
}

// Lien « mot de passe oublié » : page à part, sans routeur ni synchronisation.
const resetting = window.location.pathname.startsWith('/auth/reset');

createRoot(document.getElementById('root')!).render(
  resetting ? (
    <React.StrictMode>
      <ThemeProvider>
        <LangProvider>
          <ResetPassword />
        </LangProvider>
      </ThemeProvider>
    </React.StrictMode>
  ) : (
  <React.StrictMode>
    <ThemeProvider>
      <OfflineProvider>
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
      </OfflineProvider>
    </ThemeProvider>
  </React.StrictMode>
  ),
);
