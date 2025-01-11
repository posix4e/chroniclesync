// This function is used by jest-environment-miniflare to provide test bindings
global.getMiniflareBindings = () => {
  return {
    METADATA: getMiniflareKVNamespace('METADATA'),
    STORAGE: getMiniflareR2Bucket('STORAGE'),
    ADMIN_PASSWORD: 'francesisthebest'
  };
};