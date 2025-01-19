chrome.action.onClicked.addListener(() => {
  const width = 400;
  const height = 600;
  const left = screen.width - width;
  const top = 0;

  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: width,
    height: height,
    left: left,
    top: top,
    focused: true
  });
});