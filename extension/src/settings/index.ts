import { Settings } from './Settings';

document.addEventListener('DOMContentLoaded', () => {
  const settings = new Settings();
  settings.init().catch(console.error);
});