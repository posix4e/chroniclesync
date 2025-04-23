// Safari iOS Extension History Script

document.addEventListener('DOMContentLoaded', async () => {
  const historyListElement = document.getElementById('historyList');
  const noResultsElement = document.getElementById('noResults');
  const errorMessageElement = document.getElementById('errorMessage');
  const searchInputElement = document.getElementById('searchInput');
  const deviceFilterElement = document.getElementById('deviceFilter');
  const timeFilterElement = document.getElementById('timeFilter');
  const refreshHistoryButton = document.getElementById('refreshHistory');

  // Store all history items
  let allHistoryItems = [];
  
  // Initialize
  await loadHistory();
  
  // Add event listeners
  searchInputElement.addEventListener('input', filterHistory);
  deviceFilterElement.addEventListener('change', filterHistory);
  timeFilterElement.addEventListener('change', filterHistory);
  refreshHistoryButton.addEventListener('click', loadHistory);

  // Load history from background script
  async function loadHistory() {
    try {
      showLoading();
      
      // Get history items
      const historyItems = await browser.runtime.sendMessage({ type: 'getHistory' });
      
      if (Array.isArray(historyItems)) {
        allHistoryItems = historyItems;
        
        // Populate device filter
        populateDeviceFilter(historyItems);
        
        // Display history
        filterHistory();
      } else if (historyItems.error) {
        showError('Error loading history: ' + historyItems.error);
      } else {
        showNoResults();
      }
    } catch (error) {
      console.error('Error loading history:', error);
      showError('Failed to load history. Please try again.');
    }
  }

  // Populate device filter dropdown
  function populateDeviceFilter(historyItems) {
    // Clear existing options except "All Devices"
    while (deviceFilterElement.options.length > 1) {
      deviceFilterElement.remove(1);
    }
    
    // Get unique device names
    const deviceNames = new Set();
    historyItems.forEach(item => {
      if (item.deviceName) {
        deviceNames.add(item.deviceName);
      }
    });
    
    // Add device options
    deviceNames.forEach(deviceName => {
      const option = document.createElement('option');
      option.value = deviceName;
      option.textContent = deviceName;
      deviceFilterElement.appendChild(option);
    });
  }

  // Filter history based on search and filters
  function filterHistory() {
    const searchTerm = searchInputElement.value.toLowerCase();
    const deviceFilter = deviceFilterElement.value;
    const timeFilter = timeFilterElement.value;
    
    // Apply filters
    const filteredItems = allHistoryItems.filter(item => {
      // Search filter
      const matchesSearch = !searchTerm || 
        (item.title && item.title.toLowerCase().includes(searchTerm)) || 
        (item.url && item.url.toLowerCase().includes(searchTerm));
      
      // Device filter
      const matchesDevice = deviceFilter === 'all' || 
        (item.deviceName && item.deviceName === deviceFilter);
      
      // Time filter
      const matchesTime = timeFilter === 'all' || isInTimeRange(item.visitTime, timeFilter);
      
      return matchesSearch && matchesDevice && matchesTime;
    });
    
    // Display filtered items
    displayHistoryItems(filteredItems);
  }

  // Check if a timestamp is within the selected time range
  function isInTimeRange(timestamp, timeRange) {
    if (!timestamp) return false;
    
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    switch (timeRange) {
      case 'today':
        return date >= today;
      case 'yesterday':
        return date >= yesterday && date < today;
      case 'week':
        return date >= weekStart;
      case 'month':
        return date >= monthStart;
      default:
        return true;
    }
  }

  // Display history items in the UI
  function displayHistoryItems(items) {
    if (items.length === 0) {
      showNoResults();
      return;
    }
    
    // Sort items by visit time (newest first)
    items.sort((a, b) => (b.visitTime || 0) - (a.visitTime || 0));
    
    // Clear history list
    historyListElement.innerHTML = '';
    
    // Add items to the list
    items.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const header = document.createElement('div');
      header.className = 'history-item-header';
      
      const title = document.createElement('a');
      title.className = 'history-item-title';
      title.href = item.url;
      title.target = '_blank';
      title.textContent = item.title || 'Untitled';
      
      const time = document.createElement('span');
      time.className = 'history-item-time';
      time.textContent = formatDate(item.visitTime);
      
      header.appendChild(title);
      header.appendChild(time);
      
      const url = document.createElement('div');
      url.className = 'history-item-url';
      url.textContent = item.url;
      
      const device = document.createElement('div');
      device.className = 'history-item-device';
      
      const deviceIcon = document.createElement('span');
      deviceIcon.className = 'device-icon';
      deviceIcon.textContent = getDeviceIcon(item.deviceType);
      
      device.appendChild(deviceIcon);
      device.appendChild(document.createTextNode(item.deviceName || 'Unknown Device'));
      
      historyItem.appendChild(header);
      historyItem.appendChild(url);
      historyItem.appendChild(device);
      
      historyListElement.appendChild(historyItem);
    });
    
    noResultsElement.classList.add('hidden');
    errorMessageElement.classList.add('hidden');
  }

  // Format date for display
  function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format time
    const timeOptions = { hour: 'numeric', minute: 'numeric' };
    const time = date.toLocaleTimeString(undefined, timeOptions);
    
    // Check if date is today, yesterday, or earlier
    if (date >= today) {
      return `Today, ${time}`;
    } else if (date >= yesterday) {
      return `Yesterday, ${time}`;
    } else {
      const dateOptions = { month: 'short', day: 'numeric' };
      const dateStr = date.toLocaleDateString(undefined, dateOptions);
      return `${dateStr}, ${time}`;
    }
  }

  // Get icon for device type
  function getDeviceIcon(deviceType) {
    switch (deviceType) {
      case 'mobile':
        return '📱 ';
      case 'tablet':
        return '📱 ';
      case 'desktop':
        return '💻 ';
      default:
        return '🌐 ';
    }
  }

  // Show loading state
  function showLoading() {
    historyListElement.innerHTML = '<div class="loading">Loading history...</div>';
    noResultsElement.classList.add('hidden');
    errorMessageElement.classList.add('hidden');
  }

  // Show no results message
  function showNoResults() {
    historyListElement.innerHTML = '';
    noResultsElement.classList.remove('hidden');
    errorMessageElement.classList.add('hidden');
  }

  // Show error message
  function showError(message) {
    historyListElement.innerHTML = '';
    noResultsElement.classList.add('hidden');
    errorMessageElement.textContent = message;
    errorMessageElement.classList.remove('hidden');
  }
});