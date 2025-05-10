import XCTest
@testable import ChronicleSync

class P2PSyncClientTests: XCTestCase {
    
    var p2pClient: P2PSyncClient!
    var mockWebSocketTask: MockWebSocketTask!
    var mockURLSession: MockURLSession!
    
    override func setUp() {
        super.setUp()
        mockWebSocketTask = MockWebSocketTask()
        mockURLSession = MockURLSession(mockTask: mockWebSocketTask)
        p2pClient = P2PSyncClient(
            clientId: "test-client-id",
            discoveryServer: "wss://api.chroniclesync.xyz",
            mnemonic: "test mnemonic phrase with twenty four words to make it valid for testing purposes only",
            urlSession: mockURLSession
        )
    }
    
    override func tearDown() {
        p2pClient = nil
        mockWebSocketTask = nil
        mockURLSession = nil
        super.tearDown()
    }
    
    func testInitialization() {
        XCTAssertEqual(p2pClient.clientId, "test-client-id")
        XCTAssertEqual(p2pClient.discoveryServer, "wss://api.chroniclesync.xyz")
        XCTAssertNotNil(p2pClient.encryptionKey)
    }
    
    func testConnect() {
        // Connect to discovery server
        p2pClient.connect()
        
        // Verify WebSocket connection was created
        XCTAssertTrue(mockURLSession.websocketTaskCalled)
        XCTAssertEqual(mockURLSession.lastURL?.absoluteString, "wss://api.chroniclesync.xyz?clientId=test-client-id&room=chroniclesync")
        
        // Verify receive message was called
        XCTAssertTrue(mockWebSocketTask.receiveCalled)
    }
    
    func testSendGetPeers() {
        // Connect to discovery server
        p2pClient.connect()
        
        // Simulate WebSocket connection established
        if let onOpen = p2pClient.onWebSocketOpen {
            onOpen()
        }
        
        // Verify get-peers message was sent
        XCTAssertTrue(mockWebSocketTask.sendCalled)
        XCTAssertEqual(mockWebSocketTask.lastSentMessage, "{\"type\":\"get-peers\"}")
    }
    
    func testHandlePeersMessage() {
        // Connect to discovery server
        p2pClient.connect()
        
        // Simulate peers message
        let peersMessage = """
        {
            "type": "peers",
            "peers": ["peer1", "peer2"]
        }
        """
        
        // Process the message
        p2pClient.handleMessage(peersMessage)
        
        // Verify peer connections were created
        XCTAssertEqual(p2pClient.connections.count, 2)
        XCTAssertNotNil(p2pClient.connections["peer1"])
        XCTAssertNotNil(p2pClient.connections["peer2"])
    }
    
    func testHandlePeerJoinedMessage() {
        // Connect to discovery server
        p2pClient.connect()
        
        // Simulate peer-joined message
        let peerJoinedMessage = """
        {
            "type": "peer-joined",
            "peerId": "new-peer"
        }
        """
        
        // Process the message
        p2pClient.handleMessage(peerJoinedMessage)
        
        // Verify peer connection was created
        XCTAssertEqual(p2pClient.connections.count, 1)
        XCTAssertNotNil(p2pClient.connections["new-peer"])
    }
    
    func testHandlePeerLeftMessage() {
        // Connect to discovery server
        p2pClient.connect()
        
        // Add a mock peer connection
        p2pClient.connections["peer1"] = MockPeerConnection()
        
        // Simulate peer-left message
        let peerLeftMessage = """
        {
            "type": "peer-left",
            "peerId": "peer1"
        }
        """
        
        // Process the message
        p2pClient.handleMessage(peerLeftMessage)
        
        // Verify peer connection was removed
        XCTAssertEqual(p2pClient.connections.count, 0)
    }
    
    func testSendHistoryEntries() {
        // Connect to discovery server
        p2pClient.connect()
        
        // Add a mock peer connection
        let mockConnection = MockPeerConnection()
        p2pClient.connections["peer1"] = mockConnection
        
        // Create history entries
        let historyEntries = [
            HistoryEntry(
                id: "1",
                url: "https://example.com",
                title: "Example",
                visitTime: Date(),
                lastVisitTime: Date()
            )
        ]
        
        // Send history entries
        p2pClient.sendHistoryEntries(historyEntries)
        
        // Verify data was sent
        XCTAssertTrue(mockConnection.sendCalled)
        XCTAssertTrue(mockConnection.lastSentData.contains("history-entries"))
    }
    
    func testSendDeviceInfo() {
        // Connect to discovery server
        p2pClient.connect()
        
        // Add a mock peer connection
        let mockConnection = MockPeerConnection()
        p2pClient.connections["peer1"] = mockConnection
        
        // Create device info
        let deviceInfo = DeviceInfo(
            id: "device1",
            name: "Test Device",
            type: "ios",
            lastSeen: Date()
        )
        
        // Send device info
        p2pClient.sendDeviceInfo(deviceInfo)
        
        // Verify data was sent
        XCTAssertTrue(mockConnection.sendCalled)
        XCTAssertTrue(mockConnection.lastSentData.contains("device-info"))
    }
    
    func testDisconnect() {
        // Connect to discovery server
        p2pClient.connect()
        
        // Add mock peer connections
        p2pClient.connections["peer1"] = MockPeerConnection()
        p2pClient.connections["peer2"] = MockPeerConnection()
        
        // Disconnect
        p2pClient.disconnect()
        
        // Verify WebSocket was closed
        XCTAssertTrue(mockWebSocketTask.cancelCalled)
        
        // Verify peer connections were closed
        XCTAssertEqual(p2pClient.connections.count, 0)
    }
}

// Mock classes for testing

class MockURLSession {
    var websocketTaskCalled = false
    var lastURL: URL?
    let mockTask: MockWebSocketTask
    
    init(mockTask: MockWebSocketTask) {
        self.mockTask = mockTask
    }
    
    func webSocketTask(with url: URL) -> URLSessionWebSocketTask {
        websocketTaskCalled = true
        lastURL = url
        return mockTask
    }
}

class MockWebSocketTask: URLSessionWebSocketTask {
    var receiveCalled = false
    var sendCalled = false
    var cancelCalled = false
    var lastSentMessage: String?
    
    override func receive(completionHandler: @escaping (Result<URLSessionWebSocketTask.Message, Error>) -> Void) {
        receiveCalled = true
        // Don't call the completion handler to avoid infinite recursion
    }
    
    override func send(_ message: URLSessionWebSocketTask.Message, completionHandler: @escaping (Error?) -> Void) {
        sendCalled = true
        if case .string(let text) = message {
            lastSentMessage = text
        }
        completionHandler(nil)
    }
    
    override func cancel() {
        cancelCalled = true
    }
}

class MockPeerConnection {
    var sendCalled = false
    var lastSentData = ""
    
    func send(_ data: String) {
        sendCalled = true
        lastSentData = data
    }
    
    func close() {
        // Do nothing
    }
}