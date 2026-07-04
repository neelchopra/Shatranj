import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './app-state/store';
import ThemeModeProvider from './ui/ThemeModeContext';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeModeProvider>
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MotionConfig>
      </ThemeModeProvider>
    </Provider>
  </React.StrictMode>
);
