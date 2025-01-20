// Store the window ID to avoid opening multiple windows
let extensionWindowId = null;

chrome.action.onClicked.addListener(async () => {
  // If window exists, focus it instead of creating a new one
  if (extensionWindowId !== null) {
    try {
      const window = await chrome.windows.get(extensionWindowId);
      chrome.windows.update(extensionWindowId, { focused: true });
      return;
    } catch (e) {
      // Window was closed, reset the ID
      extensionWindowId = null;
    }
  }

  // Calculate position (right side of screen)
  const { width: screenWidth } = await new Promise(resolve => {
    chrome.windows.getLastFocused(win => {
      chrome.windows.get(win.id, { populate: false }, windowInfo => {
        resolve(windowInfo);
      });
    });
  });

  const width = 400;
  const height = 600;
  const left = screenWidth - width;

  // Open a new window
  const window = await chrome.windows.create({
    url: 'index.html',
    type: 'popup',
    width,
    height,
    left,
    top: 0
  });

  extensionWindowId = window.id;

  // Reset the ID when window is closed
  chrome.windows.onRemoved.addListener(windowId => {
    if (windowId === extensionWindowId) {
      extensionWindowId = null;
    }
  });
});