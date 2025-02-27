import * as tf from '@tensorflow/tfjs';
import { SummaryModelConfig } from '../types/summary';

export class ModelService {
  private model: tf.LayersModel | null = null;
  private encoder: tf.GraphModel | null = null;
  private readonly config: SummaryModelConfig;

  constructor(config: SummaryModelConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    console.log('[Model] Initializing Universal Sentence Encoder...');
    try {
      this.encoder = await tf.loadGraphModel(this.config.modelUrl);
      console.log('[Model] Successfully loaded Universal Sentence Encoder');
    } catch (error) {
      console.error('[Model] Failed to load Universal Sentence Encoder:', error);
      throw error;
    }
  }

  private async encodeText(text: string): Promise<tf.Tensor2D> {
    if (!this.encoder) {
      throw new Error('Model not initialized');
    }

    const sentences = this.splitIntoSentences(text);
    return tf.tidy(() => {
      const input = tf.tensor1d([text]);
      const output = this.encoder!.predict(input) as tf.Tensor;
      return output.reshape([1, -1]) as tf.Tensor2D;
    });
  }

  private splitIntoSentences(text: string): string[] {
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }

  private async calculateSimilarityMatrix(encodings: tf.Tensor2D): Promise<tf.Tensor2D> {
    return tf.tidy(() => {
      const normalizedEncodings = tf.div(
        encodings,
        tf.norm(encodings, 2, -1, true)
      ) as tf.Tensor2D;
      return tf.matMul(normalizedEncodings, normalizedEncodings.transpose()) as tf.Tensor2D;
    });
  }

  private async rankSentences(text: string): Promise<number[]> {
    const sentences = this.splitIntoSentences(text);
    const encodings = await this.encodeText(text);
    const similarityMatrix = await this.calculateSimilarityMatrix(encodings);

    const scores = tf.tidy(() => {
      const sentenceScores = tf.sum(similarityMatrix, 1);
      return sentenceScores.arraySync() as number[];
    });

    encodings.dispose();
    similarityMatrix.dispose();

    return scores;
  }

  async summarize(text: string, options: {
    maxLength: number;
    minSentences: number;
    maxSentences: number;
  }): Promise<string> {
    console.log('[Model] Starting summarization with options:', options);

    const sentences = this.splitIntoSentences(text);
    console.log(`[Model] Split text into ${sentences.length} sentences`);

    if (sentences.length <= options.minSentences) {
      console.log('[Model] Text is too short, returning original');
      return text;
    }

    console.log('[Model] Calculating sentence rankings...');
    const scores = await this.rankSentences(text);
    
    console.log('[Model] Selecting top sentences...');
    const indices = scores.map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(options.maxSentences, Math.ceil(sentences.length * options.maxLength / 100)))
      .sort((a, b) => a.index - b.index)
      .map(item => item.index);

    console.log(`[Model] Selected ${indices.length} sentences for summary`);
    
    const summary = indices.map(i => sentences[i]).join(' ');
    console.log('[Model] Generated summary length:', summary.length);
    
    return summary;
  }

  dispose(): void {
    if (this.encoder) {
      this.encoder.dispose();
      this.encoder = null;
    }
  }
}