import browserAPI from './browser-polyfill.js';

document.getElementById('openDashboard').addEventListener('click', () => {
  // Use the actual deployed GitHub Pages URL
  browserAPI.tabs.create({ url: 'https://chroniclesync.pages.dev' });
});