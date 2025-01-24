chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {  // Only log main frame navigation
    console.log('Page visited:', details.url);
  }
});