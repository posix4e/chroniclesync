import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SummaryService } from '../src/services/SummaryService';
import { ModelService } from '../src/services/ModelService';
import { DEFAULT_SUMMARY_SETTINGS } from '../src/types/summary';

vi.mock('../src/services/ModelService');

describe('SummaryService', () => {
  let summaryService: SummaryService;
  let mockModelService: jest.Mocked<ModelService>;

  beforeEach(() => {
    mockModelService = {
      loadModel: vi.fn(),
      generateSummary: vi.fn(),
      dispose: vi.fn()
    } as any;

    (ModelService as any).mockImplementation(() => mockModelService);
    summaryService = new SummaryService({ ...DEFAULT_SUMMARY_SETTINGS });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not generate summary when disabled', async () => {
    const service = new SummaryService({
      ...DEFAULT_SUMMARY_SETTINGS,
      enabled: false
    });

    const result = await service.summarize('http://test.com', 'test content');
    expect(result.status).toBe('completed');
    expect(result.content).toBe('');
    expect(mockModelService.generateSummary).not.toHaveBeenCalled();
  });

  it('should generate summary successfully', async () => {
    const mockSummary = 'Generated summary';
    mockModelService.generateSummary.mockResolvedValue(mockSummary);

    const result = await summaryService.summarize(
      'http://test.com',
      '<p>Test content</p>'
    );

    expect(result.status).toBe('completed');
    expect(result.content).toBe(mockSummary);
  });

  it('should handle summarization error', async () => {
    mockModelService.generateSummary.mockRejectedValue(new Error('Summary failed'));

    const result = await summaryService.summarize(
      'http://test.com',
      '<p>Test content</p>'
    );

    expect(result.status).toBe('error');
    expect(result.content).toBe('');
  });

  it('should extract main content based on priority settings', async () => {
    const html = `
      <h1>Main Title</h1>
      <p>First paragraph</p>
      <ul><li>List item</li></ul>
      <blockquote>Quote text</blockquote>
    `;

    mockModelService.generateSummary.mockImplementation(
      content => Promise.resolve(content)
    );

    const result = await summaryService.summarize('http://test.com', html);
    expect(result.content).toContain('Main Title');
    expect(result.content).toContain('First paragraph');
    expect(result.content).toContain('List item');
  });

  it('should reuse existing summary promise for same URL', async () => {
    mockModelService.generateSummary.mockResolvedValue('Summary');

    const promise1 = summaryService.summarize('http://test.com', 'content');
    const promise2 = summaryService.summarize('http://test.com', 'content');

    expect(promise1).toBe(promise2);
    expect(mockModelService.generateSummary).toHaveBeenCalledTimes(1);
  });
});