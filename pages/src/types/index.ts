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

export interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
}

export interface HistoryState {
  entries: HistoryEntry[];
  lastSync: number;
  syncing: boolean;
  error?: string;
}