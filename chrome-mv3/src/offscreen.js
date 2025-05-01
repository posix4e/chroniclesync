// Offscreen document for P2P sync
import * as Automerge from '@automerge/automerge';
import Hyperswarm from 'hyperswarm-web';
import SimplePeer from 'simple-peer';
import { sha256 } from './utils/crypto.js';

// Constants
const MAX_RUNTIME_MINUTES = 2; // Auto-close after 2 minutes
const STATUS_ELEMENT = document.getElementById('status');

// State
let swarm;
let connections = new Map();
let localDoc;
let syncSecret;
let encryptionKey;

// Initialize the offscreen document
async function initialize() {
  updateStatus('Initializing P2P sync...');
  
  try {
    // Get sync data from service worker
    const response = await chrome.runtime.sendMessage({ type: 'get-sync-data' });
    
    if (!response || !response.secret) {
      updateStatus('No sync secret available. Closing...');
      setTimeout(closeOffscreen, 5000);
      return;
    }
    
    syncSecret = response.secret;
    localDoc = response.doc ? Automerge.load(response.doc) : Automerge.init();
    
    // Derive encryption key from secret
    encryptionKey = await deriveEncryptionKey(syncSecret);
    
    // Derive topic from secret
    const topic = await sha256(syncSecret);
    
    // Start P2P networking
    await startP2PNetwork(topic);
    
    // Set auto-close timer
    setTimeout(closeOffscreen, MAX_RUNTIME_MINUTES * 60 * 1000);
  } catch (error) {
    updateStatus(`Error initializing: ${error.message}`);
    console.error('P2P Sync Error:', error);
    setTimeout(closeOffscreen, 10000);
  }
}

// Start P2P networking
async function startP2PNetwork(topic) {
  updateStatus('Starting P2P network...');
  
  try {
    // Create hyperswarm
    swarm = new Hyperswarm();
    
    // Join the swarm with the topic
    const discovery = swarm.join(Buffer.from(topic, 'hex'));
    
    // Listen for new connections
    swarm.on('connection', (socket, info) => {
      handleNewConnection(socket, info);
    });
    
    updateStatus(`Joined swarm with topic: ${topic.slice(0, 10)}...`);
    
    // Wait for discovery
    await discovery.flushed();
    updateStatus('Discovery flushed, looking for peers...');
  } catch (error) {
    updateStatus(`P2P network error: ${error.message}`);
    console.error('P2P Network Error:', error);
  }
}

// Handle new WebRTC connections
function handleNewConnection(socket, info) {
  try {
    const peerId = info.publicKey.toString('hex').slice(0, 8);
    updateStatus(`New connection from peer: ${peerId}`);
    
    // Create a SimplePeer connection
    const peer = new SimplePeer({
      initiator: info.client,
      trickle: false
    });
    
    // Handle SimplePeer events
    peer.on('signal', data => {
      const signalData = JSON.stringify(data);
      socket.write(signalData);
    });
    
    peer.on('data', async data => {
      try {
        // Decrypt the received data
        const decryptedData = await decryptData(data);
        
        // Process the Automerge sync message
        const syncMessage = JSON.parse(decryptedData);
        
        if (syncMessage.type === 'sync-changes') {
          // Send to service worker for processing
          await chrome.runtime.sendMessage({
            type: 'sync-update',
            data: syncMessage.changes
          });
          
          // Send acknowledgment
          sendSyncAck(peer);
        }
      } catch (error) {
        console.error('Error processing peer data:', error);
      }
    });
    
    peer.on('connect', () => {
      updateStatus(`Connected to peer: ${peerId}`);
      connections.set(peerId, peer);
      
      // Send our changes
      sendSyncChanges(peer);
    });
    
    peer.on('close', () => {
      updateStatus(`Disconnected from peer: ${peerId}`);
      connections.delete(peerId);
    });
    
    peer.on('error', err => {
      console.error(`Peer error (${peerId}):`, err);
      connections.delete(peerId);
    });
    
    // Handle incoming signals
    socket.on('data', data => {
      try {
        const signalData = JSON.parse(data.toString());
        peer.signal(signalData);
      } catch (error) {
        console.error('Error processing signal data:', error);
      }
    });
    
    // Store the connection
    connections.set(peerId, { peer, socket });
  } catch (error) {
    console.error('Error handling new connection:', error);
  }
}

// Send sync changes to a peer
async function sendSyncChanges(peer) {
  try {
    // Get the latest document
    const response = await chrome.runtime.sendMessage({ type: 'get-sync-data' });
    const docData = response.doc;
    
    // Create sync message
    const syncMessage = {
      type: 'sync-changes',
      changes: docData
    };
    
    // Encrypt the message
    const encryptedData = await encryptData(JSON.stringify(syncMessage));
    
    // Send to peer
    peer.send(encryptedData);
    
    updateStatus('Sent sync changes to peer');
  } catch (error) {
    console.error('Error sending sync changes:', error);
  }
}

// Send sync acknowledgment
async function sendSyncAck(peer) {
  try {
    const ackMessage = {
      type: 'sync-ack',
      timestamp: Date.now()
    };
    
    // Encrypt the message
    const encryptedData = await encryptData(JSON.stringify(ackMessage));
    
    // Send to peer
    peer.send(encryptedData);
  } catch (error) {
    console.error('Error sending sync ack:', error);
  }
}

// Derive encryption key from secret using PBKDF2
async function deriveEncryptionKey(secret) {
  const encoder = new TextEncoder();
  const secretData = encoder.encode(secret);
  
  // Use a fixed salt for deterministic key derivation
  const salt = encoder.encode('P2PHistorySyncSalt');
  
  // Import the secret as a key
  const importedKey = await crypto.subtle.importKey(
    'raw',
    secretData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive the AES-GCM key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  return derivedKey;
}

// Encrypt data using AES-GCM
async function encryptData(data) {
  try {
    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encode the data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      encryptionKey,
      dataBuffer
    );
    
    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedBuffer), iv.length);
    
    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

// Decrypt data using AES-GCM
async function decryptData(encryptedData) {
  try {
    // Extract IV and encrypted data
    const iv = encryptedData.slice(0, 12);
    const data = encryptedData.slice(12);
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      encryptionKey,
      data
    );
    
    // Decode the data
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}

// Close the offscreen document
function closeOffscreen() {
  updateStatus('Closing P2P sync...');
  
  // Close all connections
  for (const [peerId, { peer }] of connections.entries()) {
    try {
      peer.destroy();
    } catch (error) {
      console.error(`Error closing peer ${peerId}:`, error);
    }
  }
  
  // Destroy the swarm
  if (swarm) {
    try {
      swarm.destroy();
    } catch (error) {
      console.error('Error destroying swarm:', error);
    }
  }
  
  // Notify service worker
  chrome.runtime.sendMessage({ type: 'sync-complete' })
    .catch(error => console.error('Error sending sync-complete:', error));
}

// Update status display
function updateStatus(message) {
  console.log(`P2P Sync: ${message}`);
  if (STATUS_ELEMENT) {
    STATUS_ELEMENT.textContent = message;
  }
}

// Initialize when the document loads
document.addEventListener('DOMContentLoaded', initialize);