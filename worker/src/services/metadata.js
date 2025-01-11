class MetadataService {
  constructor(env) {
    if (!env?.METADATA) {
      throw new Error('METADATA KV binding is required');
    }
    this.kv = env.METADATA;
  }

  async get(clientId) {
    return this.kv.get(clientId, 'json');
  }

  async put(clientId, data) {
    return this.kv.put(clientId, JSON.stringify(data));
  }

  async delete(clientId) {
    return this.kv.delete(clientId);
  }

  async list(options = {}) {
    return this.kv.list(options);
  }

  async updateClientMetadata(clientId, dataSize) {
    return this.put(clientId, {
      lastSync: new Date().toISOString(),
      dataSize
    });
  }

  async validateMetadata(metadata) {
    return metadata && 
           metadata.lastSync && 
           !isNaN(new Date(metadata.lastSync).getTime());
  }
}

export default MetadataService;