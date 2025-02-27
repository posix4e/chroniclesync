import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModelService } from '../src/services/ModelService';
import { DEFAULT_SUMMARY_SETTINGS } from '../src/types/summary';
import * as tf from '@tensorflow/tfjs';

vi.mock('@tensorflow/tfjs', () => ({
  loadLayersModel: vi.fn(),
  tensor2d: vi.fn(),
  dispose: vi.fn()
}));

describe('ModelService', () => {
  let modelService: ModelService;

  beforeEach(() => {
    modelService = new ModelService(DEFAULT_SUMMARY_SETTINGS.modelConfig);
  });

  afterEach(() => {
    modelService.dispose();
    vi.clearAllMocks();
  });

  it('should initialize successfully', async () => {
    const mockModel = {
      predict: vi.fn(),
      dispose: vi.fn()
    };
    
    (tf.loadLayersModel as any).mockResolvedValue(mockModel);

    await expect(modelService.initialize()).resolves.not.toThrow();
  });

  it('should throw error if summarize is called before initialization', async () => {
    await expect(modelService.summarize('test text')).rejects.toThrow('Model not initialized');
  });

  it('should summarize text successfully', async () => {
    const mockModel = {
      predict: vi.fn().mockReturnValue({
        data: vi.fn().mockResolvedValue(new Float32Array([0.5, 0.8, 0.3])),
        dispose: vi.fn()
      }),
      dispose: vi.fn()
    };

    (tf.loadLayersModel as any).mockResolvedValue(mockModel);
    (tf.tensor2d as any).mockReturnValue({
      dispose: vi.fn()
    });

    await modelService.initialize();
    const summary = await modelService.summarize('test text');

    expect(summary).toBeTruthy();
    expect(mockModel.predict).toHaveBeenCalled();
  });
});