import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  try {
    createRoot(rootEl).render(<App />);
  } catch (err) {
    console.error('Failed to mount Whispering Grove:', err);
    rootEl.textContent = 'Whispering Grove could not start. Please reload the page.';
  }
}
