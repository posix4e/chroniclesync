/**
 * Generic database service for common operations
 */
export class DatabaseService {
  private db: IDBDatabase | null = null;
  
  constructor(
    private readonly dbName: string,
    private readonly dbVersion: number,
    private readonly storeConfigs: StoreConfig[]
  ) {}
  
  /**
   * Initializes the database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Initializing IndexedDB: ${this.dbName} v${this.dbVersion}`);
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        console.log('IndexedDB opened successfully');
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('Upgrading IndexedDB schema...');
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        
        // Create or update stores based on configuration
        this.storeConfigs.forEach(config => {
          if (!db.objectStoreNames.contains(config.name)) {
            const store = db.createObjectStore(config.name, { keyPath: config.keyPath });
            
            // Create indexes
            config.indexes.forEach(index => {
              store.createIndex(index.name, index.keyPath, index.options);
            });
            
            console.log(`Created store: ${config.name}`);
          }
          
          // Handle version-specific upgrades
          if (config.upgradeCallback) {
            config.upgradeCallback(db, oldVersion, event);
          }
        });
      };
    });
  }
  
  /**
   * Adds an item to a store
   */
  async add<T>(storeName: string, item: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const request = store.put(item);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  /**
   * Gets an item by key
   */
  async get<T>(storeName: string, key: string | number): Promise<T | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }
  
  /**
   * Gets all items from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  
  /**
   * Gets items by index
   */
  async getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      
      const request = index.getAll(value);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  
  /**
   * Deletes an item by key
   */
  async delete(storeName: string, key: string | number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  /**
   * Updates an item
   */
  async update<T>(storeName: string, item: T): Promise<void> {
    return this.add(storeName, item);
  }
  
  /**
   * Executes a function within a transaction
   */
  async withTransaction<T>(
    storeNames: string[], 
    mode: IDBTransactionMode, 
    callback: (transaction: IDBTransaction) => Promise<T>
  ): Promise<T> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(storeNames, mode);
    return callback(transaction);
  }
}

/**
 * Configuration for a database store
 */
export interface StoreConfig {
  name: string;
  keyPath: string;
  indexes: IndexConfig[];
  upgradeCallback?: (db: IDBDatabase, oldVersion: number, event: IDBVersionChangeEvent) => void;
}

/**
 * Configuration for a store index
 */
export interface IndexConfig {
  name: string;
  keyPath: string;
  options?: IDBIndexParameters;
}