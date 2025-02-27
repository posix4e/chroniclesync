import * as tf from '@tensorflow/tfjs';
import { SummaryModelConfig, SummarySettings } from '../types/summary';

export class ModelService {
  private model: tf.LayersModel | null = null;
  private modelConfig: SummaryModelConfig;
  private settings: SummarySettings;
  private isLoading = false;

  constructor(settings: SummarySettings) {
    this.modelConfig = settings.modelConfig;
    this.settings = settings;
  }

  async loadModel(): Promise<void> {
    if (this.model || this.isLoading) return;

    try {
      this.isLoading = true;
      console.log('[Model] Loading model from:', this.modelConfig.modelUrl);
      this.model = await tf.loadLayersModel(this.modelConfig.modelUrl);
      console.log('[Model] Model loaded successfully');
    } catch (error) {
      console.error('[Model] Error loading model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async generateSummary(text: string): Promise<string> {
    if (!this.model) {
      await this.loadModel();
    }

    try {
      const sentences = this.splitIntoSentences(text);
      const embeddings = await this.generateEmbeddings(sentences);
      const importantSentences = this.extractImportantSentences(embeddings, sentences);
      return this.formatSummary(importantSentences);
    } catch (error) {
      console.error('[Model] Error generating summary:', error);
      throw error;
    }
  }

  private splitIntoSentences(text: string): string[] {
    return text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) || [];
  }

  private async generateEmbeddings(sentences: string[]): Promise<tf.Tensor2D> {
    const tokenized = sentences.map(s => 
      s.toLowerCase().split(' ').slice(0, this.modelConfig.inputLength)
    );

    return tf.tidy(() => {
      const input = tf.tensor2d(tokenized.map(tokens => 
        tokens.concat(Array(this.modelConfig.inputLength - tokens.length).fill(''))
      ));
      return this.model!.predict(input) as tf.Tensor2D;
    });
  }

  private extractImportantSentences(embeddings: tf.Tensor2D, sentences: string[]): string[] {
    const scores = tf.tidy(() => {
      const similarities = embeddings.matMul(embeddings.transpose());
      return similarities.mean(1);
    });

    const scoresData = scores.dataSync();
    scores.dispose();
    embeddings.dispose();

    return sentences
      .map((sentence, i) => ({ sentence, score: scoresData[i] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, this.settings.maxSentences)
      .filter(item => item.score > this.modelConfig.threshold)
      .map(item => item.sentence);
  }

  private formatSummary(sentences: string[]): string {
    return sentences.join(' ');
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}