// iOS Storage Adapter - Bridges between shared code and native Swift code
class IOSStorageAdapter {
  async init() {
    console.log('Initializing iOS Storage Adapter');
    return Promise.resolve();
  }

  async addEntry(entry) {
    return new Promise((resolve, reject) => {
      browser.runtime.sendNativeMessage(
        { 
          type: 'addHistoryEntry', 
          entry 
        },
        (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getUnsyncedEntries() {
    return new Promise((resolve, reject) => {
      browser.runtime.sendNativeMessage(
        { type: 'getUnsyncedEntries' },
        (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.entries || []);
          }
        }
      );
    });
  }

  async markAsSynced(visitId) {
    return new Promise((resolve, reject) => {
      browser.runtime.sendNativeMessage(
        { 
          type: 'markAsSynced', 
          visitId 
        },
        (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getEntries(deviceId, since) {
    return new Promise((resolve, reject) => {
      browser.runtime.sendNativeMessage(
        { 
          type: 'getEntries',
          deviceId,
          since
        },
        (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.entries || []);
          }
        }
      );
    });
  }

  async mergeRemoteEntries(remoteEntries) {
    return new Promise((resolve, reject) => {
      browser.runtime.sendNativeMessage(
        { 
          type: 'mergeRemoteEntries', 
          entries: remoteEntries 
        },
        (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  async updateDevice(device) {
    return new Promise((resolve, reject) => {
      browser.runtime.sendNativeMessage(
        { 
          type: 'updateDevice', 
          device 
        },
        (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getDevices() {
    return new Promise((resolve, reject) => {
      browser.runtime.sendNativeMessage(
        { type: 'getDevices' },
        (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.devices || []);
          }
        }
      );
    });
  }

  async deleteEntry(visitId) {
    return new Promise((resolve, reject) => {
      browser.runtime.sendNativeMessage(
        { 
          type: 'deleteEntry', 
          visitId 
        },
        (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  async updatePageContent(url, pageContent) {
    return new Promise((resolve, reject) => {
      browser.runtime.sendNativeMessage(
        { 
          type: 'updatePageContent', 
          url,
          content: pageContent.content,
          summary: pageContent.summary
        },
        (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  async searchContent(query) {
    return new Promise((resolve, reject) => {
      browser.runtime.sendNativeMessage(
        { 
          type: 'searchContent', 
          query 
        },
        (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.results || []);
          }
        }
      );
    });
  }
}

// Export the adapter
window.IOSStorageAdapter = IOSStorageAdapter;