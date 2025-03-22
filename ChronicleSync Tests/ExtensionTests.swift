import XCTest
import SafariServices
@testable import ChronicleSync_Extension

class ExtensionTests: XCTestCase {
    
    var extensionHandler: SafariWebExtensionHandler!
    
    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
        extensionHandler = SafariWebExtensionHandler()
        continueAfterFailure = false
    }
    
    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        extensionHandler = nil
    }
    
    func testExtensionHandlerInitialization() throws {
        // Test that the extension handler initializes correctly
        XCTAssertNotNil(extensionHandler)
    }
    
    func testManifestFile() throws {
        // Test that the manifest.json file exists and has the correct format
        let bundle = Bundle(for: SafariWebExtensionHandler.self)
        let manifestURL = bundle.url(forResource: "manifest", withExtension: "json", subdirectory: "Resources")
        XCTAssertNotNil(manifestURL, "manifest.json file not found")
        
        let manifestData = try Data(contentsOf: manifestURL!)
        let manifest = try JSONSerialization.jsonObject(with: manifestData, options: []) as? [String: Any]
        XCTAssertNotNil(manifest, "manifest.json is not a valid JSON object")
        
        // Check required fields
        XCTAssertNotNil(manifest?["name"], "manifest.json missing 'name' field")
        XCTAssertNotNil(manifest?["version"], "manifest.json missing 'version' field")
        XCTAssertNotNil(manifest?["manifest_version"], "manifest.json missing 'manifest_version' field")
    }
    
    func testBackgroundScript() throws {
        // Test that the background.js file exists
        let bundle = Bundle(for: SafariWebExtensionHandler.self)
        let backgroundURL = bundle.url(forResource: "background", withExtension: "js", subdirectory: "Resources")
        XCTAssertNotNil(backgroundURL, "background.js file not found")
    }
    
    func testContentScript() throws {
        // Test that the content-script.js file exists
        let bundle = Bundle(for: SafariWebExtensionHandler.self)
        let contentScriptURL = bundle.url(forResource: "content-script", withExtension: "js", subdirectory: "Resources")
        XCTAssertNotNil(contentScriptURL, "content-script.js file not found")
    }
    
    func testCompatibilityScript() throws {
        // Test that the ChromeExtensionCompatibility.js file exists
        let bundle = Bundle(for: SafariWebExtensionHandler.self)
        let compatibilityURL = bundle.url(forResource: "ChromeExtensionCompatibility", withExtension: "js", subdirectory: "Resources")
        XCTAssertNotNil(compatibilityURL, "ChromeExtensionCompatibility.js file not found")
    }
}