export interface HealthStatus {
  healthy: boolean;
  error?: string;
}

export interface Location {
  hostname: string;
  [key: string]: unknown;
}