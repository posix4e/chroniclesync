import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModelService } from '../src/services/ModelService';
import { SummaryModelConfig } from '../src/types/summary';
import * as tf from '@tensorflow/tfjs';

vi.mock('@tensorflow/tfjs', () => ({
  loadLayersModel: vi.fn(),
  tidy: vi.fn((fn) => fn()),
  tensor2d: vi.fn(),
  dispose: vi.fn()
}));

describe('ModelService', () => {
  let modelService: ModelService;
  const mockConfig: SummaryModelConfig = {
    modelUrl: 'test-model-url',
    inputLength: 512,
    outputLength: 512,
    threshold: 0.3
  };

  beforeEach(() => {
    modelService = new ModelService(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should load model successfully', async () => {
    const mockModel = {
      predict: vi.fn(),
      dispose: vi.fn()
    };

    (tf.loadLayersModel as any).mockResolvedValue(mockModel);

    await modelService.loadModel();
    expect(tf.loadLayersModel).toHaveBeenCalledWith(mockConfig.modelUrl);
  });

  it('should handle model loading error', async () => {
    const error = new Error('Model loading failed');
    (tf.loadLayersModel as any).mockRejectedValue(error);

    await expect(modelService.loadModel()).rejects.toThrow('Model loading failed');
  });

  it('should generate summary', async () => {
    const mockModel = {
      predict: vi.fn().mockReturnValue({
        matMul: vi.fn().mockReturnValue({
          mean: vi.fn().mockReturnValue({
            dataSync: vi.fn().mockReturnValue([0.5, 0.8, 0.3]),
            dispose: vi.fn()
          })
        }),
        transpose: vi.fn(),
        dispose: vi.fn()
      }),
      dispose: vi.fn()
    };

    (tf.loadLayersModel as any).mockResolvedValue(mockModel);
    (tf.tensor2d as any).mockReturnValue({});

    const text = 'This is a test sentence. Another test sentence. Final test.';
    const summary = await modelService.generateSummary(text);

    expect(summary).toBeTruthy();
    expect(tf.loadLayersModel).toHaveBeenCalled();
  });
});