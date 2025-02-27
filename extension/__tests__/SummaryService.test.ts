import { SummaryService } from '../src/services/SummaryService';
import { Settings } from '../src/settings/Settings';
import { HistoryEntry } from '../src/types';
import { ModelService } from '../src/services/ModelService';

jest.mock('../src/services/ModelService');

describe('SummaryService', () => {
  let summaryService: SummaryService;
  let mockSettings: Settings;

  beforeEach(() => {
    mockSettings = {
      config: {
        mnemonic: '',
        clientId: '',
        customApiUrl: null,
        environment: 'production',
        expirationDays: 7,
        summary: {
          enabled: true,
          summaryLength: 30,
          minSentences: 3,
          maxSentences: 10,
          autoSummarize: true,
          contentPriority: {
            headlines: true,
            lists: true,
            quotes: false
          }
        }
      }
    } as Settings;

    summaryService = new SummaryService(mockSettings);
  });

  test('processEntry skips processing when summary is disabled', async () => {
    mockSettings.config!.summary.enabled = false;
    const entry: HistoryEntry = {
      url: 'https://example.com',
      title: 'Test Page',
      content: '<p>Test content</p>',
      visitTime: Date.now(),
      syncStatus: 'pending',
      visitId: '1',
      referringVisitId: '0',
      transition: 'link',
      deviceId: 'test-device',
      platform: 'test',
      userAgent: 'test',
      browserName: 'test',
      browserVersion: '1.0',
      lastModified: Date.now()
    };

    const result = await summaryService.processEntry(entry);
    expect(result).toEqual(entry);
  });

  test('processEntry generates summary for valid content', async () => {
    const entry: HistoryEntry = {
      url: 'https://example.com',
      title: 'Test Page',
      content: '<main><p>Test content with multiple sentences. This is another sentence. And a third one.</p></main>',
      visitTime: Date.now(),
      syncStatus: 'pending',
      visitId: '1',
      referringVisitId: '0',
      transition: 'link',
      deviceId: 'test-device',
      platform: 'test',
      userAgent: 'test',
      browserName: 'test',
      browserVersion: '1.0',
      lastModified: Date.now()
    };

    (ModelService.prototype.summarize as jest.Mock).mockResolvedValue('Test content with multiple sentences.');

    const result = await summaryService.processEntry(entry);
    expect(result.summaryStatus).toBe('completed');
    expect(result.summary?.content).toBe('Test content with multiple sentences.');
    expect(result.summary?.status).toBe('completed');
  });

  test('processEntry handles errors gracefully', async () => {
    const entry: HistoryEntry = {
      url: 'https://example.com',
      title: 'Test Page',
      content: '<p>Test content</p>',
      visitTime: Date.now(),
      syncStatus: 'pending',
      visitId: '1',
      referringVisitId: '0',
      transition: 'link',
      deviceId: 'test-device',
      platform: 'test',
      userAgent: 'test',
      browserName: 'test',
      browserVersion: '1.0',
      lastModified: Date.now()
    };

    (ModelService.prototype.summarize as jest.Mock).mockRejectedValue(new Error('Test error'));

    const result = await summaryService.processEntry(entry);
    expect(result.summaryStatus).toBe('error');
    expect(result.summaryError).toBe('Test error');
  });

  test('processPendingEntries processes multiple entries', async () => {
    const entries: HistoryEntry[] = [
      {
        url: 'https://example1.com',
        title: 'Test Page 1',
        content: '<p>Test content 1</p>',
        visitTime: Date.now(),
        syncStatus: 'pending',
        visitId: '1',
        referringVisitId: '0',
        transition: 'link',
        deviceId: 'test-device',
        platform: 'test',
        userAgent: 'test',
        browserName: 'test',
        browserVersion: '1.0',
        lastModified: Date.now()
      },
      {
        url: 'https://example2.com',
        title: 'Test Page 2',
        content: '<p>Test content 2</p>',
        visitTime: Date.now(),
        syncStatus: 'pending',
        summaryStatus: 'pending',
        visitId: '2',
        referringVisitId: '1',
        transition: 'link',
        deviceId: 'test-device',
        platform: 'test',
        userAgent: 'test',
        browserName: 'test',
        browserVersion: '1.0',
        lastModified: Date.now()
      }
    ];

    (ModelService.prototype.summarize as jest.Mock).mockResolvedValue('Summarized content');

    await summaryService.processPendingEntries(entries);
    expect(ModelService.prototype.summarize).toHaveBeenCalledTimes(2);
  });
});