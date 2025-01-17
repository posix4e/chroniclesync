// Helper to create mock Response objects
export const createMockResponse = <T>(data: T): Response => ({
  json: () => Promise.resolve(data),
  headers: new Headers(),
  ok: true,
  redirected: false,
  status: 200,
  statusText: 'OK',
  type: 'basic' as const,
  url: 'https://api.chroniclesync.xyz',
  clone: () => Promise.resolve({} as Response),
  body: null,
  bodyUsed: false,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  blob: () => Promise.resolve(new Blob()),
  formData: () => Promise.resolve(new FormData()),
  text: () => Promise.resolve('')
} as Response);