export interface HistoryItem {
  id: string;
  url: string;
  title?: string;
  lastVisitTime: string;
  visitCount: number;
  typedCount?: number;
}

export interface SyncEvent {
  type: 'sync-event';
  event: 'sync-complete' | 'sync-error';
  data: {
    success?: boolean;
    error?: Error;
  };
}

export interface GetHistoryMessage {
  type: 'get-history';
}

export interface GetSyncStatusMessage {
  type: 'get-sync-status';
}

export interface ForceSyncMessage {
  type: 'force-sync';
}

export type ExtensionMessage = 
  | SyncEvent
  | GetHistoryMessage
  | GetSyncStatusMessage
  | ForceSyncMessage;