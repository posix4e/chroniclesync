import * as tf from '@tensorflow/tfjs';
import { SummaryModelConfig } from '../types/summary';

export class ModelService {
  private model: tf.LayersModel | null = null;
  private config: SummaryModelConfig;

  constructor(config: SummaryModelConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      console.log('[Model] Loading model from:', this.config.modelUrl);
      this.model = await tf.loadLayersModel(this.config.modelUrl);
      console.log('[Model] Model loaded successfully');
    } catch (error) {
      console.error('[Model] Error loading model:', error);
      throw error;
    }
  }

  async summarize(text: string): Promise<string> {
    if (!this.model) {
      throw new Error('[Model] Model not initialized');
    }

    try {
      console.log('[Model] Processing text for summarization');
      const input = this.preprocessText(text);
      const tensor = tf.tensor2d([input]);
      
      const prediction = await this.model.predict(tensor) as tf.Tensor;
      const summary = await this.postprocessPrediction(prediction);
      
      tensor.dispose();
      prediction.dispose();
      
      return summary;
    } catch (error) {
      console.error('[Model] Error during summarization:', error);
      throw error;
    }
  }

  private preprocessText(text: string): number[] {
    const tokens = text.toLowerCase().split(/\s+/).slice(0, this.config.inputLength);
    return tokens.map(token => this.tokenToId(token));
  }

  private async postprocessPrediction(prediction: tf.Tensor): Promise<string> {
    const scores = await prediction.data();
    const threshold = this.config.threshold;
    
    const selectedSentences = Array.from(scores)
      .map((score, idx) => ({ score, idx }))
      .filter(item => item.score > threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.outputLength);

    return selectedSentences.map(item => item.idx.toString()).join(' ');
  }

  private tokenToId(token: string): number {
    // Simple hash function for demo purposes
    // In production, use a proper tokenizer
    return Math.abs(token.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0)) % this.config.inputLength;
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}