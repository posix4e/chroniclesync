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