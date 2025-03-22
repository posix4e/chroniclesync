/**
 * Chrome Extension API Compatibility Layer for Safari
 * 
 * This script provides compatibility between Chrome extension APIs and Safari extension APIs.
 * It maps Chrome's extension APIs to Safari's extension APIs where possible.
 */

(function() {
    // Create a namespace for our compatibility layer
    window.chrome = window.chrome || {};
    
    // Storage API compatibility
    chrome.storage = {
        sync: {
            get: function(keys, callback) {
                if (typeof browser !== 'undefined' && browser.storage && browser.storage.sync) {
                    return browser.storage.sync.get(keys).then(result => callback(result));
                } else {
                    // Fallback to localStorage if browser.storage.sync is not available
                    let result = {};
                    if (Array.isArray(keys)) {
                        keys.forEach(key => {
                            const value = localStorage.getItem(key);
                            if (value !== null) {
                                try {
                                    result[key] = JSON.parse(value);
                                } catch (e) {
                                    result[key] = value;
                                }
                            }
                        });
                    } else if (typeof keys === 'object') {
                        Object.keys(keys).forEach(key => {
                            const value = localStorage.getItem(key);
                            if (value !== null) {
                                try {
                                    result[key] = JSON.parse(value);
                                } catch (e) {
                                    result[key] = value;
                                }
                            } else {
                                result[key] = keys[key]; // Default value
                            }
                        });
                    } else if (keys === null) {
                        // Get all items from localStorage
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            try {
                                result[key] = JSON.parse(localStorage.getItem(key));
                            } catch (e) {
                                result[key] = localStorage.getItem(key);
                            }
                        }
                    }
                    callback(result);
                }
            },
            set: function(items, callback) {
                if (typeof browser !== 'undefined' && browser.storage && browser.storage.sync) {
                    return browser.storage.sync.set(items).then(() => {
                        if (callback) callback();
                    });
                } else {
                    // Fallback to localStorage
                    Object.keys(items).forEach(key => {
                        localStorage.setItem(key, JSON.stringify(items[key]));
                    });
                    if (callback) callback();
                }
            },
            remove: function(keys, callback) {
                if (typeof browser !== 'undefined' && browser.storage && browser.storage.sync) {
                    return browser.storage.sync.remove(keys).then(() => {
                        if (callback) callback();
                    });
                } else {
                    // Fallback to localStorage
                    if (Array.isArray(keys)) {
                        keys.forEach(key => localStorage.removeItem(key));
                    } else {
                        localStorage.removeItem(keys);
                    }
                    if (callback) callback();
                }
            },
            clear: function(callback) {
                if (typeof browser !== 'undefined' && browser.storage && browser.storage.sync) {
                    return browser.storage.sync.clear().then(() => {
                        if (callback) callback();
                    });
                } else {
                    localStorage.clear();
                    if (callback) callback();
                }
            }
        },
        local: {
            get: function(keys, callback) {
                if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
                    return browser.storage.local.get(keys).then(result => callback(result));
                } else {
                    // Use the same localStorage implementation as sync
                    chrome.storage.sync.get(keys, callback);
                }
            },
            set: function(items, callback) {
                if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
                    return browser.storage.local.set(items).then(() => {
                        if (callback) callback();
                    });
                } else {
                    chrome.storage.sync.set(items, callback);
                }
            },
            remove: function(keys, callback) {
                if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
                    return browser.storage.local.remove(keys).then(() => {
                        if (callback) callback();
                    });
                } else {
                    chrome.storage.sync.remove(keys, callback);
                }
            },
            clear: function(callback) {
                if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
                    return browser.storage.local.clear().then(() => {
                        if (callback) callback();
                    });
                } else {
                    chrome.storage.sync.clear(callback);
                }
            }
        }
    };
    
    // Tabs API compatibility
    chrome.tabs = {
        query: function(queryInfo, callback) {
            if (typeof browser !== 'undefined' && browser.tabs && browser.tabs.query) {
                return browser.tabs.query(queryInfo).then(tabs => callback(tabs));
            } else {
                // Limited fallback - can only get current tab
                if (queryInfo.active && queryInfo.currentWindow) {
                    callback([{
                        id: 0,
                        url: window.location.href,
                        title: document.title,
                        active: true,
                        windowId: 0
                    }]);
                } else {
                    callback([]);
                }
            }
        },
        create: function(createProperties, callback) {
            if (typeof browser !== 'undefined' && browser.tabs && browser.tabs.create) {
                return browser.tabs.create(createProperties).then(tab => {
                    if (callback) callback(tab);
                });
            } else {
                // Fallback - open a new window
                const newTab = window.open(createProperties.url, '_blank');
                if (callback && newTab) {
                    callback({
                        id: Math.floor(Math.random() * 100000),
                        url: createProperties.url,
                        active: true,
                        windowId: 0
                    });
                }
            }
        },
        update: function(tabId, updateProperties, callback) {
            if (typeof browser !== 'undefined' && browser.tabs && browser.tabs.update) {
                return browser.tabs.update(tabId, updateProperties).then(tab => {
                    if (callback) callback(tab);
                });
            } else {
                // Very limited fallback - can only update current tab
                if (tabId === 0 || tabId === undefined) {
                    if (updateProperties.url) {
                        window.location.href = updateProperties.url;
                    }
                    if (callback) {
                        callback({
                            id: 0,
                            url: window.location.href,
                            title: document.title,
                            active: true,
                            windowId: 0
                        });
                    }
                }
            }
        }
    };
    
    // Runtime API compatibility
    chrome.runtime = {
        getURL: function(path) {
            if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL) {
                return browser.runtime.getURL(path);
            } else {
                // Simple fallback - assumes extension files are in the same directory
                return path;
            }
        },
        sendMessage: function(message, callback) {
            if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
                return browser.runtime.sendMessage(message).then(response => {
                    if (callback) callback(response);
                });
            } else {
                // Fallback using custom event for in-page messaging
                const event = new CustomEvent('chrome-runtime-message', { detail: message });
                window.dispatchEvent(event);
                if (callback) {
                    setTimeout(() => callback({}), 0);
                }
            }
        },
        onMessage: {
            addListener: function(listener) {
                if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
                    browser.runtime.onMessage.addListener((message, sender) => {
                        return new Promise(resolve => {
                            listener(message, sender, resolve);
                        });
                    });
                } else {
                    // Fallback using custom event
                    window.addEventListener('chrome-runtime-message', function(event) {
                        listener(event.detail, { url: window.location.href }, function(response) {
                            // No way to send response back in this fallback
                        });
                    });
                }
            }
        }
    };
    
    // History API compatibility
    chrome.history = {
        search: function(query, callback) {
            if (typeof browser !== 'undefined' && browser.history && browser.history.search) {
                return browser.history.search(query).then(results => callback(results));
            } else {
                // No real fallback for history API
                callback([]);
            }
        },
        getVisits: function(details, callback) {
            if (typeof browser !== 'undefined' && browser.history && browser.history.getVisits) {
                return browser.history.getVisits(details).then(results => callback(results));
            } else {
                callback([]);
            }
        },
        addUrl: function(details, callback) {
            if (typeof browser !== 'undefined' && browser.history && browser.history.addUrl) {
                return browser.history.addUrl(details).then(() => {
                    if (callback) callback();
                });
            } else {
                if (callback) callback();
            }
        },
        deleteUrl: function(details, callback) {
            if (typeof browser !== 'undefined' && browser.history && browser.history.deleteUrl) {
                return browser.history.deleteUrl(details).then(() => {
                    if (callback) callback();
                });
            } else {
                if (callback) callback();
            }
        }
    };
    
    console.log("Chrome Extension Compatibility Layer loaded");
})();