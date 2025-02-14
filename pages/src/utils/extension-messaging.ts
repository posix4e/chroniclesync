export const getClientIdFromExtension = async (): Promise<string | null> => {
  try {
    // Check if we're in a Chrome extension context
    if (!window.chrome?.runtime?.sendMessage) {
      return null;
    }

    // Try to get the client ID through messaging
    const response = await chrome.runtime.sendMessage({ type: 'getClientId' });
    return response?.clientId || null;
  } catch {
    // If there's an error (like extension not installed), return null
    return null;
  }
};