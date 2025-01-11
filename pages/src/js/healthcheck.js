export class HealthCheck {
  constructor(apiUrl, clientId = null) {
    this.apiUrl = apiUrl;
    this.clientId = clientId;
    this.lastCheckTime = null;
    this.currentStatus = null;
  }

  setClientId(clientId) {
    this.clientId = clientId;
  }

  getLastCheckTime() {
    return this.lastCheckTime;
  }

  getCurrentStatus() {
    return this.currentStatus;
  }

  async check() {
    try {
      const response = await fetch(
        `${this.apiUrl}/health?clientId=${this.clientId || 'system'}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Health check request failed');
      }

      const data = await response.json();
      this.lastCheckTime = new Date();
      this.currentStatus = {
        healthy: data.healthy,
        error: data.error,
        timestamp: data.timestamp
      };

      return this.currentStatus;
    } catch (error) {
      const now = new Date();
      this.lastCheckTime = now;
      this.currentStatus = {
        healthy: false,
        error: error.message,
        timestamp: now.toISOString ? now.toISOString() : now.toString()
      };
      throw error;
    }
  }

  updateUI(healthStatus, lastCheck) {
    if (!healthStatus || !lastCheck) {
      throw new Error('Missing required DOM elements');
    }

    const status = this.currentStatus;
    if (!status) {
      healthStatus.textContent = 'Not checked';
      healthStatus.className = '';
      lastCheck.textContent = 'Never';
      return;
    }

    healthStatus.textContent = status.healthy ? '✅ Healthy' : '❌ Unhealthy';
    healthStatus.className = status.healthy ? 'health-ok' : 'health-error';
    lastCheck.textContent = this.lastCheckTime.toLocaleString();

    return status;
  }
}