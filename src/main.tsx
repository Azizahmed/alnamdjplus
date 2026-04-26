import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Disable console.log and console.warn
console.log = () => {};
console.warn = () => {};
// Keep console.error for actual errors

// Unregister any stale service workers that might intercept Vite module requests
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.info('Stale service worker unregistered');
      });
    }
  });
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <App />
  );
}


