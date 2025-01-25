import { test as base } from '@playwright/test';

interface DevServer {
  url: string;
  port: number;
}

export async function getDevServer(): Promise<DevServer> {
  // Use the first available port from runtime information
  const port = 51145;
  const url = `http://localhost:${port}`;
  
  return { url, port };
}