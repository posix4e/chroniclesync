chrome.action.onClicked.addListener(async () => {
  // Open the app in a new tab
  chrome.tabs.create({ url: "http://localhost:54826" });
});
