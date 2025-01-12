// Use the appropriate browser API
const browserAPI = (typeof browser !== 'undefined' ? browser :
                   typeof chrome !== 'undefined' ? chrome :
                   typeof safari !== 'undefined' ? safari : null);

document.getElementById('openDashboard').addEventListener('click', () => {
  // Use the actual deployed GitHub Pages URL
  browserAPI.tabs.create({ url: 'https://chroniclesync.pages.dev' });
});