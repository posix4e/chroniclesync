export const mockDeviceInfo = {
  id: 'test-device-123',
  name: 'Test Device',
  browser: 'Chrome 120.0',
  os: 'linux',
  lastSync: Date.now(),
};

export const createMockHistoryItem = (overrides = {}) => ({
  id: 'test-history-123',
  url: 'https://example.com',
  title: 'Example Page',
  visitTime: Date.now(),
  deviceId: mockDeviceInfo.id,
  deviceInfo: mockDeviceInfo,
  ...overrides,
});

export const mockHistoryItems = [
  createMockHistoryItem(),
  createMockHistoryItem({
    id: 'test-history-124',
    url: 'https://example.com/page2',
    title: 'Example Page 2',
    visitTime: Date.now() - 1000,
  }),
  createMockHistoryItem({
    id: 'test-history-125',
    url: 'https://example.com/page3',
    title: 'Example Page 3',
    visitTime: Date.now() - 2000,
  }),
];