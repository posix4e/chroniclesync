// Detect browser environment
const isSafari = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo;
const browserAPI = isSafari ? browser : chrome;

// Constants
const ITEMS_PER_PAGE = 20;

// State
let historyData = [];
let devices = [];
let currentPage = 1;
let currentDeviceFilter = 'all';
let currentTimeFilter = 'all';
let currentSearchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize UI elements
  const historyContainer = document.getElementById('historyContainer');
  const deviceFilter = document.getElementById('deviceFilter');
  const timeFilter = document.getElementById('timeFilter');
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const pagination = document.getElementById('pagination');
  
  // Load devices
  try {
    devices = await browserAPI.runtime.sendMessage({ type: 'getDevices' });
    populateDeviceFilter(devices);
  } catch (error) {
    console.error('Error loading devices:', error);
    showError('Failed to load devices. Please try again later.');
  }
  
  // Load initial history data
  await loadHistoryData();
  
  // Set up event listeners
  deviceFilter.addEventListener('change', async () => {
    currentDeviceFilter = deviceFilter.value;
    currentPage = 1;
    await loadHistoryData();
  });
  
  timeFilter.addEventListener('change', async () => {
    currentTimeFilter = timeFilter.value;
    currentPage = 1;
    await loadHistoryData();
  });
  
  searchButton.addEventListener('click', async () => {
    currentSearchQuery = searchInput.value.trim();
    currentPage = 1;
    await loadHistoryData();
  });
  
  searchInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      currentSearchQuery = searchInput.value.trim();
      currentPage = 1;
      await loadHistoryData();
    }
  });
});

// Load history data based on current filters
async function loadHistoryData() {
  const historyContainer = document.getElementById('historyContainer');
  historyContainer.innerHTML = '<div class="loading">Loading history...</div>';
  
  try {
    if (currentSearchQuery) {
      // Search mode
      const response = await browserAPI.runtime.sendMessage({ 
        type: 'searchHistory',
        query: currentSearchQuery
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      historyData = response.results || [];
    } else {
      // Normal history mode
      const since = getTimeFilterTimestamp(currentTimeFilter);
      const deviceId = currentDeviceFilter === 'all' ? null : currentDeviceFilter;
      
      historyData = await browserAPI.runtime.sendMessage({ 
        type: 'getHistory',
        deviceId: deviceId,
        since: since
      });
      
      if (historyData.error) {
        throw new Error(historyData.error);
      }
    }
    
    // Sort by visit time (newest first)
    historyData.sort((a, b) => b.visitTime - a.visitTime);
    
    renderHistoryItems();
    renderPagination();
  } catch (error) {
    console.error('Error loading history:', error);
    historyContainer.innerHTML = `
      <div class="no-results">
        <p>Error loading history: ${error.message || 'Unknown error'}</p>
      </div>
    `;
  }
}

// Render history items for the current page
function renderHistoryItems() {
  const historyContainer = document.getElementById('historyContainer');
  historyContainer.innerHTML = '';
  
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = historyData.slice(startIndex, endIndex);
  
  if (pageItems.length === 0) {
    historyContainer.innerHTML = `
      <div class="no-results">
        <p>No history items found${currentSearchQuery ? ' for your search' : ''}.</p>
      </div>
    `;
    return;
  }
  
  for (const item of pageItems) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const visitDate = new Date(item.visitTime).toLocaleString();
    const deviceInfo = getDeviceInfo(item.deviceId);
    const deviceName = deviceInfo ? deviceInfo.name : 'Unknown Device';
    const deviceIcon = getDeviceIcon(deviceInfo ? deviceInfo.type : 'unknown');
    
    historyItem.innerHTML = `
      <h3 class="history-title">${escapeHtml(item.title || 'Untitled')}</h3>
      <p class="history-url">${escapeHtml(item.url)}</p>
      <div class="history-meta">
        <span class="history-time">${visitDate}</span>
        <span class="history-device">
          ${deviceIcon}
          ${escapeHtml(deviceName)}
        </span>
      </div>
    `;
    
    historyItem.addEventListener('click', () => {
      browserAPI.tabs.create({ url: item.url });
    });
    
    historyContainer.appendChild(historyItem);
  }
}

// Render pagination controls
function renderPagination() {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  
  const totalPages = Math.ceil(historyData.length / ITEMS_PER_PAGE);
  
  if (totalPages <= 1) {
    return;
  }
  
  // Previous button
  const prevButton = document.createElement('button');
  prevButton.className = 'pagination-button';
  prevButton.textContent = '← Previous';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderHistoryItems();
      renderPagination();
      window.scrollTo(0, 0);
    }
  });
  pagination.appendChild(prevButton);
  
  // Page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.className = `pagination-button ${i === currentPage ? 'active' : ''}`;
    pageButton.textContent = i.toString();
    pageButton.addEventListener('click', () => {
      currentPage = i;
      renderHistoryItems();
      renderPagination();
      window.scrollTo(0, 0);
    });
    pagination.appendChild(pageButton);
  }
  
  // Next button
  const nextButton = document.createElement('button');
  nextButton.className = 'pagination-button';
  nextButton.textContent = 'Next →';
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderHistoryItems();
      renderPagination();
      window.scrollTo(0, 0);
    }
  });
  pagination.appendChild(nextButton);
}

// Populate device filter dropdown
function populateDeviceFilter(devices) {
  const deviceFilter = document.getElementById('deviceFilter');
  
  // Keep the "All Devices" option
  deviceFilter.innerHTML = '<option value="all">All Devices</option>';
  
  for (const device of devices) {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.textContent = device.name || 'Unknown Device';
    deviceFilter.appendChild(option);
  }
}

// Get device info by ID
function getDeviceInfo(deviceId) {
  return devices.find(device => device.deviceId === deviceId);
}

// Get device icon based on device type
function getDeviceIcon(deviceType) {
  let icon = '';
  
  switch (deviceType.toLowerCase()) {
    case 'desktop':
    case 'laptop':
      icon = '💻';
      break;
    case 'tablet':
      icon = '📱';
      break;
    case 'mobile':
      icon = '📱';
      break;
    default:
      icon = '🔍';
  }
  
  return icon;
}

// Get timestamp for time filter
function getTimeFilterTimestamp(filter) {
  const now = new Date();
  
  switch (filter) {
    case 'today':
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      return today.getTime();
      
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return yesterday.getTime();
      
    case 'week':
      const week = new Date(now);
      week.setDate(week.getDate() - 7);
      return week.getTime();
      
    case 'month':
      const month = new Date(now);
      month.setDate(month.getDate() - 30);
      return month.getTime();
      
    case 'all':
    default:
      return 0;
  }
}

// Show error message
function showError(message) {
  const historyContainer = document.getElementById('historyContainer');
  historyContainer.innerHTML = `
    <div class="no-results">
      <p>${message}</p>
    </div>
  `;
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}