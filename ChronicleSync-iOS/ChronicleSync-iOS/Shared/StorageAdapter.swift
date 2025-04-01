import Foundation
import WebKit

// This class serves as a bridge between the JavaScript extension and Swift app
class StorageAdapter {
    private let userDefaults = UserDefaults(suiteName: "group.xyz.chroniclesync")
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    
    // MARK: - History Entry Management
    
    func addHistoryEntry(entry: [String: Any]) {
        guard let visitId = entry["visitId"] as? String else { return }
        
        // Add timestamp and sync status
        var fullEntry = entry
        fullEntry["syncStatus"] = "pending"
        fullEntry["lastModified"] = Date().timeIntervalSince1970 * 1000
        
        do {
            let data = try JSONSerialization.data(withJSONObject: fullEntry)
            userDefaults?.set(data, forKey: "history_\(visitId)")
            
            // Update the list of history entries
            var historyIds = userDefaults?.stringArray(forKey: "historyIds") ?? []
            if !historyIds.contains(visitId) {
                historyIds.append(visitId)
                userDefaults?.set(historyIds, forKey: "historyIds")
            }
        } catch {
            print("Error saving history entry: \(error)")
        }
    }
    
    func getUnsyncedEntries() -> [[String: Any]] {
        let historyIds = userDefaults?.stringArray(forKey: "historyIds") ?? []
        var unsyncedEntries: [[String: Any]] = []
        
        for visitId in historyIds {
            if let data = userDefaults?.data(forKey: "history_\(visitId)"),
               let entry = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let syncStatus = entry["syncStatus"] as? String,
               syncStatus == "pending" {
                unsyncedEntries.append(entry)
            }
        }
        
        return unsyncedEntries
    }
    
    func markAsSynced(visitId: String) {
        guard let data = userDefaults?.data(forKey: "history_\(visitId)"),
              var entry = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return
        }
        
        entry["syncStatus"] = "synced"
        entry["lastModified"] = Date().timeIntervalSince1970 * 1000
        
        if let updatedData = try? JSONSerialization.data(withJSONObject: entry) {
            userDefaults?.set(updatedData, forKey: "history_\(visitId)")
        }
    }
    
    func getEntries(deviceId: String? = nil, since: Double? = nil) -> [[String: Any]] {
        let historyIds = userDefaults?.stringArray(forKey: "historyIds") ?? []
        var entries: [[String: Any]] = []
        
        for visitId in historyIds {
            if let data = userDefaults?.data(forKey: "history_\(visitId)"),
               let entry = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                
                // Filter by device ID if specified
                if let deviceId = deviceId,
                   let entryDeviceId = entry["deviceId"] as? String,
                   entryDeviceId != deviceId {
                    continue
                }
                
                // Filter by timestamp if specified
                if let since = since,
                   let lastModified = entry["lastModified"] as? Double,
                   lastModified < since {
                    continue
                }
                
                // Filter out deleted entries
                if let deleted = entry["deleted"] as? Bool, deleted {
                    continue
                }
                
                entries.append(entry)
            }
        }
        
        return entries
    }
    
    func mergeRemoteEntries(remoteEntries: [[String: Any]]) {
        for remoteEntry in remoteEntries {
            guard let visitId = remoteEntry["visitId"] as? String,
                  let remoteLastModified = remoteEntry["lastModified"] as? Double else {
                continue
            }
            
            // Check if we have this entry locally
            if let data = userDefaults?.data(forKey: "history_\(visitId)"),
               let localEntry = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let localLastModified = localEntry["lastModified"] as? Double {
                
                // Only update if remote is newer
                if remoteLastModified > localLastModified {
                    var updatedEntry = remoteEntry
                    updatedEntry["syncStatus"] = "synced"
                    
                    if let updatedData = try? JSONSerialization.data(withJSONObject: updatedEntry) {
                        userDefaults?.set(updatedData, forKey: "history_\(visitId)")
                    }
                }
            } else {
                // Entry doesn't exist locally, add it
                var newEntry = remoteEntry
                newEntry["syncStatus"] = "synced"
                
                if let newData = try? JSONSerialization.data(withJSONObject: newEntry) {
                    userDefaults?.set(newData, forKey: "history_\(visitId)")
                    
                    // Update the list of history entries
                    var historyIds = userDefaults?.stringArray(forKey: "historyIds") ?? []
                    if !historyIds.contains(visitId) {
                        historyIds.append(visitId)
                        userDefaults?.set(historyIds, forKey: "historyIds")
                    }
                }
            }
        }
    }
    
    // MARK: - Device Management
    
    func updateDevice(device: [String: Any]) {
        guard let deviceId = device["deviceId"] as? String else { return }
        
        var deviceWithTimestamp = device
        deviceWithTimestamp["lastSeen"] = Date().timeIntervalSince1970 * 1000
        
        do {
            let data = try JSONSerialization.data(withJSONObject: deviceWithTimestamp)
            userDefaults?.set(data, forKey: "device_\(deviceId)")
            
            // Update the list of devices
            var deviceIds = userDefaults?.stringArray(forKey: "deviceIds") ?? []
            if !deviceIds.contains(deviceId) {
                deviceIds.append(deviceId)
                userDefaults?.set(deviceIds, forKey: "deviceIds")
            }
        } catch {
            print("Error saving device: \(error)")
        }
    }
    
    func getDevices() -> [[String: Any]] {
        let deviceIds = userDefaults?.stringArray(forKey: "deviceIds") ?? []
        var devices: [[String: Any]] = []
        
        for deviceId in deviceIds {
            if let data = userDefaults?.data(forKey: "device_\(deviceId)"),
               let device = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                devices.append(device)
            }
        }
        
        return devices
    }
    
    // MARK: - Content Management
    
    func updatePageContent(url: String, content: String, summary: String) {
        // Find entries with this URL
        let historyIds = userDefaults?.stringArray(forKey: "historyIds") ?? []
        var mostRecentEntry: [String: Any]? = nil
        var mostRecentTime: Double = 0
        
        for visitId in historyIds {
            if let data = userDefaults?.data(forKey: "history_\(visitId)"),
               let entry = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let entryUrl = entry["url"] as? String,
               entryUrl == url,
               let visitTime = entry["visitTime"] as? Double {
                
                if mostRecentEntry == nil || visitTime > mostRecentTime {
                    mostRecentEntry = entry
                    mostRecentTime = visitTime
                }
            }
        }
        
        // Update the most recent entry with page content
        if let entry = mostRecentEntry, let visitId = entry["visitId"] as? String {
            var updatedEntry = entry
            updatedEntry["pageContent"] = [
                "content": content,
                "summary": summary,
                "extractedAt": Date().timeIntervalSince1970 * 1000
            ]
            updatedEntry["syncStatus"] = "pending"
            updatedEntry["lastModified"] = Date().timeIntervalSince1970 * 1000
            
            if let updatedData = try? JSONSerialization.data(withJSONObject: updatedEntry) {
                userDefaults?.set(updatedData, forKey: "history_\(visitId)")
            }
        }
    }
    
    func searchContent(query: String) -> [[String: Any]] {
        guard !query.isEmpty else { return [] }
        
        let historyIds = userDefaults?.stringArray(forKey: "historyIds") ?? []
        var results: [[String: Any]] = []
        
        for visitId in historyIds {
            if let data = userDefaults?.data(forKey: "history_\(visitId)"),
               let entry = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let pageContent = entry["pageContent"] as? [String: Any],
               let content = pageContent["content"] as? String,
               let deleted = entry["deleted"] as? Bool, !deleted {
                
                let lowerContent = content.lowercased()
                let lowerQuery = query.lowercased()
                
                if lowerContent.contains(lowerQuery) {
                    var matches: [[String: String]] = []
                    var startIndex = 0
                    
                    while let range = lowerContent.range(of: lowerQuery, options: [], range: lowerContent.index(lowerContent.startIndex, offsetBy: startIndex)..<lowerContent.endIndex) {
                        let matchStartIndex = range.lowerBound
                        let matchEndIndex = range.upperBound
                        
                        // Get context around the match
                        let contextStartIndex = lowerContent.index(matchStartIndex, offsetBy: max(-100, -lowerContent.distance(from: lowerContent.startIndex, to: matchStartIndex)))
                        let contextEndIndex = lowerContent.index(matchEndIndex, offsetBy: min(100, lowerContent.distance(from: matchEndIndex, to: lowerContent.endIndex)))
                        
                        let matchText = String(content[matchStartIndex..<matchEndIndex])
                        let context = String(content[contextStartIndex..<contextEndIndex])
                        
                        matches.append([
                            "text": matchText,
                            "context": context
                        ])
                        
                        startIndex = lowerContent.distance(from: lowerContent.startIndex, to: matchEndIndex)
                    }
                    
                    if !matches.isEmpty {
                        results.append([
                            "entry": entry,
                            "matches": matches
                        ])
                    }
                }
            }
        }
        
        return results
    }
}