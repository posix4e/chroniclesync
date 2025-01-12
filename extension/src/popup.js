document.getElementById('openDashboard').addEventListener('click', () => {
  // Replace this URL with your actual GitHub Pages URL
  chrome.tabs.create({ url: 'https://your-github-pages-url.com' });
});