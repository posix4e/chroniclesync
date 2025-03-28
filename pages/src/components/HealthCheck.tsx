import React, { useState } from 'react';
import { API_URL } from '../utils/api';
import type { HealthStatus } from '../../../shared/types';

export function HealthCheck() {
  const [status, setStatus] = useState<string>('Checking...');
  const [lastCheck, setLastCheck] = useState<string>('Never');
  const [statusClass, setStatusClass] = useState<string>('');

  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      const data: HealthStatus = await response.json();
      
      setStatus(data.healthy ? '✅ Healthy' : '❌ Unhealthy');
      setStatusClass(data.healthy ? 'health-ok' : 'health-error');
      setLastCheck(new Date().toLocaleString());
      
      if (!data.healthy && data.error) {
        alert(`Health check failed: ${data.error}`);
      }
    } catch (error) {
      setStatus('❌ Error');
      setStatusClass('health-error');
      setLastCheck(new Date().toLocaleString());
      alert(`Health check error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div id="healthCheck">
      <h2>System Health</h2>
      <div className="health-status">
        <div>Status: <span className={statusClass}>{status}</span></div>
        <div>Last Check: <span>{lastCheck}</span></div>
        <button onClick={checkHealth}>Check Health</button>
      </div>
    </div>
  );
}