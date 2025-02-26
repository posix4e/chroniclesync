import { HistoryStore } from '../db/HistoryStore';
import { HistoryVisit } from './SyncService';
import { ModelService } from './ModelService';

export class SummaryService {
  private historyStore: HistoryStore;
  private isProcessing: boolean = false;
  private modelService: ModelService;

  constructor(historyStore: HistoryStore) {
    this.historyStore = historyStore;
    this.modelService = ModelService.getInstance();
  }

  private async initModel() {
    await this.modelService.init();
  }

  async startBackgroundProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.isProcessing) {
        const pendingEntries = await this.getPendingSummaries();
        if (pendingEntries.length === 0) {
          // No pending entries, wait before checking again
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        for (const entry of pendingEntries) {
          if (!this.isProcessing) break;
          await this.processEntry(entry);
        }
      }
    } catch (error) {
      console.error('Error in background processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async stopBackgroundProcessing() {
    this.isProcessing = false;
  }

  private async getPendingSummaries(): Promise<HistoryVisit[]> {
    // Get entries that need summarization
    const entries = await this.historyStore.getEntries();
    return entries.filter(entry => 
      !entry.summaryStatus || 
      entry.summaryStatus === 'pending'
    );
  }

  private async processEntry(entry: HistoryVisit) {
    try {
      // Mark as pending before processing
      await this.updateSummaryStatus(entry.visitId, 'pending');

      // Get page content
      const content = await this.getPageContent(entry.url);
      if (!content) {
        throw new Error('Failed to fetch page content');
      }

      // Generate summary
      const summary = await this.generateSummary(content);
      
      // Update entry with summary
      await this.updateSummary(entry.visitId, summary);
    } catch (error) {
      console.error(`Error processing entry ${entry.visitId}:`, error);
      await this.updateSummaryStatus(entry.visitId, 'error', error.message);
    }
  }

  private async getPageContent(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const text = await response.text();
      
      // Extract main content (simple approach - could be improved)
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      // Remove scripts, styles, and other non-content elements
      const scripts = doc.getElementsByTagName('script');
      const styles = doc.getElementsByTagName('style');
      [...scripts, ...styles].forEach(el => el.remove());
      
      // Get text content
      return doc.body.textContent || '';
    } catch (error) {
      console.error('Error fetching page content:', error);
      return null;
    }
  }

  private async generateSummary(content: string): Promise<string> {
    try {
      // Clean up the content
      const cleanContent = content
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,!?]/g, '')
        .trim();

      if (!cleanContent) {
        throw new Error('No valid content to summarize');
      }

      // Generate summary using the model
      const summary = await this.modelService.generateSummary(cleanContent);
      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  private async updateSummary(visitId: string, summary: string): Promise<void> {
    const transaction = this.historyStore['db']!.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    
    return new Promise((resolve, reject) => {
      const request = store.get(visitId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result;
        if (entry) {
          entry.summary = summary;
          entry.summaryStatus = 'completed';
          entry.lastModified = Date.now();
          
          const updateRequest = store.put(entry);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }

  private async updateSummaryStatus(
    visitId: string, 
    status: 'pending' | 'completed' | 'error',
    error?: string
  ): Promise<void> {
    const transaction = this.historyStore['db']!.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    
    return new Promise((resolve, reject) => {
      const request = store.get(visitId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result;
        if (entry) {
          entry.summaryStatus = status;
          if (error) {
            entry.summaryError = error;
          }
          entry.lastModified = Date.now();
          
          const updateRequest = store.put(entry);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }
}