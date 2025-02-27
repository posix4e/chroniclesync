import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SummaryService } from '../src/services/SummaryService';
import { DEFAULT_SUMMARY_SETTINGS } from '../src/types/summary';

vi.mock('../src/services/ModelService', () => ({
  ModelService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    summarize: vi.fn().mockResolvedValue('Test summary'),
    dispose: vi.fn()
  }))
}));

describe('SummaryService', () => {
  let summaryService: SummaryService;

  beforeEach(() => {
    summaryService = new SummaryService(DEFAULT_SUMMARY_SETTINGS);
  });

  afterEach(() => {
    summaryService.dispose();
    vi.clearAllMocks();
  });

  it('should initialize successfully', async () => {
    await expect(summaryService.initialize()).resolves.not.toThrow();
  });

  it('should return error status when disabled', async () => {
    const disabledService = new SummaryService({
      ...DEFAULT_SUMMARY_SETTINGS,
      enabled: false
    });

    const result = await disabledService.summarize('http://test.com', 'test content');
    expect(result.status).toBe('error');
    expect(result.content).toBe('');
  });

  it('should process content and return summary', async () => {
    const testContent = `
      <html>
        <body>
          <h1>Test Title</h1>
          <p>Test paragraph with more than 50 characters to ensure it's included in the summary.</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
        </body>
      </html>
    `;

    const result = await summaryService.summarize('http://test.com', testContent);
    expect(result.status).toBe('completed');
    expect(result.content).toBeTruthy();
  });

  it('should handle multiple requests for same URL', async () => {
    const url = 'http://test.com';
    const content = '<p>Test content</p>';

    const promise1 = summaryService.summarize(url, content);
    const promise2 = summaryService.summarize(url, content);

    const [result1, result2] = await Promise.all([promise1, promise2]);
    expect(result1).toEqual(result2);
  });
});