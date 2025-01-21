export interface HealthStatus {
  healthy: boolean;
  error?: string;
}

export interface Location {
  hostname: string;
  [key: string]: unknown;
}

export interface ClientStats {
  clientId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastSync: number;
  dataSize: number;
}

export interface IDBRequestEvent extends Event {
  target: IDBRequest;
}

export interface BrowserMetadata {
  userAgent: string;
  platform: string;
  vendor: string;
  language: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitTime: number;
  typedCount?: number;
  lastVisitTime?: number;
}

export interface SyncedHistory {
  items: HistoryItem[];
  metadata: BrowserMetadata;
  lastSync: number;
}