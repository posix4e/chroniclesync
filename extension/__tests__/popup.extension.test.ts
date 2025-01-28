/**
 * @jest-environment jsdom
 */

describe('Popup Script', () => {
  let originalFetch: any;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div class="container">
        <form id="apiForm">
          <input type="url" id="apiEndpoint">
          <div id="status"></div>
          <button type="submit" id="submitButton">Make API Call</button>
          <button type="button" id="clearButton">Clear</button>
        </form>
        <div id="apiResult"></div>
      </div>
    `;

    // Save original fetch
    originalFetch = global.fetch;

    // Reset storage mocks
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.storage.local.remove.mockClear();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    jest.resetModules();
  });

  test('should load saved endpoint on startup', () => {
    const testEndpoint = 'https://api.example.com/test';
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ lastEndpoint: testEndpoint });
    });

    // Load popup script
    require('../popup');

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Check if endpoint was loaded
    const input = document.getElementById('apiEndpoint') as HTMLInputElement;
    expect(input.value).toBe(testEndpoint);
  });

  test('should make successful API call', async () => {
    const testEndpoint = 'https://api.example.com/test';
    const testResponse = { message: 'Success' };

    // Mock fetch
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve(testResponse)
      })
    );

    // Load popup script
    require('../popup');

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Set endpoint and submit form
    const input = document.getElementById('apiEndpoint') as HTMLInputElement;
    const form = document.getElementById('apiForm') as HTMLFormElement;
    input.value = testEndpoint;
    form.dispatchEvent(new Event('submit'));

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check if API call was made
    expect(global.fetch).toHaveBeenCalledWith(testEndpoint);

    // Check if result was displayed
    const resultDiv = document.getElementById('apiResult');
    expect(resultDiv?.innerHTML).toContain(JSON.stringify(testResponse, null, 2));
  });

  test('should handle API call failure', async () => {
    const testEndpoint = 'https://api.example.com/test';
    const testError = 'API call failed';

    // Mock fetch to fail
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.reject(new Error(testError))
    );

    // Load popup script
    require('../popup');

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Set endpoint and submit form
    const input = document.getElementById('apiEndpoint') as HTMLInputElement;
    const form = document.getElementById('apiForm') as HTMLFormElement;
    input.value = testEndpoint;
    form.dispatchEvent(new Event('submit'));

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check if error was displayed
    const resultDiv = document.getElementById('apiResult');
    expect(resultDiv?.innerHTML).toContain(testError);
  });

  test('should clear form and storage', () => {
    // Load popup script
    require('../popup');

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Set some initial values
    const input = document.getElementById('apiEndpoint') as HTMLInputElement;
    const resultDiv = document.getElementById('apiResult') as HTMLDivElement;
    input.value = 'https://api.example.com/test';
    resultDiv.innerHTML = 'Some result';

    // Click clear button
    const clearButton = document.getElementById('clearButton') as HTMLButtonElement;
    clearButton.click();

    // Check if values were cleared
    expect(input.value).toBe('');
    expect(resultDiv.innerHTML).toBe('');
    expect(chrome.storage.local.remove).toHaveBeenCalledWith(['lastEndpoint']);
  });
});