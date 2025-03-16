import XCTest
import SafariServices

class SafariExtensionTests: XCTestCase {

    func testExtensionManifest() throws {
        // This test verifies that the manifest.json file exists and can be parsed
        let extensionBundle = Bundle(for: type(of: self))
        let manifestURL = extensionBundle.url(forResource: "manifest", withExtension: "json", subdirectory: "Resources")
        
        // Verify manifest file exists
        XCTAssertNotNil(manifestURL, "manifest.json file not found")
        
        // Verify manifest file can be read
        let manifestData = try Data(contentsOf: manifestURL!)
        
        // Verify manifest file can be parsed as JSON
        let manifest = try JSONSerialization.jsonObject(with: manifestData, options: []) as? [String: Any]
        XCTAssertNotNil(manifest, "manifest.json could not be parsed as JSON")
        
        // Verify manifest contains required fields
        XCTAssertNotNil(manifest?["name"], "manifest.json missing 'name' field")
        XCTAssertNotNil(manifest?["version"], "manifest.json missing 'version' field")
        XCTAssertNotNil(manifest?["manifest_version"], "manifest.json missing 'manifest_version' field")
    }
    
    func testBackgroundScript() throws {
        // This test verifies that the background.js file exists
        let extensionBundle = Bundle(for: type(of: self))
        let backgroundURL = extensionBundle.url(forResource: "background", withExtension: "js", subdirectory: "Resources")
        
        // Verify background.js file exists
        XCTAssertNotNil(backgroundURL, "background.js file not found")
        
        // Verify background.js file can be read
        let backgroundData = try Data(contentsOf: backgroundURL!)
        XCTAssertTrue(backgroundData.count > 0, "background.js file is empty")
    }
    
    func testContentScript() throws {
        // This test verifies that the content-script.js file exists
        let extensionBundle = Bundle(for: type(of: self))
        let contentScriptURL = extensionBundle.url(forResource: "content-script", withExtension: "js", subdirectory: "Resources")
        
        // Verify content-script.js file exists
        XCTAssertNotNil(contentScriptURL, "content-script.js file not found")
        
        // Verify content-script.js file can be read
        let contentScriptData = try Data(contentsOf: contentScriptURL!)
        XCTAssertTrue(contentScriptData.count > 0, "content-script.js file is empty")
    }
}