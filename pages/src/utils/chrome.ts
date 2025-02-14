export const getExtensionClientId = async (): Promise<string | null> => {
  if (!window.chrome?.storage?.sync) {
    return null;
  }

  return new Promise((resolve) => {
    chrome.storage.sync.get(['clientId'], (result) => {
      resolve(result.clientId || null);
    });
  });
};