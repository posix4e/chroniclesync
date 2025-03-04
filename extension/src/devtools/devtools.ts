chrome.devtools.panels.create(
    'cs-dev-tools',
    'icon.png',
    'panel.html',
    (panel) => {
        console.log('cs-dev-tools panel created');
    }
);