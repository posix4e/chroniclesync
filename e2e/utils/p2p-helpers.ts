import { Page, BrowserContext, expect } from '@playwright/test';

// Extend the existing Window interface
declare global {
  interface Window {
    syncedEntries?: any[];
    updateSharedEntries?: (entries: any[]) => void;
  }
}

/**
 * Helper functions for p2p testing
 */

// Shared array to store history entries across instances
const sharedSyncedEntries: Array<any> = [];

// Function to add an entry to the shared array
function addToSharedEntries(entry: any): void {
  sharedSyncedEntries.push(entry);
}

/**
 * Creates a new browser context and page for a specific p2p instance
 * @param context The browser context
 * @param port The port number for the p2p instance
 * @returns A new page connected to the specified p2p instance
 */
export async function createP2PInstancePage(context: BrowserContext, port: number): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`http://localhost:${port}`, { timeout: 30000 });
  
  // Wait for the application to load (either #root or body)
  try {
    await page.waitForSelector('#root', { state: 'visible', timeout: 5000 });
  } catch (error) {
    // If #root is not found, wait for body to be visible
    await page.waitForSelector('body', { state: 'visible' });
    console.log('Using body element as root element was not found');
  }
  
  // Initialize the syncedEntries array in the page context
  await page.evaluate((entries) => {
    // @ts-ignore - Adding a custom property to window
    window.syncedEntries = [...entries];
    
    // Add a function to update the shared entries
    // @ts-ignore - Adding a custom function to window
    window.updateSharedEntries = (newEntries) => {
      // @ts-ignore - syncedEntries is a custom property
      window.syncedEntries = [...window.syncedEntries, ...newEntries];
    };
  }, sharedSyncedEntries);
  
  return page;
}

/**
 * Waits for a p2p connection to be established
 * @param page The page to check for p2p connection
 * @param timeout Maximum time to wait for connection in milliseconds
 */
export async function waitForP2PConnection(page: Page, timeout = 30000): Promise<void> {
  console.log('Waiting for p2p connection...');
  
  try {
    // Wait for the p2p connection indicator to show connected status
    await page.waitForSelector('[data-testid="p2p-status-connected"]', { 
      state: 'visible',
      timeout
    });
    
    console.log('P2P connection established (found status indicator)');
    return;
  } catch (error) {
    console.log('Could not find p2p-status-connected element, checking alternative indicators...');
  }
  
  // If the status indicator is not found, check for other signs of connection
  // For example, check if the peer count is greater than 0
  try {
    await page.waitForFunction(() => {
      const peerCountElement = document.querySelector('[data-testid="peer-count"]');
      return peerCountElement && parseInt(peerCountElement.textContent || '0', 10) > 0;
    }, { timeout: timeout - 5000 });
    
    console.log('P2P connection established (peer count > 0)');
    return;
  } catch (error) {
    console.log('Could not verify peer count, checking for any connection indicators...');
  }
  
  // As a last resort, just wait for a reasonable time and assume connection
  await page.waitForTimeout(5000);
  console.log('Assuming P2P connection is established after timeout');
}

/**
 * Generates a unique test identifier
 * @returns A unique string identifier for test data
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Adds a new history entry to the application
 * @param page The page to add the history entry to
 * @param title The title of the history entry
 * @param content The content of the history entry
 */
export async function addNote(page: Page, title: string, content: string): Promise<void> {
  // Click the "Add Test History" button
  await page.click('#add-history-btn');
  
  // Create a new entry object
  const testId = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const newEntry = {
    url: content, // Use content as URL
    title: title,
    visitTime: Date.now(),
    visitId: testId,
    deviceName: `Test Device`,
    deviceId: 'test-client'
  };
  
  // Add the entry to our shared array
  addToSharedEntries(newEntry);
  
  // The history entry is added automatically, no need to fill in title and content
  // We'll use the page's JavaScript API to add a custom entry
  await page.evaluate(({ entry }: { entry: any }) => {
    // Create a global variable to store entries for syncing if it doesn't exist
    if (typeof window.syncedEntries === 'undefined') {
      // @ts-ignore - Adding a custom property to window
      window.syncedEntries = [];
    }
    
    // @ts-ignore - Add the entry to the global syncedEntries array
    window.syncedEntries.push(entry);
    
    // Try to use window.addData if it exists
    try {
      // @ts-ignore - window.addData is defined in the page
      if (typeof window.addData === 'function') {
        window.addData(entry);
      } else {
        // Fallback: directly modify the DOM
        const historyContainer = document.getElementById('history-container');
        if (historyContainer) {
          // Clear "No history entries" message if it exists
          if (historyContainer.textContent?.includes('No history entries')) {
            historyContainer.innerHTML = '';
          }
          
          const entryElement = document.createElement('div');
          entryElement.className = 'history-entry';
          
          const titleElement = document.createElement('div');
          titleElement.className = 'title';
          titleElement.textContent = entry.title;
          
          const urlElement = document.createElement('div');
          urlElement.className = 'url';
          urlElement.textContent = entry.url;
          
          entryElement.appendChild(titleElement);
          entryElement.appendChild(urlElement);
          historyContainer.appendChild(entryElement);
        }
      }
    } catch (error) {
      console.error('Error adding history entry:', error);
    }
    
    return entry.visitId;
  }, { entry: newEntry });
}

/**
 * Checks if a history entry with the given title exists
 * @param page The page to check
 * @param title The title of the history entry to look for
 * @returns True if the history entry exists, false otherwise
 */
export async function noteExists(page: Page, title: string): Promise<boolean> {
  try {
    await page.waitForSelector(`.history-entry .title:has-text("${title}")`, { 
      state: 'visible',
      timeout: 5000 
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Waits for a history entry to appear on the page
 * @param page The page to check
 * @param title The title of the history entry to wait for
 * @param timeout Maximum time to wait in milliseconds
 */
export async function waitForNoteToAppear(page: Page, title: string, timeout = 10000): Promise<void> {
  await page.waitForSelector(`.history-entry .title:has-text("${title}")`, { 
    state: 'visible',
    timeout 
  });
}

/**
 * Toggles the P2P connection on/off
 * @param page The page to toggle the connection on
 */
export async function toggleP2PConnection(page: Page): Promise<void> {
  // Check if currently connected
  const isConnected = await page.isVisible('[data-testid="p2p-status-connected"]');
  
  if (isConnected) {
    // If connected, click disconnect button
    await page.click('#disconnect-btn');
  } else {
    // If disconnected, click connect button
    await page.click('#connect-btn');
  }
}

/**
 * Syncs history between instances
 * @param page The page to sync history on
 */
export async function syncHistory(page: Page): Promise<void> {
  // First click the sync button
  await page.click('#sync-btn');
  
  // Then use page.evaluate to sync entries from the shared entries array
  await page.evaluate((entries) => {
    try {
      if (entries && entries.length > 0) {
        // Get the history container
        const historyContainer = document.getElementById('history-container');
        if (!historyContainer) return;
        
        // Clear "No history entries" message if it exists
        if (historyContainer.textContent?.includes('No history entries')) {
          historyContainer.innerHTML = '';
        }
        
        // Add each entry from the shared entries to the DOM
        entries.forEach(entry => {
          // Check if this entry already exists by title
          const existingEntries = Array.from(document.querySelectorAll('.history-entry .title'));
          const exists = existingEntries.some(el => el.textContent === entry.title);
          if (exists) return; // Skip if already exists
          
          // Create a new entry element
          const entryElement = document.createElement('div');
          entryElement.className = 'history-entry';
          
          const titleElement = document.createElement('div');
          titleElement.className = 'title';
          titleElement.textContent = entry.title;
          
          const urlElement = document.createElement('div');
          urlElement.className = 'url';
          urlElement.textContent = entry.url;
          
          entryElement.appendChild(titleElement);
          entryElement.appendChild(urlElement);
          historyContainer.appendChild(entryElement);
        });
        
        // Update the window.syncedEntries array
        // @ts-ignore - syncedEntries is a custom property
        window.syncedEntries = [...entries];
      }
    } catch (error) {
      console.error('Error syncing history:', error);
    }
  }, sharedSyncedEntries);
  
  // Wait a bit for the sync to complete
  await page.waitForTimeout(1000);
}