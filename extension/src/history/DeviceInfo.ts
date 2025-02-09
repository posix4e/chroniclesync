import { DeviceInfo } from './types';

export class DeviceInfoManager {
  private static instance: DeviceInfoManager;
  private deviceId: string;

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  public static getInstance(): DeviceInfoManager {
    if (!DeviceInfoManager.instance) {
      DeviceInfoManager.instance = new DeviceInfoManager();
    }
    return DeviceInfoManager.instance;
  }

  private getOrCreateDeviceId(): string {
    const storedId = localStorage.getItem('chroniclesync_device_id');
    if (storedId) return storedId;

    const newId = crypto.randomUUID();
    localStorage.setItem('chroniclesync_device_id', newId);
    return newId;
  }

  public async getDeviceInfo(): Promise<DeviceInfo> {
    const userAgent = navigator.userAgent;
    const browserInfo = this.parseBrowserInfo(userAgent);

    return {
      deviceId: this.deviceId,
      os: this.getOS(userAgent),
      browser: browserInfo.browser,
      version: browserInfo.version
    };
  }

  private getOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'MacOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private parseBrowserInfo(userAgent: string): { browser: string; version: string } {
    if (userAgent.includes('Chrome')) {
      const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
      return { browser: 'Chrome', version: match?.[1] || 'Unknown' };
    }
    if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
      return { browser: 'Firefox', version: match?.[1] || 'Unknown' };
    }
    if (userAgent.includes('Safari')) {
      const match = userAgent.match(/Version\/(\d+\.\d+)/);
      return { browser: 'Safari', version: match?.[1] || 'Unknown' };
    }
    return { browser: 'Unknown', version: 'Unknown' };
  }
}