const logContainer = document.getElementById('log-container')!;

function formatTimestamp(date: Date): string {
    const time = date.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${time}.${ms}`;
}

function createLogEntry(message: any, type: string = 'info'): void {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = `[${formatTimestamp(new Date())}] `;
    
    const content = document.createElement('span');
    content.textContent = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
    
    entry.appendChild(timestamp);
    entry.appendChild(content);
    logContainer.appendChild(entry);
    
    // Auto-scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Create a connection to the background page
const panelPageConnection = chrome.runtime.connect({
    name: "cs-dev-tools"
});

// Listen for log messages from the background script
panelPageConnection.onMessage.addListener((message) => {
    if (message.source === 'chroniclesync') {
        const type = message.error ? 'error' : message.success ? 'success' : 'info';
        createLogEntry(message.content, type);
    }
});