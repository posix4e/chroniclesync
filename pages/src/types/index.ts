import type { HealthStatus, Location } from '../../../shared/types';

export type { HealthStatus, Location };

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