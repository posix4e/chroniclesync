import { ModelService } from '../src/services/ModelService';
import * as tf from '@tensorflow/tfjs';

jest.mock('@tensorflow/tfjs', () => ({
  loadGraphModel: jest.fn(),
  tensor2d: jest.fn(),
  tidy: jest.fn(callback => callback()),
  div: jest.fn(),
  norm: jest.fn(),
  matMul: jest.fn(),
  sum: jest.fn()
}));

describe('ModelService', () => {
  let modelService: ModelService;
  const mockConfig = {
    modelUrl: 'mock-url',
    inputLength: 512,
    outputLength: 512,
    threshold: 0.3
  };

  beforeEach(() => {
    modelService = new ModelService(mockConfig);
    jest.clearAllMocks();
  });

  test('init loads the model', async () => {
    const mockModel = {
      predict: jest.fn()
    };
    (tf.loadGraphModel as jest.Mock).mockResolvedValue(mockModel);

    await modelService.init();
    expect(tf.loadGraphModel).toHaveBeenCalledWith(mockConfig.modelUrl);
  });

  test('summarize returns original text for short content', async () => {
    const shortText = 'This is a short sentence.';
    const result = await modelService.summarize(shortText, {
      maxLength: 30,
      minSentences: 3,
      maxSentences: 5
    });

    expect(result).toBe(shortText);
  });

  test('summarize handles longer content', async () => {
    const longText = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
    const mockEncodings = tf.tensor2d([[1, 2], [3, 4]]);
    const mockSimilarityMatrix = tf.tensor2d([[1, 0.5], [0.5, 1]]);
    const mockScores = [1.5, 1.5];

    (tf.tensor2d as jest.Mock).mockReturnValue(mockEncodings);
    (tf.div as jest.Mock).mockReturnValue(mockEncodings);
    (tf.norm as jest.Mock).mockReturnValue(tf.tensor2d([[1], [1]]));
    (tf.matMul as jest.Mock).mockReturnValue(mockSimilarityMatrix);
    (tf.sum as jest.Mock).mockReturnValue({ arraySync: () => mockScores });

    const result = await modelService.summarize(longText, {
      maxLength: 50,
      minSentences: 2,
      maxSentences: 3
    });

    expect(result.split('.').length).toBeLessThanOrEqual(3);
  });
});