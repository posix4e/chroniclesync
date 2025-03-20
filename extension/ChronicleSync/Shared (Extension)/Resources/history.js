document.addEventListener('DOMContentLoaded', async () => {
  // Initialize variables
  let allHistory = [];
  let devices = [];
  let currentPage = 1;
  const itemsPerPage = 20;
  
  // Set up event listeners
  document.getElementById('searchInput').addEventListener('input', filterHistory);
  document.getElementById('deviceFilter').addEventListener('change', filterHistory);
  document.getElementById('timeFilter').addEventListener('change', filterHistory);
  document.getElementById('refreshBtn').addEventListener('click', loadHistory);
  
  // Load initial data
  await loadDevices();
  await loadHistory();
  
  // Load devices for the filter dropdown
  async function loadDevices() {
    try {
      devices = await browser.runtime.sendMessage({ type: 'getDevices' });
      
      const deviceFilter = document.getElementById('deviceFilter');
      
      // Clear existing options except "All Devices"
      while (deviceFilter.options.length > 1) {
        deviceFilter.remove(1);
      }
      
      // Add device options
      devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = `${device.browser} on ${device.platform}`;
        deviceFilter.appendChild(option);
      });
      
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  }
  
  // Load history data
  async function loadHistory() {
    try {
      // Show loading state
      document.getElementById('historyList').innerHTML = '<div class="no-results">Loading history...</div>';
      
      // Get time filter
      const timeFilter = document.getElementById('timeFilter').value;
      let since = 0;
      
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      
      switch (timeFilter) {
        case 'today':
          since = new Date().setHours(0, 0, 0, 0);
          break;
        case 'yesterday':
          since = new Date().setHours(0, 0, 0, 0) - day;
          break;
        case 'week':
          since = now - (7 * day);
          break;
        case 'month':
          since = now - (30 * day);
          break;
      }
      
      // Get device filter
      const deviceId = document.getElementById('deviceFilter').value;
      const deviceFilter = deviceId === 'all' ? null : deviceId;
      
      // Request history from background script
      allHistory = await browser.runtime.sendMessage({ 
        type: 'getHistory',
        deviceId: deviceFilter,
        since: since
      });
      
      // Reset to first page and display results
      currentPage = 1;
      filterHistory();
      
    } catch (error) {
      console.error('Error loading history:', error);
      document.getElementById('historyList').innerHTML = 
        `<div class="no-results">Error loading history: ${error.message}</div>`;
    }
  }
  
  // Filter and display history based on search and filters
  function filterHistory() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // Filter history items
    let filteredHistory = allHistory;
    
    if (searchTerm) {
      filteredHistory = filteredHistory.filter(item => 
        item.title.toLowerCase().includes(searchTerm) || 
        item.url.toLowerCase().includes(searchTerm)
      );
    }
    
    // Display results with pagination
    displayHistory(filteredHistory);
  }
  
  // Display history items with pagination
  function displayHistory(historyItems) {
    const historyList = document.getElementById('historyList');
    const paginationContainer = document.getElementById('pagination');
    
    // Calculate pagination
    const totalPages = Math.ceil(historyItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, historyItems.length);
    const currentItems = historyItems.slice(startIndex, endIndex);
    
    // Clear existing content
    historyList.innerHTML = '';
    paginationContainer.innerHTML = '';
    
    // Display no results message if needed
    if (historyItems.length === 0) {
      historyList.innerHTML = '<div class="no-results">No history items found</div>';
      return;
    }
    
    // Create history items
    currentItems.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const date = new Date(item.visitTime);
      
      historyItem.innerHTML = `
        <div class="history-item-header">
          <h3 class="history-item-title">${escapeHtml(item.title || 'Untitled')}</h3>
          <span class="history-item-time">${date.toLocaleString()}</span>
        </div>
        <a href="${item.url}" class="history-item-url" target="_blank">${item.url}</a>
        ${item.content ? `<div class="history-item-content">${escapeHtml(item.summary || '')}</div>` : ''}
        <div class="history-item-actions">
          <button class="open-btn" data-url="${item.url}">Open</button>
          <button class="delete-btn" data-visit-id="${item.visitId}">Delete</button>
        </div>
      `;
      
      historyList.appendChild(historyItem);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.open-btn').forEach(button => {
      button.addEventListener('click', () => {
        browser.tabs.create({ url: button.dataset.url });
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this history item?')) {
          try {
            await browser.runtime.sendMessage({ 
              type: 'deleteHistory',
              visitId: button.dataset.visitId
            });
            
            // Reload history after deletion
            await loadHistory();
          } catch (error) {
            console.error('Error deleting history item:', error);
            alert('Error deleting history item: ' + error.message);
          }
        }
      });
    });
    
    // Create pagination if needed
    if (totalPages > 1) {
      // Previous button
      const prevButton = document.createElement('button');
      prevButton.textContent = '←';
      prevButton.disabled = currentPage === 1;
      prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          displayHistory(historyItems);
        }
      });
      paginationContainer.appendChild(prevButton);
      
      // Page buttons
      const maxButtons = 5;
      const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
      const endPage = Math.min(totalPages, startPage + maxButtons - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage);
        pageButton.addEventListener('click', () => {
          currentPage = i;
          displayHistory(historyItems);
        });
        paginationContainer.appendChild(pageButton);
      }
      
      // Next button
      const nextButton = document.createElement('button');
      nextButton.textContent = '→';
      nextButton.disabled = currentPage === totalPages;
      nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          displayHistory(historyItems);
        }
      });
      paginationContainer.appendChild(nextButton);
    }
  }
  
  // Helper function to escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});