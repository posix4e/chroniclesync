// Helper to create mock Response objects
export const createMockResponse = <T>(data: T): Response => {
  const jsonData = JSON.stringify(data);
  return new Response(jsonData, {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'application/json'
    }
  });
};