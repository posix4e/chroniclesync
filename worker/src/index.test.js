import worker from './index.js';

describe('Worker API', () => {
  let env;

  beforeEach(() => {
    env = {
      DB: {
        prepare: jest.fn().mockReturnThis(),
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({}),
        all: jest.fn().mockResolvedValue({ results: [] }),
      },
      STORAGE: {
        get: jest.fn().mockResolvedValue(null),
        put: jest.fn().mockResolvedValue({}),
        list: jest.fn().mockResolvedValue({ objects: [] }),
        head: jest.fn().mockResolvedValue({}),
      },
    };
  });

  it('requires client ID', async () => {
    const req = new Request('https://api.chroniclesync.xyz/');
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('Client ID required');
  });

  it('handles non-existent client data', async () => {
    const req = new Request('https://api.chroniclesync.xyz/?clientId=test123');
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('No data found');
  });

  it('stores and retrieves client data', async () => {
    const testData = { key: 'value' };
    
    // Mock storage.get to return data after it's stored
    env.STORAGE.get.mockImplementation((key) => {
      if (key === 'test123/data') {
        return {
          body: JSON.stringify(testData),
          uploaded: new Date(),
        };
      }
      return null;
    });
    
    // Store data
    const postReq = new Request('https://api.chroniclesync.xyz/?clientId=test123', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
    const postRes = await worker.fetch(postReq, env);
    expect(postRes.status).toBe(200);

    // Retrieve data
    const getReq = new Request('https://api.chroniclesync.xyz/?clientId=test123');
    const getRes = await worker.fetch(getReq, env);
    expect(getRes.status).toBe(200);
    const data = await getRes.json();
    expect(data).toEqual(testData);
  });

  it('requires authentication for admin access', async () => {
    const req = new Request('https://api.chroniclesync.xyz/admin');
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(401);
  });

  it('allows admin access with correct password', async () => {
    const req = new Request('https://api.chroniclesync.xyz/admin/clients', {
      headers: {
        'Authorization': 'Bearer francesisthebest',
      },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});