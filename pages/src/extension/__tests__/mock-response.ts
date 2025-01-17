// Helper to create mock Response objects
export const createMockResponse = <T>(data: T): Response => {
  const response = new Response();
  Object.defineProperties(response, {
    json: { value: () => Promise.resolve(data) },
    ok: { value: true },
    status: { value: 200 },
    statusText: { value: 'OK' },
    type: { value: 'basic' as const },
    url: { value: 'https://api.chroniclesync.xyz' }
  });
  return response;
};