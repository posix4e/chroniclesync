import { EncryptedData } from '../utils/encryption';

export interface HistoryItem {
  url: string | EncryptedData;
  title: string | EncryptedData | null;
  visitTime: number;
  visitCount: number;
  deviceId: string;
  platform: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
  isEncrypted?: boolean;
}

export interface HistoryFilters {
  startDate?: number;
  endDate?: number;
  searchQuery?: string;
  platform?: string;
  browser?: string;
  page?: number;
  pageSize?: number;
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
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}