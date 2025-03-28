export interface DeviceInfo {
  deviceId: string;
  platform: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
}

export interface PageContent {
  content: string;
  summary: string;
  extractedAt: number;
}