// Function to make API calls
async function makeApiCall(endpoint) {
  try {
    const response = await fetch(endpoint);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Function to update the UI with API response
function updateUI(result) {
  const resultDiv = document.getElementById('apiResult');
  if (result.success) {
    resultDiv.innerHTML = `
      <div class="success">
        <h3>API Call Successful</h3>
        <pre>${JSON.stringify(result.data, null, 2)}</pre>
      </div>
    `;
  } else {
    resultDiv.innerHTML = `
      <div class="error">
        <h3>API Call Failed</h3>
        <p>${result.error}</p>
      </div>
    `;
  }
}

// Function to save endpoint to storage
function saveEndpoint(endpoint) {
  chrome.storage.local.set({ lastEndpoint: endpoint }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Endpoint saved!';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
}

// Function to load saved endpoint
function loadSavedEndpoint() {
  chrome.storage.local.get(['lastEndpoint'], (result) => {
    if (result.lastEndpoint) {
      document.getElementById('apiEndpoint').value = result.lastEndpoint;
    }
  });
}

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', () => {
  // Load saved endpoint
  loadSavedEndpoint();

  // Set up form submission
  document.getElementById('apiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const endpoint = document.getElementById('apiEndpoint').value;
    const resultDiv = document.getElementById('apiResult');
    
    // Show loading state
    resultDiv.innerHTML = '<div class="loading">Making API call...</div>';
    
    // Make API call
    const result = await makeApiCall(endpoint);
    
    // Update UI with result
    updateUI(result);
    
    // Save endpoint if call was successful
    if (result.success) {
      saveEndpoint(endpoint);
    }
  });

  // Set up clear button
  document.getElementById('clearButton').addEventListener('click', () => {
    document.getElementById('apiEndpoint').value = '';
    document.getElementById('apiResult').innerHTML = '';
    chrome.storage.local.remove(['lastEndpoint']);
  });
});