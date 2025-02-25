import { pipeline, env } from '@xenova/transformers';

// Disable local model loading
env.allowLocalModels = false;

// Use the Deepseek model (or a similar one that's optimized for the web)
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

class ModelWorker {
  static task = 'feature-extraction';
  static model = null;
  static pipe = null;

  static async getInstance() {
    if (!this.pipe) {
      this.pipe = await pipeline(this.task, MODEL_NAME);
    }
    return this.pipe;
  }

  static async processHistory(historyItems) {
    const pipe = await this.getInstance();
    const embeddings = [];
    
    for (const item of historyItems) {
      // Process title and URL
      const text = `${item.title} ${item.url}`;
      const embedding = await pipe(text, {
        pooling: 'mean',
        normalize: true,
      });
      
      embeddings.push({
        id: item.id,
        embedding: Array.from(embedding.data),
        timestamp: item.lastVisitTime,
      });
    }
    
    return embeddings;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  try {
    switch (type) {
      case 'process_history':
        const embeddings = await ModelWorker.processHistory(data);
        self.postMessage({ type: 'embeddings_ready', data: embeddings });
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
});