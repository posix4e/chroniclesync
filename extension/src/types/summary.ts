export type SummaryStatus = 'pending' | 'completed' | 'error';

export interface SummaryData {
  content: string;
  status: SummaryStatus;
  version: number;
  lastModified: number;
}

export interface SummarySettings {
  enabled: boolean;
  summaryLength: number;
  minSentences: number;
  maxSentences: number;
  autoSummarize: boolean;
  contentPriority: {
    headlines: boolean;
    lists: boolean;
    quotes: boolean;
  };
  modelConfig: SummaryModelConfig;
}

export interface SummaryModelConfig {
  modelUrl: string;
  inputLength: number;
  outputLength: number;
  threshold: number;
}

export const DEFAULT_SUMMARY_SETTINGS: SummarySettings = {
  enabled: true,
  summaryLength: 30,
  minSentences: 3,
  maxSentences: 10,
  autoSummarize: true,
  contentPriority: {
    headlines: true,
    lists: true,
    quotes: false
  },
  modelConfig: {
    modelUrl: 'https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1',
    inputLength: 512,
    outputLength: 512,
    threshold: 0.3
  }
};