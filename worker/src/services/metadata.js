class MetadataService {
  constructor(env) {
    if (!env?.METADATA) {
      throw new Error('METADATA KV binding is required');
    }
    this.kv = env.METADATA;
    this.ADMIN_PASSWORD_KEY = '_admin_password';
    this.DEFAULT_PASSWORD = 'francesisthebest';
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
    if (!metadata || !metadata.lastSync) return false;
    return !isNaN(new Date(metadata.lastSync).getTime());
  }

  async getAdminPassword() {
    const storedPassword = await this.kv.get(this.ADMIN_PASSWORD_KEY);
    return storedPassword || this.DEFAULT_PASSWORD;
  }

  async setAdminPassword(newPassword) {
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    await this.kv.put(this.ADMIN_PASSWORD_KEY, newPassword);
  }

  async validateAdminPassword(password) {
    const currentPassword = await this.getAdminPassword();
    return password === currentPassword;
  }
}

export default MetadataService;