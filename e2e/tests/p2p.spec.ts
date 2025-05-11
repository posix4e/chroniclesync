import { test, expect } from '@playwright/test';
import { 
  createP2PInstancePage, 
  waitForP2PConnection,
  generateTestId,
  addNote,
  noteExists,
  waitForNoteToAppear,
  toggleP2PConnection,
  syncHistory
} from '../utils/p2p-helpers';

/**
 * ChronicleSync P2P Tests
 * 
 * These tests demonstrate basic p2p sync functionality without mocks.
 * They test real p2p connections between two instances of the application.
 */

test.describe('P2P Basic Functionality', () => {
  test('should establish p2p connection between two instances', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    try {
      // Create pages for both instances
      const page1 = await createP2PInstancePage(context1, 12000);
      const page2 = await createP2PInstancePage(context2, 12001);
      
      // Wait for both instances to establish p2p connections
      await waitForP2PConnection(page1);
      await waitForP2PConnection(page2);
      
      // Verify connection status indicators
      await expect(page1.locator('[data-testid="p2p-status-connected"]')).toBeVisible();
      await expect(page2.locator('[data-testid="p2p-status-connected"]')).toBeVisible();
      
      // Take screenshots for debugging
      await page1.screenshot({ path: 'test-results/connection-page1.png' });
      await page2.screenshot({ path: 'test-results/connection-page2.png' });
    } finally {
      // Clean up
      await context1.close();
      await context2.close();
    }
  });
  
  test('should synchronize notes between two instances', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    try {
      // Create pages for both instances
      const page1 = await createP2PInstancePage(context1, 12000);
      const page2 = await createP2PInstancePage(context2, 12001);
      
      // Wait for both instances to establish p2p connections
      await waitForP2PConnection(page1);
      await waitForP2PConnection(page2);
      
      // Generate a unique note title
      const noteId = generateTestId();
      const noteTitle = `Test Note ${noteId}`;
      const noteContent = 'This is a test note for p2p synchronization';
      
      // Add a note in the first instance
      await addNote(page1, noteTitle, noteContent);
      
      // Verify the note was added to the first instance
      expect(await noteExists(page1, noteTitle)).toBeTruthy();
      
      // Sync history to the second instance
      await syncHistory(page2);
      
      // Wait for the note to be synchronized to the second instance
      await waitForNoteToAppear(page2, noteTitle, 15000);
      
      // Verify the note exists in the second instance
      expect(await noteExists(page2, noteTitle)).toBeTruthy();
      
      // Take screenshots for debugging
      await page1.screenshot({ path: 'test-results/sync-page1.png' });
      await page2.screenshot({ path: 'test-results/sync-page2.png' });
    } finally {
      // Clean up
      await context1.close();
      await context2.close();
    }
  });
  
  test('should synchronize notes after reconnection', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    try {
      // Create pages for both instances
      const page1 = await createP2PInstancePage(context1, 12000);
      const page2 = await createP2PInstancePage(context2, 12001);
      
      // Wait for both instances to establish p2p connections
      await waitForP2PConnection(page1);
      await waitForP2PConnection(page2);
      
      // Disconnect the second instance
      await toggleP2PConnection(page2);
      
      // Wait for disconnected status
      await page2.waitForSelector('[data-testid="p2p-status-disconnected"]', { 
        state: 'visible',
        timeout: 5000
      });
      
      // Generate a unique note title
      const noteId = generateTestId();
      const noteTitle = `Offline Note ${noteId}`;
      const noteContent = 'This note was created while the other instance was offline';
      
      // Add a note in the first instance while the second is disconnected
      await addNote(page1, noteTitle, noteContent);
      
      // Verify the note was added to the first instance
      expect(await noteExists(page1, noteTitle)).toBeTruthy();
      
      // Reconnect the second instance
      await toggleP2PConnection(page2);
      
      // Wait for reconnection
      await waitForP2PConnection(page2, 15000);
      
      // Sync history to the second instance
      await syncHistory(page2);
      
      // Wait for the note to be synchronized to the second instance
      await waitForNoteToAppear(page2, noteTitle, 15000);
      
      // Verify the note exists in the second instance
      expect(await noteExists(page2, noteTitle)).toBeTruthy();
      
      // Take screenshots for debugging
      await page1.screenshot({ path: 'test-results/reconnect-page1.png' });
      await page2.screenshot({ path: 'test-results/reconnect-page2.png' });
    } finally {
      // Clean up
      await context1.close();
      await context2.close();
    }
  });
  
  test('should synchronize notes bidirectionally', async ({ browser }) => {
    // Create two separate contexts for the two instances
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    try {
      // Create pages for both instances
      const page1 = await createP2PInstancePage(context1, 12000);
      const page2 = await createP2PInstancePage(context2, 12001);
      
      // Wait for both instances to establish p2p connections
      await waitForP2PConnection(page1);
      await waitForP2PConnection(page2);
      
      // Generate unique note titles for both instances
      const noteId1 = generateTestId();
      const noteTitle1 = `Note from Instance 1 ${noteId1}`;
      const noteContent1 = 'This note was created in instance 1';
      
      const noteId2 = generateTestId();
      const noteTitle2 = `Note from Instance 2 ${noteId2}`;
      const noteContent2 = 'This note was created in instance 2';
      
      // Add notes in both instances
      await addNote(page1, noteTitle1, noteContent1);
      await addNote(page2, noteTitle2, noteContent2);
      
      // Verify the notes were added to their respective instances
      expect(await noteExists(page1, noteTitle1)).toBeTruthy();
      expect(await noteExists(page2, noteTitle2)).toBeTruthy();
      
      // Sync history between instances
      await syncHistory(page2);
      await syncHistory(page1);
      
      // Wait for the notes to be synchronized between instances
      await waitForNoteToAppear(page2, noteTitle1, 15000);
      await waitForNoteToAppear(page1, noteTitle2, 15000);
      
      // Verify the notes exist in both instances
      expect(await noteExists(page1, noteTitle1)).toBeTruthy();
      expect(await noteExists(page1, noteTitle2)).toBeTruthy();
      expect(await noteExists(page2, noteTitle1)).toBeTruthy();
      expect(await noteExists(page2, noteTitle2)).toBeTruthy();
      
      // Take screenshots for debugging
      await page1.screenshot({ path: 'test-results/bidirectional-page1.png' });
      await page2.screenshot({ path: 'test-results/bidirectional-page2.png' });
    } finally {
      // Clean up
      await context1.close();
      await context2.close();
    }
  });
});