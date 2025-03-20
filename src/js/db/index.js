/**
 * Database module for ChronicleSync
 * Centralizes database operations and provides a consistent API
 */

// Import the existing HistoryStore
import { HistoryStore } from '@extension/db/HistoryStore.js';

// Re-export for backward compatibility
export { HistoryStore };

// Create a singleton instance for use throughout the application
const historyStore = new HistoryStore();
export { historyStore };

/**
 * Enhanced database operations
 */
export const Database = {
  /**
   * Initialize the database
   * @returns {Promise<void>}
   */
  async init() {
    await historyStore.init();
    console.log('Database initialized');
  },

  /**
   * Add a history item
   * @param {Object} item - The history item to add
   * @returns {Promise<Object>} - The added item with ID
   */
  async addHistoryItem(item) {
    return await historyStore.addItem(item);
  },

  /**
   * Get all history items
   * @returns {Promise<Array>} - Array of history items
   */
  async getAllHistoryItems() {
    return await historyStore.getAll();
  },

  /**
   * Get history items by URL
   * @param {string} url - The URL to search for
   * @returns {Promise<Array>} - Matching history items
   */
  async getHistoryItemsByUrl(url) {
    return await historyStore.getByUrl(url);
  },

  /**
   * Delete a history item
   * @param {string} id - The ID of the item to delete
   * @returns {Promise<boolean>} - Success status
   */
  async deleteHistoryItem(id) {
    return await historyStore.deleteItem(id);
  },

  /**
   * Clear all history
   * @returns {Promise<boolean>} - Success status
   */
  async clearHistory() {
    return await historyStore.clear();
  }
};

export default Database;