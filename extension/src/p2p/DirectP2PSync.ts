import { HistoryEntry, DeviceInfo } from '../types';

interface PeerConnection {
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  deviceId: string;
  lastSeen: number;
}

interface PingMessage {
  type: 'ping';
  data: { timestamp: number };
  clientId: string;
  timestamp: number;
}

interface PongMessage {
  type: 'pong';
  data: { timestamp: number };
  clientId: string;
  timestamp: number;
}

interface HistoryMessage {
  type: 'history';
  data: HistoryEntry[];
  clientId: string;
  timestamp: number;
}

interface DeviceMessage {
  type: 'device';
  data: DeviceInfo;
  clientId: string;
  timestamp: number;
}

interface SyncRequestMessage {
  type: 'sync-request';
  data: { since?: number };
  clientId: string;
  timestamp: number;
}

interface SyncResponseMessage {
  type: 'sync-response';
  data: { history: HistoryEntry[] };
  clientId: string;
  timestamp: number;
}

type P2PMessage = PingMessage | PongMessage | HistoryMessage | DeviceMessage | SyncRequestMessage | SyncResponseMessage;

/**
 * DirectP2PSync - A simplified version of P2PSync that doesn't rely on a discovery server
 * Instead, it uses direct connections with pre-shared connection info
 */
export class DirectP2PSync {
  private clientId: string;
  private connections: Map<string, PeerConnection> = new Map();
  private isConnected = false;
  private encryptionKey: CryptoKey | null = null;
  private onHistoryReceived: ((entries: HistoryEntry[]) => void) | null = null;
  private onDeviceReceived: ((device: DeviceInfo) => void) | null = null;
  private peerIds: string[] = [];

  constructor(clientId: string, mnemonic: string, peerIds: string[] = []) {
    this.clientId = clientId;
    this.peerIds = peerIds;
    this.initEncryptionKey(mnemonic);
  }

  private async initEncryptionKey(mnemonic: string): Promise<void> {
    // Generate a key from the mnemonic using PBKDF2
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(mnemonic),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Use the client ID as salt
    const salt = encoder.encode(this.clientId);

    // Derive the key
    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Set callback for when history entries are received
   */
  public setOnHistoryReceived(callback: (entries: HistoryEntry[]) => void): void {
    this.onHistoryReceived = callback;
  }

  /**
   * Set callback for when device info is received
   */
  public setOnDeviceReceived(callback: (device: DeviceInfo) => void): void {
    this.onDeviceReceived = callback;
  }

  /**
   * Get list of connected peers
   */
  public getConnectedPeers(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Connect to a specific peer using their ID
   */
  public async connectToPeer(peerId: string, iceServers?: RTCIceServer[]): Promise<void> {
    if (this.connections.has(peerId)) {
      console.log(`Already connected to peer ${peerId}`);
      return;
    }

    try {
      // Use provided ICE servers or default to Google STUN servers
      const peerConnection = new RTCPeerConnection({
        iceServers: iceServers || [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      });

      const dataChannel = peerConnection.createDataChannel('chroniclesync', {
        ordered: true
      });

      this.setupDataChannel(dataChannel, peerId);

      this.connections.set(peerId, {
        connection: peerConnection,
        dataChannel,
        deviceId: peerId,
        lastSeen: Date.now()
      });

      // Create and store the offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      console.log(`Created offer for peer ${peerId}. Please exchange SDP manually.`);
      console.log(`Local SDP for ${peerId}:`, JSON.stringify(peerConnection.localDescription));
      
      // In a real implementation, you would need to exchange this SDP with the peer
      // through some out-of-band mechanism (e.g., copy-paste, QR code, etc.)
    } catch (error) {
      console.error(`Error connecting to peer ${peerId}:`, error);
    }
  }

  /**
   * Connect to all known peers
   */
  public async connect(iceServers?: RTCIceServer[]): Promise<void> {
    try {
      // Connect to all pre-configured peers
      for (const peerId of this.peerIds) {
        if (peerId !== this.clientId) {
          await this.connectToPeer(peerId, iceServers);
        }
      }
      this.isConnected = true;
      return Promise.resolve();
    } catch (error) {
      console.error('Error connecting to peers:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Disconnect from all peers
   */
  public disconnect(): void {
    // Close all peer connections
    for (const [peerId, connection] of this.connections.entries()) {
      if (connection.dataChannel) {
        connection.dataChannel.close();
      }
      connection.connection.close();
      this.connections.delete(peerId);
    }

    this.isConnected = false;
  }

  /**
   * Process an SDP answer from a peer
   */
  public async processAnswer(peerId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const connection = this.connections.get(peerId);
    if (!connection) {
      console.error(`No connection found for peer ${peerId}`);
      return;
    }

    try {
      await connection.connection.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log(`Set remote description for peer ${peerId}`);
    } catch (error) {
      console.error(`Error setting remote description for peer ${peerId}:`, error);
    }
  }

  /**
   * Process an SDP offer from a peer
   */
  public async processOffer(peerId: string, sdp: RTCSessionDescriptionInit, iceServers?: RTCIceServer[]): Promise<RTCSessionDescriptionInit | null> {
    if (this.connections.has(peerId)) {
      console.log(`Already have a connection for peer ${peerId}`);
      return null;
    }

    try {
      // Use provided ICE servers or default to Google STUN servers
      const peerConnection = new RTCPeerConnection({
        iceServers: iceServers || [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      });

      peerConnection.ondatachannel = (event) => {
        const dataChannel = event.channel;
        this.setupDataChannel(dataChannel, peerId);
        
        this.connections.set(peerId, {
          connection: peerConnection,
          dataChannel,
          deviceId: peerId,
          lastSeen: Date.now()
        });
      };

      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log(`Created answer for peer ${peerId}`);
      return peerConnection.localDescription;
    } catch (error) {
      console.error(`Error processing offer from peer ${peerId}:`, error);
      return null;
    }
  }

  /**
   * Add an ICE candidate from a peer
   */
  public async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const connection = this.connections.get(peerId);
    if (!connection) {
      console.error(`No connection found for peer ${peerId}`);
      return;
    }

    try {
      await connection.connection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log(`Added ICE candidate for peer ${peerId}`);
    } catch (error) {
      console.error(`Error adding ICE candidate for peer ${peerId}:`, error);
    }
  }

  private setupDataChannel(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.onopen = () => {
      console.log(`Data channel opened with peer ${peerId}`);
      
      // Send a ping to the peer
      this.sendToPeer(peerId, {
        type: 'ping',
        data: { timestamp: Date.now() },
        clientId: this.clientId,
        timestamp: Date.now()
      });
    };

    dataChannel.onclose = () => {
      console.log(`Data channel closed with peer ${peerId}`);
      this.connections.delete(peerId);
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel error with peer ${peerId}:`, error);
    };

    dataChannel.onmessage = async (event) => {
      try {
        const encryptedData = JSON.parse(event.data);
        const decryptedMessage = await this.decryptMessage(encryptedData);
        
        if (!decryptedMessage) {
          console.error('Failed to decrypt message');
          return;
        }

        await this.handlePeerMessage(decryptedMessage, peerId);
      } catch (error) {
        console.error('Error handling data channel message:', error);
      }
    };
  }

  private async handlePeerMessage(message: P2PMessage, peerId: string): Promise<void> {
    // Update last seen timestamp
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.lastSeen = Date.now();
    }

    switch (message.type) {
    case 'ping': {
      const pingMessage = message as PingMessage;
      // Respond with a pong
      this.sendToPeer(peerId, {
        type: 'pong',
        data: { timestamp: pingMessage.data.timestamp },
        clientId: this.clientId,
        timestamp: Date.now()
      });
      break;
    }
        
    case 'pong': {
      const pongMessage = message as PongMessage;
      // Calculate round-trip time
      const rtt = Date.now() - pongMessage.data.timestamp;
      console.log(`Ping to ${peerId} took ${rtt}ms`);
      break;
    }
        
    case 'history': {
      const historyMessage = message as HistoryMessage;
      // Handle received history entries
      if (this.onHistoryReceived) {
        this.onHistoryReceived(historyMessage.data);
      }
      break;
    }
        
    case 'device': {
      const deviceMessage = message as DeviceMessage;
      // Handle received device info
      if (this.onDeviceReceived) {
        this.onDeviceReceived(deviceMessage.data);
      }
      break;
    }
        
    case 'sync-request':
      // Handle sync request
      // This would typically trigger sending our history entries
      // Implementation depends on how we want to handle sync requests
      break;
        
    case 'sync-response': {
      const syncResponseMessage = message as SyncResponseMessage;
      // Handle sync response
      // This would typically contain history entries from the peer
      if (this.onHistoryReceived) {
        this.onHistoryReceived(syncResponseMessage.data.history);
      }
      break;
    }
    }
  }

  public async sendHistoryEntries(entries: HistoryEntry[]): Promise<void> {
    // Send history entries to all connected peers
    for (const [peerId, connection] of this.connections.entries()) {
      if (connection.dataChannel && connection.dataChannel.readyState === 'open') {
        await this.sendToPeer(peerId, {
          type: 'history',
          data: entries,
          clientId: this.clientId,
          timestamp: Date.now()
        });
      }
    }
  }

  public async sendDeviceInfo(device: DeviceInfo): Promise<void> {
    // Send device info to all connected peers
    for (const [peerId, connection] of this.connections.entries()) {
      if (connection.dataChannel && connection.dataChannel.readyState === 'open') {
        await this.sendToPeer(peerId, {
          type: 'device',
          data: device,
          clientId: this.clientId,
          timestamp: Date.now()
        });
      }
    }
  }

  public async requestSync(): Promise<void> {
    // Request sync from all connected peers
    for (const [peerId, connection] of this.connections.entries()) {
      if (connection.dataChannel && connection.dataChannel.readyState === 'open') {
        await this.sendToPeer(peerId, {
          type: 'sync-request',
          data: { since: Date.now() },
          clientId: this.clientId,
          timestamp: Date.now()
        } as SyncRequestMessage);
      }
    }
  }

  private async sendToPeer(peerId: string, message: P2PMessage): Promise<void> {
    const connection = this.connections.get(peerId);
    if (!connection || !connection.dataChannel || connection.dataChannel.readyState !== 'open') {
      console.error(`Cannot send message to peer ${peerId}: not connected`);
      return;
    }

    try {
      const encryptedMessage = await this.encryptMessage(message);
      connection.dataChannel.send(JSON.stringify(encryptedMessage));
    } catch (error) {
      console.error(`Error sending message to peer ${peerId}:`, error);
    }
  }

  private async encryptMessage(message: P2PMessage): Promise<{ iv: string, data: string }> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      this.encryptionKey,
      data
    );

    return {
      iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      data: Array.from(new Uint8Array(encryptedData)).map(b => b.toString(16).padStart(2, '0')).join('')
    };
  }

  private async decryptMessage(encryptedMessage: { iv: string, data: string }): Promise<P2PMessage | null> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    try {
      const iv = new Uint8Array(encryptedMessage.iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const encryptedData = new Uint8Array(encryptedMessage.data.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.encryptionKey,
        encryptedData
      );

      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedData);
      return JSON.parse(decryptedString) as P2PMessage;
    } catch (error) {
      console.error('Error decrypting message:', error);
      return null;
    }
  }
}