// Helper to create mock Response objects
export const createMockResponse = <T>(data: T): Response => ({
  json: () => Promise.resolve(data),
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  body: null,
  bodyUsed: false,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  blob: () => Promise.resolve(new Blob()),
  formData: () => Promise.resolve(new FormData()),
  text: () => Promise.resolve(''),
  clone: () => createMockResponse(data),
  type: 'basic',
  url: 'https://api.chroniclesync.xyz',
  redirected: false
} as Response);