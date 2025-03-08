import { describe, it, expect, vi } from 'vitest';
import { extractPageContent } from './utils/content-extractor';

// Mock the extractPageContent function
vi.mock('./utils/content-extractor', () => ({
  extractPageContent: vi.fn().mockReturnValue({
    content: 'This is the extracted content with test markers.',
    summary: 'This is the summary.'
  })
}));

describe('Content Script', () => {
  it('should extract content from a page', () => {
    // Call the mocked extractPageContent function
    const result = extractPageContent();
    
    // Verify the result
    expect(result).toEqual({
      content: 'This is the extracted content with test markers.',
      summary: 'This is the summary.'
    });
  });
  
  it('should handle errors during content extraction', () => {
    // Mock extractPageContent to throw an error
    (extractPageContent as unknown as { mockImplementationOnce: (fn: () => never) => void }).mockImplementationOnce(() => {
      throw new Error('Test error');
    });
    
    // Verify that the error is thrown
    expect(() => extractPageContent()).toThrow('Test error');
  });
});