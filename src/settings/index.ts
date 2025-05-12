import { Settings } from './Settings';
import { BackgroundSettings } from './BackgroundSettings';

export { Settings, BackgroundSettings };

// Only attach event listener if we're in a browser context with a document object
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const settings = new Settings();
    settings.init().catch(console.error);
  });
}