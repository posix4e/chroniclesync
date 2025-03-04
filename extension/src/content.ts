const SKIP_URLS = [
    'chrome://',
    'chrome-extension://',
    'about:',
    'edge://',
    'brave://'
];

function shouldSkipUrl(url: string): boolean {
    return SKIP_URLS.some(prefix => url.startsWith(prefix));
}

async function extractAndSummarize() {
    if (shouldSkipUrl(window.location.href)) {
        return;
    }

    // Wait for the page to be fully loaded
    if (document.readyState !== 'complete') {
        await new Promise(resolve => window.addEventListener('load', resolve));
    }

    // Send message to background script to extract and summarize content
    chrome.runtime.sendMessage({
        type: 'SUMMARIZE_PAGE',
        url: window.location.href
    });
}

// Start the summarization process
extractAndSummarize();