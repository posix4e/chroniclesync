/**
 * Type definitions for global window functions used in P2P tests
 */

interface Window {
  // P2P Connection Functions
  disconnectP2P(): Promise<void>;
  reconnectP2P(): Promise<void>;
  isPeerAuthenticated(): Promise<boolean>;
  connectWithInvalidCredentials(): Promise<{ success: boolean; error: string }>;
  
  // Data Management Functions
  addData(data: any): Promise<void>;
  getData(id: string): Promise<any>;
  updateData(data: any): Promise<void>;
  checkDataExists(id: string): Promise<boolean>;
  addBatchData(items: any[]): Promise<void>;
  
  // Security Functions
  addDataWithIntegrity(data: any): Promise<void>;
  verifyDataIntegrity(id: string): Promise<{ valid: boolean; hash: string }>;
  simulateDataTampering(): Promise<{ detected: boolean }>;
}