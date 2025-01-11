import MetadataService from './metadata.js';

describe('MetadataService', () => {
  let env;
  let service;

  beforeEach(() => {
    env = {
      METADATA: {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        list: jest.fn()
      }
    };
    service = new MetadataService(env);
  });

  it('requires METADATA KV binding', () => {
    expect(() => new MetadataService({})).toThrow('METADATA KV binding is required');
  });

  it('gets metadata', async () => {
    const testData = { lastSync: new Date().toISOString(), dataSize: 100 };
    env.METADATA.get.mockResolvedValue(testData);
    
    const result = await service.get('test-client');
    expect(result).toEqual(testData);
    expect(env.METADATA.get).toHaveBeenCalledWith('test-client', 'json');
  });

  it('puts metadata', async () => {
    const testData = { lastSync: new Date().toISOString(), dataSize: 100 };
    await service.put('test-client', testData);
    
    expect(env.METADATA.put).toHaveBeenCalledWith(
      'test-client',
      JSON.stringify(testData)
    );
  });

  it('deletes metadata', async () => {
    await service.delete('test-client');
    expect(env.METADATA.delete).toHaveBeenCalledWith('test-client');
  });

  it('lists metadata', async () => {
    const testList = { keys: [{ name: 'test-client' }] };
    env.METADATA.list.mockResolvedValue(testList);
    
    const result = await service.list();
    expect(result).toEqual(testList);
    expect(env.METADATA.list).toHaveBeenCalledWith({});
  });

  it('updates client metadata', async () => {
    const dataSize = 100;
    await service.updateClientMetadata('test-client', dataSize);
    
    expect(env.METADATA.put).toHaveBeenCalledWith(
      'test-client',
      expect.stringContaining('"dataSize":100')
    );
  });

  it('validates metadata', async () => {
    const validMetadata = {
      lastSync: new Date().toISOString(),
      dataSize: 100
    };
    expect(await service.validateMetadata(validMetadata)).toBe(true);

    const invalidMetadata = {
      lastSync: 'invalid-date',
      dataSize: 100
    };
    expect(await service.validateMetadata(invalidMetadata)).toBe(false);

    expect(await service.validateMetadata(null)).toBe(false);
    expect(await service.validateMetadata({})).toBe(false);
  });
});