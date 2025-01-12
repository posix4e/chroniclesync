export interface ClientStats {
  clientId: string;
  lastSync: string;
  dataSize: number;
}

export interface HealthStatus {
  healthy: boolean;
  error?: string;
}