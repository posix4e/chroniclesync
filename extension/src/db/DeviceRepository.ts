import { DatabaseService, StoreConfig } from './DatabaseService';
import { DeviceInfo } from '../types';

/**
 * Repository for managing device information
 */
export class DeviceRepository {
  private readonly STORE_NAME = 'devices';
  private dbService: DatabaseService;
  
  constructor() {
    const storeConfigs: StoreConfig[] = [
      {
        name: this.STORE_NAME,
        keyPath: 'deviceId',
        indexes: [
          { name: 'lastSeen', keyPath: 'lastSeen' }
        ]
      }
    ];
    
    this.dbService = new DatabaseService('chroniclesync', 3, storeConfigs);
  }
  
  /**
   * Initializes the repository
   */
  async init(): Promise<void> {
    await this.dbService.init();
  }
  
  /**
   * Updates device information
   */
  async updateDevice(deviceInfo: DeviceInfo): Promise<void> {
    const existingDevice = await this.dbService.get<DeviceInfo>(this.STORE_NAME, deviceInfo.deviceId);
    
    const updatedDevice: DeviceInfo = {
      ...deviceInfo,
      lastSeen: Date.now(),
      firstSeen: existingDevice?.firstSeen || Date.now()
    };
    
    await this.dbService.update(this.STORE_NAME, updatedDevice);
  }
  
  /**
   * Gets all devices
   */
  async getDevices(): Promise<DeviceInfo[]> {
    return this.dbService.getAll<DeviceInfo>(this.STORE_NAME);
  }
}