interface MockResponseOptions {
  ok?: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
}

// Helper to create mock Response objects with error handling
export const createMockResponse = <T>(
  data: T,
  options: MockResponseOptions = {}
): Response => {
  const {
    ok = true,
    status = 200,
    statusText = 'OK',
    headers = { 'Content-Type': 'application/json' }
  } = options;

  // Convert data to JSON string for more realistic behavior
  const jsonString = JSON.stringify(data);
  const textPromise = Promise.resolve(jsonString);

  return {
    json: () => ok ? Promise.resolve(data) : Promise.reject(new Error(statusText)),
    ok,
    status,
    statusText,
    headers: new Headers(headers),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob([jsonString])),
    formData: () => Promise.resolve(new FormData()),
    text: () => textPromise,
    clone: () => createMockResponse(data, options),
    type: 'basic',
    url: 'https://api.chroniclesync.xyz',
    redirected: false
  } as Response;
};