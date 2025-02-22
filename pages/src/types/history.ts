import { EncryptedData } from '../utils/encryption';

export interface HistoryItem {
  visitId: string;
  url: string | (EncryptedData & { encrypted: boolean });
  title: string | (EncryptedData & { encrypted: boolean });
  visitTime: number;
  visitCount?: number;
  platform: string;
  browserName: string;
  browserVersion?: string;
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
  pagination: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}