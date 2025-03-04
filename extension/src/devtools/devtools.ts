// Create a connection to the background page
const devToolsPageConnection = chrome.runtime.connect({
    name: "cs-dev-tools"
});

// Relay the tab ID to the background page
devToolsPageConnection.postMessage({
    tabId: chrome.devtools.inspectedWindow.tabId,
    name: 'init'
});

// Create the DevTools panel
chrome.devtools.panels.create(
    'cs-dev-tools',
    '',  // No icon needed
    '/panel.html',
    (panel) => {
        console.log('cs-dev-tools panel created');
        
        panel.onShown.addListener((panelWindow) => {
            console.log('cs-dev-tools panel shown');
        });
        
        panel.onHidden.addListener(() => {
            console.log('cs-dev-tools panel hidden');
        });
    }
);