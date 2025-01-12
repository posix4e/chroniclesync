// Wait for DOM and browser polyfill to be ready
document.addEventListener('DOMContentLoaded', () => {
  function getBrowser() {
    if (typeof browser !== 'undefined') return browser;
    if (typeof chrome !== 'undefined') return chrome;
    if (typeof window !== 'undefined' && window.safari) return window.safari;
    throw new Error('Unsupported browser');
  }

  document.getElementById('openDashboard').addEventListener('click', () => {
    const browser = getBrowser();
    const url = 'http://localhost:3000';
    
    if (browser === window.safari) {
      window.open(url, '_blank');
    } else {
      browser.tabs.create({ url });
    }
  });
});