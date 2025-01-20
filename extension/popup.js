document.getElementById('openApp').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'openInTab' });
  window.close(); // Close the popup after clicking
});