function getBrowser() {
  if (typeof browser !== 'undefined') return browser;
  if (typeof chrome !== 'undefined') return chrome;
  if (typeof window !== 'undefined' && window.safari) return window.safari;
  throw new Error('Unsupported browser');
}

document.getElementById('openDashboard').addEventListener('click', () => {
  const browser = getBrowser();
  const url = 'https://chroniclesync.pages.dev';
  
  if (browser === window.safari) {
    window.open(url, '_blank');
  } else {
    browser.tabs.create({ url });
  }
});