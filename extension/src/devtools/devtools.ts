chrome.devtools.panels.create(
    'ChronicleSync',
    'icon.png',
    'panel.html',
    (panel) => {
        console.log('ChronicleSync DevTools panel created');
    }
);