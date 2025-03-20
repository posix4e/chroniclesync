//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Created by alex newman on 3/20/25.
//

import SafariServices
import os.log
import Foundation

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    let logger = Logger(subsystem: "xyz.chroniclesync.extension", category: "SafariExtension")
    
    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let profile: UUID?
        if #available(iOS 17.0, macOS 14.0, *) {
            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = request?.userInfo?["profile"] as? UUID
        }

        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }

        logger.log("Received message from browser.runtime.sendNativeMessage: \(String(describing: message)) (profile: \(profile?.uuidString ?? "none"))")
        
        // Handle the message based on its type
        if let messageDict = message as? [String: Any],
           let messageType = messageDict["type"] as? String {
            
            switch messageType {
            case "getDeviceInfo":
                handleGetDeviceInfo(context: context)
                
            case "saveToNative":
                if let data = messageDict["data"] as? [String: Any] {
                    handleSaveToNative(data: data, context: context)
                } else {
                    sendResponse(success: false, message: "Missing data", context: context)
                }
                
            case "loadFromNative":
                if let key = messageDict["key"] as? String {
                    handleLoadFromNative(key: key, context: context)
                } else {
                    sendResponse(success: false, message: "Missing key", context: context)
                }
                
            default:
                // Echo back unknown messages
                let response = NSExtensionItem()
                if #available(iOS 15.0, macOS 11.0, *) {
                    response.userInfo = [ SFExtensionMessageKey: [ "echo": message, "unknown": true ] ]
                } else {
                    response.userInfo = [ "message": [ "echo": message, "unknown": true ] ]
                }
                context.completeRequest(returningItems: [ response ], completionHandler: nil)
            }
        } else {
            // Echo back non-dictionary messages
            let response = NSExtensionItem()
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [ "echo": message ] ]
            } else {
                response.userInfo = [ "message": [ "echo": message ] ]
            }
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
        }
    }
    
    // Handle getting device information
    private func handleGetDeviceInfo(context: NSExtensionContext) {
        let deviceInfo: [String: Any] = [
            "platform": "iOS",
            "model": getDeviceModel(),
            "osVersion": UIDevice.current.systemVersion,
            "deviceId": getOrCreateDeviceId(),
            "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
        ]
        
        sendResponse(success: true, data: deviceInfo, context: context)
    }
    
    // Handle saving data to native storage
    private func handleSaveToNative(data: [String: Any], context: NSExtensionContext) {
        guard let key = data["key"] as? String,
              let value = data["value"] else {
            sendResponse(success: false, message: "Invalid data format", context: context)
            return
        }
        
        do {
            let defaults = UserDefaults.standard
            
            if let stringValue = value as? String {
                defaults.set(stringValue, forKey: key)
            } else {
                // Convert to JSON data
                let jsonData = try JSONSerialization.data(withJSONObject: value)
                defaults.set(jsonData, forKey: key)
            }
            
            defaults.synchronize()
            sendResponse(success: true, message: "Data saved successfully", context: context)
        } catch {
            logger.error("Error saving data: \(error.localizedDescription)")
            sendResponse(success: false, message: "Error saving data: \(error.localizedDescription)", context: context)
        }
    }
    
    // Handle loading data from native storage
    private func handleLoadFromNative(key: String, context: NSExtensionContext) {
        let defaults = UserDefaults.standard
        
        if let value = defaults.object(forKey: key) {
            if let stringValue = value as? String {
                sendResponse(success: true, data: ["key": key, "value": stringValue], context: context)
            } else if let jsonData = value as? Data {
                do {
                    let jsonObject = try JSONSerialization.jsonObject(with: jsonData)
                    sendResponse(success: true, data: ["key": key, "value": jsonObject], context: context)
                } catch {
                    logger.error("Error parsing JSON data: \(error.localizedDescription)")
                    sendResponse(success: false, message: "Error parsing stored data", context: context)
                }
            } else {
                sendResponse(success: false, message: "Unsupported data type", context: context)
            }
        } else {
            sendResponse(success: false, message: "No data found for key: \(key)", context: context)
        }
    }
    
    // Helper function to send a response
    private func sendResponse(success: Bool, message: String? = nil, data: [String: Any]? = nil, context: NSExtensionContext) {
        var responseDict: [String: Any] = ["success": success]
        
        if let message = message {
            responseDict["message"] = message
        }
        
        if let data = data {
            responseDict["data"] = data
        }
        
        let response = NSExtensionItem()
        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [ SFExtensionMessageKey: responseDict ]
        } else {
            response.userInfo = [ "message": responseDict ]
        }
        
        context.completeRequest(returningItems: [ response ], completionHandler: nil)
    }
    
    // Get or create a unique device ID
    private func getOrCreateDeviceId() -> String {
        let defaults = UserDefaults.standard
        let deviceIdKey = "xyz.chroniclesync.deviceId"
        
        if let existingId = defaults.string(forKey: deviceIdKey) {
            return existingId
        }
        
        let newId = UUID().uuidString
        defaults.set(newId, forKey: deviceIdKey)
        defaults.synchronize()
        
        return newId
    }
    
    // Get the device model
    private func getDeviceModel() -> String {
        var systemInfo = utsname()
        uname(&systemInfo)
        let machineMirror = Mirror(reflecting: systemInfo.machine)
        let identifier = machineMirror.children.reduce("") { identifier, element in
            guard let value = element.value as? Int8, value != 0 else { return identifier }
            return identifier + String(UnicodeScalar(UInt8(value)))
        }
        return identifier
    }
}
