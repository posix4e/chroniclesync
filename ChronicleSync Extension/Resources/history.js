// History page script for ChronicleSync Safari Extension

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const historyList = document.getElementById('history-list');
  const noResults = document.getElementById('no-results');
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const refreshButton = document.getElementById('refresh-button');
  const deviceFilter = document.getElementById('device-filter');
  const dateFilter = document.getElementById('date-filter');
  
  // Load history data
  loadHistory();
  
  // Load device list for filter
  loadDevices();
  
  // Event listeners
  searchButton.addEventListener('click', function() {
    const query = searchInput.value.trim();
    if (query) {
      searchHistory(query);
    } else {
      loadHistory();
    }
  });
  
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchButton.click();
    }
  });
  
  refreshButton.addEventListener('click', function() {
    loadHistory();
  });
  
  deviceFilter.addEventListener('change', function() {
    loadHistory();
  });
  
  dateFilter.addEventListener('change', function() {
    loadHistory();
  });
  
  // Load history data
  function loadHistory() {
    historyList.innerHTML = '<div class="loading">Loading history...</div>';
    noResults.classList.add('hidden');
    
    const deviceId = deviceFilter.value;
    const dateRange = getDateRange(dateFilter.value);
    
    chrome.runtime.sendMessage({
      type: 'getHistory',
      deviceId: deviceId === 'all' ? null : deviceId,
      since: dateRange
    }, function(response) {
      if (response && Array.isArray(response) && response.length > 0) {
        displayHistory(response);
      } else {
        historyList.innerHTML = '';
        noResults.classList.remove('hidden');
      }
    });
  }
  
  // Load devices for filter
  function loadDevices() {
    chrome.runtime.sendMessage({ type: 'getDevices' }, function(response) {
      if (response && Array.isArray(response) && response.length > 0) {
        // Clear existing options except "All Devices"
        while (deviceFilter.options.length > 1) {
          deviceFilter.remove(1);
        }
        
        // Add device options
        response.forEach(device => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.textContent = device.deviceName || device.deviceId;
          deviceFilter.appendChild(option);
        });
      }
    });
  }
  
  // Search history
  function searchHistory(query) {
    historyList.innerHTML = '<div class="loading">Searching...</div>';
    noResults.classList.add('hidden');
    
    chrome.runtime.sendMessage({
      type: 'searchHistory',
      query: query
    }, function(response) {
      if (response && response.success && response.results && response.results.length > 0) {
        displaySearchResults(response.results, query);
      } else {
        historyList.innerHTML = '';
        noResults.classList.remove('hidden');
      }
    });
  }
  
  // Display history items
  function displayHistory(historyItems) {
    historyList.innerHTML = '';
    
    historyItems.sort((a, b) => b.visitTime - a.visitTime);
    
    historyItems.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const date = new Date(item.visitTime);
      const formattedDate = date.toLocaleString();
      
      historyItem.innerHTML = `
        <div class="history-item-header">
          <a href="${item.url}" class="history-item-title" target="_blank">${item.title || item.url}</a>
          <span class="history-item-time">${formattedDate}</span>
        </div>
        <div class="history-item-url">${item.url}</div>
        <div class="history-item-device">
          ${item.deviceName || item.deviceId || 'Unknown device'}
          ${item.browser ? ` • ${item.browser}` : ''}
          ${item.os ? ` • ${item.os}` : ''}
        </div>
      `;
      
      historyList.appendChild(historyItem);
    });
  }
  
  // Display search results
  function displaySearchResults(results, query) {
    historyList.innerHTML = '';
    
    results.sort((a, b) => b.visitTime - a.visitTime);
    
    results.forEach(result => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const date = new Date(result.visitTime);
      const formattedDate = date.toLocaleString();
      
      let matchesHtml = '';
      if (result.matches && result.matches.length > 0) {
        result.matches.forEach(match => {
          const highlightedContext = highlightText(match.context, query);
          matchesHtml += `
            <div class="search-result-match">
              <div class="search-result-context">${highlightedContext}</div>
            </div>
          `;
        });
      }
      
      historyItem.innerHTML = `
        <div class="history-item-header">
          <a href="${result.url}" class="history-item-title" target="_blank">${result.title || result.url}</a>
          <span class="history-item-time">${formattedDate}</span>
        </div>
        <div class="history-item-url">${result.url}</div>
        ${matchesHtml}
      `;
      
      historyList.appendChild(historyItem);
    });
  }
  
  // Helper function to get date range based on filter
  function getDateRange(filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    switch (filter) {
      case 'today':
        return today;
      case 'yesterday':
        return today - 86400000; // 24 hours in milliseconds
      case 'week':
        return today - 604800000; // 7 days in milliseconds
      case 'month':
        return today - 2592000000; // 30 days in milliseconds
      default:
        return 0; // All time
    }
  }
  
  // Helper function to highlight search text
  function highlightText(text, query) {
    if (!text || !query) return text;
    
    const regex = new RegExp(query, 'gi');
    return text.replace(regex, match => `<mark>${match}</mark>`);
  }
});