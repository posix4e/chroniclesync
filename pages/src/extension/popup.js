// Wait for DOM and browser polyfill to be ready
document.addEventListener('DOMContentLoaded', () => {
  function openUrl(url) {
    // Check if running as extension with browser API available
    if (typeof browser !== 'undefined' && browser.tabs) {
      return browser.tabs.create({ url });
    }
    
    // Fallback for web page context or Safari
    window.open(url, '_blank');
  }

  document.getElementById('openDashboard').addEventListener('click', () => {
    // Use environment-specific URL (localhost for development, production for release)
    const url = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : 'https://chroniclesync.xyz';
    
    openUrl(url);
  });
});