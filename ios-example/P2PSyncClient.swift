import Foundation
import WebRTC

/**
 * Example iOS P2P Sync Client for ChronicleSync
 * 
 * This is a simplified example showing how to implement the P2P sync protocol
 * on iOS devices to be compatible with the Chrome extension.
 */
class P2PSyncClient: NSObject {
    // MARK: - Properties
    
    private let clientId: String
    private let discoveryServer: String
    private let mnemonic: String
    private var webSocket: URLSessionWebSocketTask?
    private var peerConnections: [String: RTCPeerConnection] = [:]
    private var dataChannels: [String: RTCDataChannel] = [:]
    private var encryptionKey: SecKey?
    private var isConnected = false
    private var reconnectAttempts = 0
    private let maxReconnectAttempts = 5
    private var reconnectTimer: Timer?
    
    // Callbacks
    var onHistoryReceived: (([HistoryEntry]) -> Void)?
    var onDeviceReceived: ((DeviceInfo) -> Void)?
    var onConnectionStatusChanged: ((Bool) -> Void)?
    
    // MARK: - Initialization
    
    init(clientId: String, discoveryServer: String, mnemonic: String) {
        self.clientId = clientId
        self.discoveryServer = discoveryServer
        self.mnemonic = mnemonic
        super.init()
        
        initEncryptionKey()
    }
    
    // MARK: - Public Methods
    
    func connect() {
        // Generate room ID from the first 8 chars of clientId
        let roomId = String(clientId.prefix(8))
        
        // Create WebSocket URL with query parameters
        var urlComponents = URLComponents(string: discoveryServer)!
        urlComponents.queryItems = [
            URLQueryItem(name: "clientId", value: clientId),
            URLQueryItem(name: "roomId", value: roomId)
        ]
        
        let url = urlComponents.url!
        let session = URLSession(configuration: .default, delegate: self, delegateQueue: .main)
        webSocket = session.webSocketTask(with: url)
        webSocket?.resume()
        
        // Start receiving messages
        receiveMessage()
    }
    
    func disconnect() {
        // Close all peer connections
        for (peerId, connection) in peerConnections {
            dataChannels[peerId]?.close()
            connection.close()
        }
        
        peerConnections.removeAll()
        dataChannels.removeAll()
        
        // Close WebSocket
        webSocket?.cancel(with: .normalClosure, reason: nil)
        webSocket = nil
        
        // Stop reconnect timer
        reconnectTimer?.invalidate()
        reconnectTimer = nil
        
        isConnected = false
        onConnectionStatusChanged?(false)
    }
    
    func sendHistoryEntries(_ entries: [HistoryEntry]) {
        // Send history entries to all connected peers
        for (peerId, _) in dataChannels {
            sendToPeer(peerId: peerId, message: P2PMessage(
                type: "history",
                data: entries,
                clientId: clientId,
                timestamp: Date().timeIntervalSince1970
            ))
        }
    }
    
    func sendDeviceInfo(_ device: DeviceInfo) {
        // Send device info to all connected peers
        for (peerId, _) in dataChannels {
            sendToPeer(peerId: peerId, message: P2PMessage(
                type: "device",
                data: device,
                clientId: clientId,
                timestamp: Date().timeIntervalSince1970
            ))
        }
    }
    
    func requestSync() {
        // Request sync from all connected peers
        for (peerId, _) in dataChannels {
            sendToPeer(peerId: peerId, message: P2PMessage(
                type: "sync-request",
                data: ["lastSync": Date().timeIntervalSince1970],
                clientId: clientId,
                timestamp: Date().timeIntervalSince1970
            ))
        }
    }
    
    // MARK: - Private Methods
    
    private func initEncryptionKey() {
        // Generate encryption key from mnemonic using PBKDF2
        // Implementation would use CommonCrypto or CryptoKit
        // This is a simplified example
    }
    
    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .success(let message):
                switch message {
                case .data(let data):
                    self.handleWebSocketData(data)
                case .string(let string):
                    if let data = string.data(using: .utf8) {
                        self.handleWebSocketData(data)
                    }
                @unknown default:
                    break
                }
                
                // Continue receiving messages
                self.receiveMessage()
                
            case .failure(let error):
                print("WebSocket receive error: \(error)")
                self.handleWebSocketDisconnection()
            }
        }
    }
    
    private func handleWebSocketData(_ data: Data) {
        do {
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let type = json["type"] as? String {
                
                switch type {
                case "peers":
                    if let peers = json["peers"] as? [String] {
                        for peerId in peers {
                            if peerId != clientId {
                                connectToPeer(peerId: peerId)
                            }
                        }
                    }
                    
                case "peer-joined":
                    if let peerId = json["peerId"] as? String, peerId != clientId {
                        connectToPeer(peerId: peerId)
                    }
                    
                case "peer-left":
                    if let peerId = json["peerId"] as? String {
                        peerConnections[peerId]?.close()
                        peerConnections.removeValue(forKey: peerId)
                        dataChannels.removeValue(forKey: peerId)
                    }
                    
                case "signal":
                    if let peerId = json["peerId"] as? String,
                       let signal = json["signal"] as? [String: Any] {
                        handleSignal(from: peerId, signal: signal)
                    }
                    
                case "pong":
                    // Handle pong response
                    break
                    
                default:
                    break
                }
            }
        } catch {
            print("Error parsing WebSocket message: \(error)")
        }
    }
    
    private func handleWebSocketDisconnection() {
        isConnected = false
        onConnectionStatusChanged?(false)
        
        // Try to reconnect
        if reconnectAttempts < maxReconnectAttempts {
            reconnectAttempts += 1
            let delay = min(pow(2.0, Double(reconnectAttempts)), 30.0)
            
            reconnectTimer?.invalidate()
            reconnectTimer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { [weak self] _ in
                self?.connect()
            }
        }
    }
    
    private func connectToPeer(peerId: String) {
        if peerConnections[peerId] != nil {
            return
        }
        
        // Create RTCPeerConnection
        let config = RTCConfiguration()
        config.iceServers = [
            RTCIceServer(urlStrings: ["stun:stun.l.google.com:19302"]),
            RTCIceServer(urlStrings: ["stun:stun1.l.google.com:19302"])
        ]
        
        let constraints = RTCMediaConstraints(
            mandatoryConstraints: nil,
            optionalConstraints: ["DtlsSrtpKeyAgreement": "true"]
        )
        
        let connection = RTCPeerConnectionFactory().peerConnection(
            with: config,
            constraints: constraints,
            delegate: self
        )
        
        peerConnections[peerId] = connection
        
        // Create data channel
        let dataChannelConfig = RTCDataChannelConfiguration()
        dataChannelConfig.isOrdered = true
        
        if let dataChannel = connection.dataChannel(
            forLabel: "chroniclesync",
            configuration: dataChannelConfig
        ) {
            dataChannel.delegate = self
            dataChannels[peerId] = dataChannel
        }
        
        // Create and send offer
        connection.offer(for: RTCMediaConstraints(
            mandatoryConstraints: nil,
            optionalConstraints: nil
        )) { [weak self] (sdp, error) in
            guard let self = self, let sdp = sdp else {
                print("Failed to create offer: \(error?.localizedDescription ?? "unknown error")")
                return
            }
            
            connection.setLocalDescription(sdp) { error in
                if let error = error {
                    print("Failed to set local description: \(error.localizedDescription)")
                    return
                }
                
                // Send offer to peer via WebSocket
                let message: [String: Any] = [
                    "type": "signal",
                    "targetId": peerId,
                    "signal": [
                        "type": "offer",
                        "sdp": sdp.sdp
                    ]
                ]
                
                self.sendWebSocketMessage(message)
            }
        }
    }
    
    private func handleSignal(from peerId: String, signal: [String: Any]) {
        guard let type = signal["type"] as? String else { return }
        
        var peerConnection = peerConnections[peerId]
        
        if peerConnection == nil {
            // Create new peer connection if it doesn't exist
            let config = RTCConfiguration()
            config.iceServers = [
                RTCIceServer(urlStrings: ["stun:stun.l.google.com:19302"]),
                RTCIceServer(urlStrings: ["stun:stun1.l.google.com:19302"])
            ]
            
            let constraints = RTCMediaConstraints(
                mandatoryConstraints: nil,
                optionalConstraints: ["DtlsSrtpKeyAgreement": "true"]
            )
            
            peerConnection = RTCPeerConnectionFactory().peerConnection(
                with: config,
                constraints: constraints,
                delegate: self
            )
            
            peerConnections[peerId] = peerConnection
        }
        
        guard let connection = peerConnection else { return }
        
        switch type {
        case "offer":
            if let sdpString = signal["sdp"] as? String {
                let sdp = RTCSessionDescription(type: .offer, sdp: sdpString)
                connection.setRemoteDescription(sdp) { [weak self] error in
                    if let error = error {
                        print("Failed to set remote description: \(error.localizedDescription)")
                        return
                    }
                    
                    // Create answer
                    connection.answer(for: RTCMediaConstraints(
                        mandatoryConstraints: nil,
                        optionalConstraints: nil
                    )) { sdp, error in
                        guard let self = self, let sdp = sdp else {
                            print("Failed to create answer: \(error?.localizedDescription ?? "unknown error")")
                            return
                        }
                        
                        connection.setLocalDescription(sdp) { error in
                            if let error = error {
                                print("Failed to set local description: \(error.localizedDescription)")
                                return
                            }
                            
                            // Send answer to peer via WebSocket
                            let message: [String: Any] = [
                                "type": "signal",
                                "targetId": peerId,
                                "signal": [
                                    "type": "answer",
                                    "sdp": sdp.sdp
                                ]
                            ]
                            
                            self.sendWebSocketMessage(message)
                        }
                    }
                }
            }
            
        case "answer":
            if let sdpString = signal["sdp"] as? String {
                let sdp = RTCSessionDescription(type: .answer, sdp: sdpString)
                connection.setRemoteDescription(sdp) { error in
                    if let error = error {
                        print("Failed to set remote description: \(error.localizedDescription)")
                    }
                }
            }
            
        case "candidate":
            if let candidateDict = signal["candidate"] as? [String: Any],
               let sdpMid = candidateDict["sdpMid"] as? String,
               let sdpMLineIndex = candidateDict["sdpMLineIndex"] as? Int32,
               let candidateString = candidateDict["candidate"] as? String {
                
                let candidate = RTCIceCandidate(
                    sdpMid: sdpMid,
                    sdpMLineIndex: sdpMLineIndex,
                    sdp: candidateString
                )
                
                connection.add(candidate) { error in
                    if let error = error {
                        print("Failed to add ICE candidate: \(error.localizedDescription)")
                    }
                }
            }
            
        default:
            break
        }
    }
    
    private func sendWebSocketMessage(_ message: [String: Any]) {
        do {
            let data = try JSONSerialization.data(withJSONObject: message)
            webSocket?.send(.data(data)) { error in
                if let error = error {
                    print("WebSocket send error: \(error)")
                }
            }
        } catch {
            print("Error serializing WebSocket message: \(error)")
        }
    }
    
    private func sendToPeer(peerId: String, message: P2PMessage) {
        guard let dataChannel = dataChannels[peerId], dataChannel.readyState == .open else {
            print("Cannot send message to peer \(peerId): not connected")
            return
        }
        
        do {
            // Encrypt message
            let encryptedMessage = try encryptMessage(message)
            let data = try JSONSerialization.data(withJSONObject: encryptedMessage)
            
            let buffer = RTCDataBuffer(data: data, isBinary: false)
            dataChannel.sendData(buffer)
        } catch {
            print("Error sending message to peer \(peerId): \(error)")
        }
    }
    
    private func encryptMessage(_ message: P2PMessage) throws -> [String: String] {
        // Encrypt message using AES-GCM with key derived from mnemonic
        // This is a simplified example
        // Real implementation would use CommonCrypto or CryptoKit
        
        // Generate random IV
        var iv = Data(count: 12)
        _ = iv.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, 12, $0.baseAddress!) }
        
        // Serialize message to JSON
        let messageData = try JSONSerialization.data(withJSONObject: message.dictionary)
        
        // In a real implementation, encrypt the data here
        // For this example, we'll just return a placeholder
        
        return [
            "iv": iv.base64EncodedString(),
            "data": messageData.base64EncodedString()
        ]
    }
    
    private func decryptMessage(_ encryptedMessage: [String: String]) throws -> P2PMessage? {
        // Decrypt message using AES-GCM with key derived from mnemonic
        // This is a simplified example
        // Real implementation would use CommonCrypto or CryptoKit
        
        guard let ivString = encryptedMessage["iv"],
              let dataString = encryptedMessage["data"],
              let ivData = Data(base64Encoded: ivString),
              let encryptedData = Data(base64Encoded: dataString) else {
            return nil
        }
        
        // In a real implementation, decrypt the data here
        // For this example, we'll just parse the unencrypted data
        
        if let json = try JSONSerialization.jsonObject(with: encryptedData) as? [String: Any],
           let type = json["type"] as? String,
           let data = json["data"],
           let clientId = json["clientId"] as? String,
           let timestamp = json["timestamp"] as? TimeInterval {
            
            return P2PMessage(
                type: type,
                data: data,
                clientId: clientId,
                timestamp: timestamp
            )
        }
        
        return nil
    }
}

// MARK: - URLSessionWebSocketDelegate

extension P2PSyncClient: URLSessionWebSocketDelegate {
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        print("WebSocket connected")
        isConnected = true
        reconnectAttempts = 0
        onConnectionStatusChanged?(true)
        
        // Request peers list
        sendWebSocketMessage(["type": "get-peers"])
    }
    
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        print("WebSocket disconnected with code: \(closeCode)")
        handleWebSocketDisconnection()
    }
}

// MARK: - RTCPeerConnectionDelegate

extension P2PSyncClient: RTCPeerConnectionDelegate {
    func peerConnection(_ peerConnection: RTCPeerConnection, didChange state: RTCPeerConnectionState) {
        print("PeerConnection state changed: \(state.rawValue)")
    }
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didAdd stream: RTCMediaStream) {
        // Not used for data channels
    }
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didRemove stream: RTCMediaStream) {
        // Not used for data channels
    }
    
    func peerConnectionShouldNegotiate(_ peerConnection: RTCPeerConnection) {
        // Handle renegotiation if needed
    }
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceConnectionState) {
        print("ICE connection state changed: \(newState.rawValue)")
    }
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceGatheringState) {
        print("ICE gathering state changed: \(newState.rawValue)")
    }
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didGenerate candidate: RTCIceCandidate) {
        // Find the peer ID for this connection
        guard let peerId = peerConnections.first(where: { $0.value === peerConnection })?.key else {
            return
        }
        
        // Send the ICE candidate to the peer via WebSocket
        let message: [String: Any] = [
            "type": "signal",
            "targetId": peerId,
            "signal": [
                "type": "candidate",
                "candidate": [
                    "sdpMid": candidate.sdpMid ?? "",
                    "sdpMLineIndex": candidate.sdpMLineIndex,
                    "candidate": candidate.sdp
                ]
            ]
        ]
        
        sendWebSocketMessage(message)
    }
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didRemove candidates: [RTCIceCandidate]) {
        // Not needed for this implementation
    }
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didOpen dataChannel: RTCDataChannel) {
        // Find the peer ID for this connection
        guard let peerId = peerConnections.first(where: { $0.value === peerConnection })?.key else {
            return
        }
        
        dataChannel.delegate = self
        dataChannels[peerId] = dataChannel
        
        print("Data channel opened with peer \(peerId)")
        
        // Send a ping to the peer
        sendToPeer(peerId: peerId, message: P2PMessage(
            type: "ping",
            data: ["timestamp": Date().timeIntervalSince1970],
            clientId: clientId,
            timestamp: Date().timeIntervalSince1970
        ))
    }
}

// MARK: - RTCDataChannelDelegate

extension P2PSyncClient: RTCDataChannelDelegate {
    func dataChannelDidChangeState(_ dataChannel: RTCDataChannel) {
        print("Data channel state changed: \(dataChannel.readyState.rawValue)")
    }
    
    func dataChannel(_ dataChannel: RTCDataChannel, didReceiveMessageWith buffer: RTCDataBuffer) {
        // Find the peer ID for this data channel
        guard let peerId = dataChannels.first(where: { $0.value === dataChannel })?.key else {
            return
        }
        
        do {
            if let json = try JSONSerialization.jsonObject(with: buffer.data) as? [String: String] {
                if let message = try decryptMessage(json) {
                    handlePeerMessage(message, from: peerId)
                }
            }
        } catch {
            print("Error handling data channel message: \(error)")
        }
    }
    
    private func handlePeerMessage(_ message: P2PMessage, from peerId: String) {
        switch message.type {
        case "ping":
            // Respond with a pong
            if let timestamp = (message.data as? [String: Any])?["timestamp"] as? TimeInterval {
                sendToPeer(peerId: peerId, message: P2PMessage(
                    type: "pong",
                    data: ["timestamp": timestamp],
                    clientId: clientId,
                    timestamp: Date().timeIntervalSince1970
                ))
            }
            
        case "pong":
            // Calculate round-trip time
            if let timestamp = (message.data as? [String: Any])?["timestamp"] as? TimeInterval {
                let rtt = Date().timeIntervalSince1970 - timestamp
                print("Ping to \(peerId) took \(rtt * 1000)ms")
            }
            
        case "history":
            // Handle received history entries
            if let entries = message.data as? [[String: Any]] {
                let historyEntries = entries.compactMap { HistoryEntry(dictionary: $0) }
                onHistoryReceived?(historyEntries)
            }
            
        case "device":
            // Handle received device info
            if let deviceDict = message.data as? [String: Any],
               let device = DeviceInfo(dictionary: deviceDict) {
                onDeviceReceived?(device)
            }
            
        case "sync-request":
            // Handle sync request
            // Implementation depends on how we want to handle sync requests
            break
            
        case "sync-response":
            // Handle sync response
            if let responseDict = message.data as? [String: Any],
               let historyArray = responseDict["history"] as? [[String: Any]] {
                let historyEntries = historyArray.compactMap { HistoryEntry(dictionary: $0) }
                onHistoryReceived?(historyEntries)
            }
            
        default:
            break
        }
    }
}

// MARK: - Supporting Types

struct P2PMessage {
    let type: String
    let data: Any
    let clientId: String
    let timestamp: TimeInterval
    
    var dictionary: [String: Any] {
        return [
            "type": type,
            "data": data,
            "clientId": clientId,
            "timestamp": timestamp
        ]
    }
}

struct HistoryEntry {
    let id: String
    let url: String
    let title: String
    let timestamp: TimeInterval
    let deviceId: String
    
    init?(dictionary: [String: Any]) {
        guard let id = dictionary["id"] as? String,
              let url = dictionary["url"] as? String,
              let title = dictionary["title"] as? String,
              let timestamp = dictionary["timestamp"] as? TimeInterval,
              let deviceId = dictionary["deviceId"] as? String else {
            return nil
        }
        
        self.id = id
        self.url = url
        self.title = title
        self.timestamp = timestamp
        self.deviceId = deviceId
    }
}

struct DeviceInfo {
    let id: String
    let name: String
    let type: String
    let lastSeen: TimeInterval
    
    init?(dictionary: [String: Any]) {
        guard let id = dictionary["id"] as? String,
              let name = dictionary["name"] as? String,
              let type = dictionary["type"] as? String,
              let lastSeen = dictionary["lastSeen"] as? TimeInterval else {
            return nil
        }
        
        self.id = id
        self.name = name
        self.type = type
        self.lastSeen = lastSeen
    }
}