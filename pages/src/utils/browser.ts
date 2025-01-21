import { BrowserMetadata } from '../types';

export function getBrowserMetadata(): BrowserMetadata {
  const ua = navigator.userAgent;
  const browserRegexes = {
    chrome: /Chrome\/(\d+(\.\d+)?)/,
    firefox: /Firefox\/(\d+(\.\d+)?)/,
    safari: /Version\/(\d+(\.\d+)?).+Safari/,
    edge: /Edg\/(\d+(\.\d+)?)/,
  };

  let browserName = 'unknown';
  let browserVersion = 'unknown';

  for (const [name, regex] of Object.entries(browserRegexes)) {
    const match = ua.match(regex);
    if (match) {
      browserName = name;
      browserVersion = match[1];
      break;
    }
  }

  const osRegexes = {
    windows: /Windows NT (\d+\.\d+)/,
    mac: /Mac OS X (\d+[._]\d+)/,
    linux: /Linux/,
    android: /Android (\d+(\.\d+)?)/,
    ios: /OS (\d+[._]\d+) like Mac OS X/,
  };

  let osName = 'unknown';
  let osVersion = 'unknown';

  for (const [name, regex] of Object.entries(osRegexes)) {
    const match = ua.match(regex);
    if (match) {
      osName = name;
      osVersion = match[1]?.replace('_', '.') || 'unknown';
      break;
    }
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor,
    language: navigator.language,
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    browserName,
    browserVersion,
    osName,
    osVersion,
  };
}

export function getHistoryFromChrome(): Promise<chrome.history.HistoryItem[]> {
  return new Promise((resolve, reject) => {
    if (!chrome?.history?.search) {
      reject(new Error('Chrome history API not available'));
      return;
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    chrome.history.search({
      text: '',
      startTime: weekAgo.getTime(),
      maxResults: 5000
    }, (items) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(items);
      }
    });
  });
}

export function convertChromeHistoryItem(item: chrome.history.HistoryItem): import('../types').HistoryItem {
  return {
    id: item.id || crypto.randomUUID(),
    url: item.url || '',
    title: item.title || '',
    visitTime: item.lastVisitTime || Date.now(),
    typedCount: item.typedCount,
    lastVisitTime: item.lastVisitTime,
  };
}