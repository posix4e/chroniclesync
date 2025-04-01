import Foundation

/// Tracks usage of the Safari extension
class TrackingManager {
    /// Shared instance of the tracking manager
    static let shared = TrackingManager()
    
    /// Private initializer to enforce singleton pattern
    private init() {}
    
    /// Array of sync operations that have been performed
    private(set) var syncOperations: [SyncOperation] = []
    
    /// Array of message operations that have been performed
    private(set) var messageOperations: [MessageOperation] = []
    
    /// Array of errors that have occurred
    private(set) var errors: [ErrorEvent] = []
    
    /// Tracks a sync operation
    /// - Parameter operation: The sync operation to track
    /// - Returns: True if the operation was tracked successfully
    func trackSyncOperation(_ operation: SyncOperation) -> Bool {
        syncOperations.append(operation)
        saveTrackingData()
        return true
    }
    
    /// Tracks a message operation
    /// - Parameter operation: The message operation to track
    /// - Returns: True if the operation was tracked successfully
    func trackMessageOperation(_ operation: MessageOperation) -> Bool {
        messageOperations.append(operation)
        saveTrackingData()
        return true
    }
    
    /// Tracks an error event
    /// - Parameter error: The error event to track
    /// - Returns: True if the error was tracked successfully
    func trackError(_ error: ErrorEvent) -> Bool {
        errors.append(error)
        saveTrackingData()
        return true
    }
    
    /// Saves tracking data to persistent storage
    private func saveTrackingData() {
        // In a real implementation, this would save the data to UserDefaults, a file, or a database
        // For now, we'll just print the counts for demonstration
        print("Tracking data updated: \(syncOperations.count) sync operations, \(messageOperations.count) message operations, \(errors.count) errors")
    }
    
    /// Uploads tracking data to a server
    /// - Returns: True if the data was uploaded successfully
    func uploadTrackingData() -> Bool {
        // In a real implementation, this would upload the data to a server
        // For now, we'll just print a message for demonstration
        print("Uploading tracking data: \(syncOperations.count) sync operations, \(messageOperations.count) message operations, \(errors.count) errors")
        return true
    }
    
    /// Clears all tracking data
    func clearTrackingData() {
        syncOperations.removeAll()
        messageOperations.removeAll()
        errors.removeAll()
        saveTrackingData()
    }
}

/// Represents a sync operation
struct SyncOperation: Codable {
    /// The type of sync operation
    enum SyncType: String, Codable {
        case full
        case incremental
    }
    
    /// The type of sync operation
    let type: SyncType
    
    /// The number of items synced
    let itemCount: Int
    
    /// The timestamp of the sync operation
    let timestamp = Date()
    
    /// The duration of the sync operation in seconds
    let duration: TimeInterval
}

/// Represents a message operation
struct MessageOperation: Codable {
    /// The type of message operation
    enum MessageType: String, Codable {
        case received
        case sent
    }
    
    /// The type of message operation
    let type: MessageType
    
    /// The action of the message
    let action: String
    
    /// The timestamp of the message operation
    let timestamp = Date()
    
    /// The size of the message in bytes
    let size: Int
}

/// Represents an error event
struct ErrorEvent: Codable {
    /// The code of the error
    let code: String
    
    /// The message of the error
    let message: String
    
    /// The timestamp of the error
    let timestamp = Date()
    
    /// The context in which the error occurred
    let context: [String: String]
}