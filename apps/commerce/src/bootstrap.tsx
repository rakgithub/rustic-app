import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'design-tokens/theme.css';
import { initializeTheme } from 'design-tokens';
import { App } from './App';

initializeTheme();

const container = document.getElementById('root');
if (!container) throw new Error('#root element not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
