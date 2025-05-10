import { Settings } from './settings/Settings';

// Initialize settings when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const settings = new Settings();
  settings.init().catch(console.error);
});