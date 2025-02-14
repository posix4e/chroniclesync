export interface HistoryItem {
  url: string;
  title: string;
  visitTime: number;
  visitCount: number;
  deviceId: string;
  platform: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
}

export interface HistoryResponse {
  history: HistoryItem[];
  deviceInfo: {
    deviceId: string;
    platform: string;
    userAgent: string;
    browserName: string;
    browserVersion: string;
  };
}