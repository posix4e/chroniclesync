/* eslint-disable no-console */
const { mkdir, rm, cp, writeFile, readFile } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const { join } = require('path');
const fs = require('fs');

const execAsync = promisify(exec);
const ROOT_DIR = join(__dirname, '..');  // Extension root directory
const SAFARI_DIR = join(ROOT_DIR, 'safari-ios');
const XCODE_PROJECT_DIR = join(SAFARI_DIR, 'ChronicleSync');

/** @type {[string, string][]} File copy specifications [source, destination] */
const filesToCopy = [
  ['manifest.json', 'manifest.json'],
  ['popup.html', 'popup.html'],
  ['popup.css', 'popup.css'],
  ['settings.html', 'settings.html'],
  ['settings.css', 'settings.css'],
  ['history.html', 'history.html'],
  ['history.css', 'history.css'],
  ['devtools.html', 'devtools.html'],
  ['devtools.css', 'devtools.css'],
  ['bip39-wordlist.js', 'bip39-wordlist.js'],
  [join('dist', 'popup.js'), 'popup.js'],
  [join('dist', 'background.js'), 'background.js'],
  [join('dist', 'settings.js'), 'settings.js'],
  [join('dist', 'history.js'), 'history.js'],
  [join('dist', 'devtools.js'), 'devtools.js'],
  [join('dist', 'devtools-page.js'), 'devtools-page.js'],
  [join('dist', 'content-script.js'), 'content-script.js'],
  [join('dist', 'assets'), 'assets']
];

async function createInfoPlist() {
  const manifestPath = join(ROOT_DIR, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>${manifest.name}</string>
    <key>CFBundleIdentifier</key>
    <string>com.chroniclesync.extension</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleVersion</key>
    <string>${manifest.version}</string>
    <key>CFBundleShortVersionString</key>
    <string>${manifest.version}</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.Safari.web-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler</string>
    </dict>
</dict>
</plist>`;

  return infoPlist;
}

async function createXcodeProject() {
  // Create basic Xcode project structure for Safari extension
  await mkdir(XCODE_PROJECT_DIR, { recursive: true });
  await mkdir(join(XCODE_PROJECT_DIR, 'ChronicleSync'), { recursive: true });
  await mkdir(join(XCODE_PROJECT_DIR, 'ChronicleSync Extension'), { recursive: true });
  await mkdir(join(XCODE_PROJECT_DIR, 'Resources'), { recursive: true });
  
  // Create Info.plist for the extension
  const infoPlist = await createInfoPlist();
  await writeFile(join(XCODE_PROJECT_DIR, 'ChronicleSync Extension', 'Info.plist'), infoPlist);
  
  // Create project.pbxproj file (simplified version)
  const pbxproj = `// !$*UTF8*$!
{
    archiveVersion = 1;
    classes = {
    };
    objectVersion = 54;
    objects = {
        /* Project object */
        8D8647D92B8F1F7A00A9D3F1 /* Project object */ = {
            isa = PBXProject;
            attributes = {
                BuildIndependentTargetsInParallel = 1;
                LastSwiftUpdateCheck = 1520;
                LastUpgradeCheck = 1520;
                TargetAttributes = {
                    8D8647E02B8F1F7A00A9D3F1 = {
                        CreatedOnToolsVersion = 15.2;
                    };
                    8D8647F62B8F1F7B00A9D3F1 = {
                        CreatedOnToolsVersion = 15.2;
                    };
                };
            };
            buildConfigurationList = 8D8647DD2B8F1F7A00A9D3F1 /* Build configuration list for PBXProject "ChronicleSync" */;
            compatibilityVersion = "Xcode 14.0";
            developmentRegion = en;
            hasScannedForEncodings = 0;
            knownRegions = (
                en,
                Base,
            );
            mainGroup = 8D8647D82B8F1F7A00A9D3F1;
            productRefGroup = 8D8647E22B8F1F7A00A9D3F1 /* Products */;
            projectDirPath = "";
            projectRoot = "";
            targets = (
                8D8647E02B8F1F7A00A9D3F1 /* ChronicleSync */,
                8D8647F62B8F1F7B00A9D3F1 /* ChronicleSync Extension */,
            );
        };
    };
    rootObject = 8D8647D92B8F1F7A00A9D3F1 /* Project object */;
}`;
  
  await writeFile(join(XCODE_PROJECT_DIR, 'project.pbxproj'), pbxproj);
  
  // Create SafariWebExtensionHandler.swift
  const handlerSwift = `import SafariServices

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey]
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "Response": "Received message" ] ]
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}`;
  
  await writeFile(join(XCODE_PROJECT_DIR, 'ChronicleSync Extension', 'SafariWebExtensionHandler.swift'), handlerSwift);
  
  // Create AppDelegate.swift
  const appDelegateSwift = `import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }
}`;
  
  await writeFile(join(XCODE_PROJECT_DIR, 'ChronicleSync', 'AppDelegate.swift'), appDelegateSwift);
  
  // Create ViewController.swift
  const viewControllerSwift = `import UIKit
import SafariServices

class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let button = UIButton(type: .system)
        button.setTitle("Open Safari Extension Settings", for: .normal)
        button.addTarget(self, action: #selector(openSettings), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        
        view.addSubview(button)
        NSLayoutConstraint.activate([
            button.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            button.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }
    
    @objc func openSettings() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "com.chroniclesync.extension") { error in
            if let error = error {
                print("Error opening Safari extension settings: \\(error)")
            }
        }
    }
}`;
  
  await writeFile(join(XCODE_PROJECT_DIR, 'ChronicleSync', 'ViewController.swift'), viewControllerSwift);
}

async function main() {
  try {
    // Clean up any existing Safari directory
    await rm(SAFARI_DIR, { recursive: true, force: true });
    
    // Create Safari directory
    await mkdir(SAFARI_DIR, { recursive: true });
    
    // Run the build
    console.log('Building extension...');
    await execAsync('npm run build', { cwd: ROOT_DIR });
    
    // Create Xcode project structure
    console.log('Creating Xcode project structure...');
    await createXcodeProject();
    
    // Create Resources directory for web extension files
    const resourcesDir = join(XCODE_PROJECT_DIR, 'Resources');
    await mkdir(resourcesDir, { recursive: true });
    
    // Copy necessary files to Resources directory
    console.log('Copying web extension files...');
    for (const [src, dest] of filesToCopy) {
      await cp(
        join(ROOT_DIR, src),
        join(resourcesDir, dest),
        { recursive: true }
      ).catch(err => {
        console.warn(`Warning: Could not copy ${src}: ${err.message}`);
      });
    }
    
    console.log('Safari iOS extension project created successfully');
  } catch (error) {
    console.error('Error building Safari iOS extension:', error);
    process.exit(1);
  }
}

main();