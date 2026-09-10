import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { StoreProvider } from './lib/store';
import { CollabProvider } from './lib/collab';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <CollabProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </CollabProvider>
    </StoreProvider>
  </React.StrictMode>,
);
