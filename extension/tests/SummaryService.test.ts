import { SummaryService } from '../src/services/SummaryService';
import { DEFAULT_SUMMARY_SETTINGS } from '../src/types/summary';

describe('SummaryService', () => {
  let summaryService: SummaryService;

  beforeEach(() => {
    summaryService = new SummaryService(DEFAULT_SUMMARY_SETTINGS);
  });

  test('summarizeContent returns empty summary when disabled', async () => {
    const service = new SummaryService({
      ...DEFAULT_SUMMARY_SETTINGS,
      enabled: false
    });

    const result = await service.summarizeContent('http://example.com', 'Test content');
    expect(result.content).toBe('');
    expect(result.status).toBe('completed');
  });

  test('summarizeContent processes content correctly', async () => {
    const content = `
      <html>
        <body>
          <h1>Test Headline</h1>
          <p>Test paragraph content.</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
        </body>
      </html>
    `;

    const result = await summaryService.summarizeContent('http://example.com', content);
    expect(result.status).toBe('completed');
    expect(result.version).toBe(1);
    expect(result.lastModified).toBeDefined();
  });

  test('summarizeContent handles errors gracefully', async () => {
    const invalidContent = null;
    const result = await summaryService.summarizeContent('http://example.com', invalidContent as any);
    expect(result.status).toBe('error');
  });

  test('summarizeContent queues multiple requests for same URL', async () => {
    const content = '<p>Test content</p>';
    const url = 'http://example.com';

    const promise1 = summaryService.summarizeContent(url, content);
    const promise2 = summaryService.summarizeContent(url, content);

    expect(promise1).toBe(promise2);

    const [result1, result2] = await Promise.all([promise1, promise2]);
    expect(result1).toEqual(result2);
  });
});