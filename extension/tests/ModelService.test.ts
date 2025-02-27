import { ModelService } from '../src/services/ModelService';
import { DEFAULT_SUMMARY_SETTINGS } from '../src/types/summary';
import * as tf from '@tensorflow/tfjs';

jest.mock('@tensorflow/tfjs', () => ({
  loadLayersModel: jest.fn(),
  tensor2d: jest.fn(),
  dispose: jest.fn()
}));

describe('ModelService', () => {
  let modelService: ModelService;

  beforeEach(() => {
    modelService = new ModelService(DEFAULT_SUMMARY_SETTINGS.modelConfig);
    jest.clearAllMocks();
  });

  test('loadModel loads the model successfully', async () => {
    const mockModel = {
      predict: jest.fn()
    };
    (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

    await modelService.loadModel();
    expect(tf.loadLayersModel).toHaveBeenCalledWith(DEFAULT_SUMMARY_SETTINGS.modelConfig.modelUrl);
  });

  test('generateSummary processes text correctly', async () => {
    const mockModel = {
      predict: jest.fn().mockReturnValue({
        data: jest.fn().mockResolvedValue(new Float32Array([0.5, 0.8, 0.3])),
        dispose: jest.fn()
      })
    };
    (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);
    (tf.tensor2d as jest.Mock).mockReturnValue({
      dispose: jest.fn()
    });

    const summary = await modelService.generateSummary('Test text');
    expect(summary).toBeTruthy();
    expect(mockModel.predict).toHaveBeenCalled();
  });

  test('dispose cleans up resources', async () => {
    const mockModel = {
      dispose: jest.fn(),
      predict: jest.fn()
    };
    (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

    await modelService.loadModel();
    modelService.dispose();
    expect(mockModel.dispose).toHaveBeenCalled();
  });
});