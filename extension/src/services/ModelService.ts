import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

export class ModelService {
  private static instance: ModelService;
  private model: use.UniversalSentenceEncoder | null = null;
  private isLoading: boolean = false;
  private loadingPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  async init(): Promise<void> {
    if (this.model) return;
    if (this.isLoading && this.loadingPromise) {
      return this.loadingPromise;
    }

    this.isLoading = true;
    this.loadingPromise = this.loadModel();
    await this.loadingPromise;
    return;
  }

  private async loadModel(): Promise<void> {
    try {
      console.log('Loading Universal Sentence Encoder model...');
      // Load the model with a smaller size for browser environments
      this.model = await use.load({ modelUrl: 'https://tfhub.dev/google/universal-sentence-encoder-lite/1' });
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    } finally {
      this.isLoading = false;
      this.loadingPromise = null;
    }
  }

  async generateSummary(text: string): Promise<string> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      // Split text into sentences (simple approach)
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      
      // Get embeddings for all sentences
      const embeddings = await this.model.embed(sentences);
      const embeddingsTensor = embeddings as unknown as tf.Tensor2D;
      
      // Calculate sentence importance scores using cosine similarity
      const scores = await this.calculateSentenceScores(embeddingsTensor);
      
      // Select top sentences (about 20% of the total)
      const numSentences = Math.max(1, Math.ceil(sentences.length * 0.2));
      const topSentences = this.selectTopSentences(sentences, scores, numSentences);
      
      // Combine sentences in original order
      return topSentences.join(' ');
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  private async calculateSentenceScores(embeddings: tf.Tensor2D): Promise<number[]> {
    return tf.tidy(() => {
      // Calculate pairwise cosine similarity between sentences
      const normalizedEmbeddings = tf.div(
        embeddings,
        tf.norm(embeddings, 2, 1, true)
      );
      const similarityMatrix = tf.matMul(
        normalizedEmbeddings,
        normalizedEmbeddings.transpose()
      );
      
      // Calculate importance score for each sentence
      const scores = tf.sum(similarityMatrix, 1).arraySync() as number[];
      
      return scores;
    });
  }

  private selectTopSentences(
    sentences: string[],
    scores: number[],
    numSentences: number
  ): string[] {
    // Create array of indices and sort by scores
    const indices = Array.from(Array(sentences.length).keys());
    indices.sort((a, b) => scores[b] - scores[a]);
    
    // Select top N sentences and sort them by original position
    const selectedIndices = indices.slice(0, numSentences);
    selectedIndices.sort((a, b) => a - b);
    
    // Return selected sentences in original order
    return selectedIndices.map(i => sentences[i]);
  }
}