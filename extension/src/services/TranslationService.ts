import { HistoryStore } from '../db/HistoryStore';

export class TranslationService {
  private historyStore: HistoryStore;

  constructor(historyStore: HistoryStore) {
    this.historyStore = historyStore;
  }

  async translateEntry(url: string, title: string): Promise<string> {
    try {
      // Here we would integrate with a translation service like OpenAI
      // For now, we'll create a simple summary
      const summary = `Summary of "${title}": This is a webpage about ${title.toLowerCase()}.`;
      return summary;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }

  async translateUntranslatedEntries(): Promise<void> {
    const entries = await this.historyStore.getUntranslatedEntries();
    console.log('Found untranslated entries:', entries.length);

    for (const entry of entries) {
      try {
        const summary = await this.translateEntry(entry.url, entry.title);
        await this.historyStore.updateTranslation(entry.visitId, summary);
      } catch (error) {
        console.error('Error translating entry:', entry, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.historyStore.markTranslationError(entry.visitId, errorMessage);
      }
    }
  }
}