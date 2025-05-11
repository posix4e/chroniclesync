import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Global setup for p2p testing
 * - Builds the application
 * - Starts two instances of the application on different ports
 * - Verifies that both instances are running
 */
async function globalSetup() {
  console.log('Starting global setup for p2p testing...');
  
  try {
    // Build the application
    console.log('Building application...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('Application built successfully');
    
    // Start two instances of the application on different ports
    // These will be used for p2p testing
    console.log('Starting application instances...');
    
    // Start first instance on port 12000
    const instance1Process = execSync('PORT=12000 npm run start:p2p', { 
      stdio: 'pipe',
      detached: true
    });
    
    // Start second instance on port 12001
    const instance2Process = execSync('PORT=12001 npm run start:p2p', { 
      stdio: 'pipe',
      detached: true
    });
    
    // Wait for instances to start
    console.log('Waiting for application instances to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify that both instances are running
    console.log('Verifying application instances...');
    
    // Test browser launch
    const browser = await chromium.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
    
    // Test first instance
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    try {
      await page1.goto('http://localhost:12000', { timeout: 30000 });
      console.log('First instance is running');
    } catch (error) {
      console.error('Error connecting to first instance:', error);
      throw new Error('Failed to connect to first instance');
    }
    
    // Test second instance
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    try {
      await page2.goto('http://localhost:12001', { timeout: 30000 });
      console.log('Second instance is running');
    } catch (error) {
      console.error('Error connecting to second instance:', error);
      throw new Error('Failed to connect to second instance');
    }
    
    // Clean up
    await page1.close();
    await context1.close();
    await page2.close();
    await context2.close();
    await browser.close();
    
    console.log('Global setup completed successfully');
  } catch (error) {
    console.error('Error in global setup:', error);
    throw error;
  }
}

export default globalSetup;