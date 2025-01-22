// Initialize the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('ChronicleSync extension installed');
});

// Track connected clients
const connectedClients = new Set<string>();

// Listen for history changes
chrome.history.onVisited.addListener(async (result) => {
  console.log('History entry added:', result);
  
  // Broadcast to all connected clients
  const message = {
    type: 'HISTORY_UPDATED',
    action: 'navigation',
    data: { url: result.url },
    timestamp: Date.now()
  };

  Array.from(connectedClients).forEach(clientId => {
    try {
      chrome.runtime.sendMessage(clientId, message);
    } catch (error) {
      console.error(`Failed to send history update to client ${clientId}:`, error);
      // Remove disconnected client
      connectedClients.delete(clientId);
    }
  });
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.id) return;

  switch (message.type) {
  case 'CONNECT_CLIENT':
    connectedClients.add(sender.id);
    sendResponse({ success: true });
    break;

  case 'DISCONNECT_CLIENT':
    connectedClients.delete(sender.id);
    sendResponse({ success: true });
    break;

  case 'GET_HISTORY':
    chrome.history.search({ text: '', maxResults: 100 }, (results) => {
      sendResponse(results.map(result => ({
        action: 'navigation',
        data: { url: result.url },
        timestamp: result.lastVisitTime,
        clientId: 'browser'
      })));
    });
    return true;

  case 'SYNC_HISTORY':
    // Sync history between clients
    Array.from(connectedClients).forEach(clientId => {
      if (clientId !== sender.id) {
        try {
          chrome.runtime.sendMessage(clientId, {
            type: 'HISTORY_SYNC',
            entries: message.entries
          });
        } catch (error) {
          console.error(`Failed to sync history to client ${clientId}:`, error);
          connectedClients.delete(clientId);
        }
      }
    });
    sendResponse({ success: true });
    break;
  }
});