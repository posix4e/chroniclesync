#!/bin/bash
set -e

# Configuration
APP_NAME="ChronicleSync"
EXTENSION_DIR="extension"
SAFARI_RESOURCES_DIR="${APP_NAME}App/${APP_NAME}Extension/Resources"

# Create destination directory if it doesn't exist
mkdir -p "$SAFARI_RESOURCES_DIR"

# Function to convert Chrome API calls to browser API calls
convert_js_file() {
    local input_file="$1"
    local output_file="$2"
    
    echo "Converting $input_file to Safari-compatible format..."
    
    # Create a copy of the file
    cp "$input_file" "$output_file"
    
    # Replace Chrome API calls with browser API calls
    sed -i '' 's/chrome\.storage/browser.storage/g' "$output_file"
    sed -i '' 's/chrome\.tabs/browser.tabs/g' "$output_file"
    sed -i '' 's/chrome\.runtime/browser.runtime/g' "$output_file"
    sed -i '' 's/chrome\.history/browser.history/g' "$output_file"
    sed -i '' 's/chrome\.extension/browser.extension/g' "$output_file"
    
    # Add polyfill for Safari
    cat > "$SAFARI_RESOURCES_DIR/browser-polyfill.js" << EOL
// Safari browser API polyfill
if (typeof browser === 'undefined') {
    const browser = {};
    
    // Storage API
    if (typeof chrome !== 'undefined' && chrome.storage) {
        browser.storage = {
            local: {
                get: function(keys) {
                    return new Promise((resolve, reject) => {
                        chrome.storage.local.get(keys, (result) => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve(result);
                            }
                        });
                    });
                },
                set: function(items) {
                    return new Promise((resolve, reject) => {
                        chrome.storage.local.set(items, () => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve();
                            }
                        });
                    });
                },
                remove: function(keys) {
                    return new Promise((resolve, reject) => {
                        chrome.storage.local.remove(keys, () => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve();
                            }
                        });
                    });
                },
                clear: function() {
                    return new Promise((resolve, reject) => {
                        chrome.storage.local.clear(() => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve();
                            }
                        });
                    });
                }
            }
        };
    }
    
    // Tabs API
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        browser.tabs = {
            query: function(queryInfo) {
                return new Promise((resolve, reject) => {
                    chrome.tabs.query(queryInfo, (tabs) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(tabs);
                        }
                    });
                });
            },
            create: function(createProperties) {
                return new Promise((resolve, reject) => {
                    chrome.tabs.create(createProperties, (tab) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(tab);
                        }
                    });
                });
            },
            update: function(tabId, updateProperties) {
                return new Promise((resolve, reject) => {
                    chrome.tabs.update(tabId, updateProperties, (tab) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(tab);
                        }
                    });
                });
            }
        };
    }
    
    // Runtime API
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        browser.runtime = {
            getURL: function(path) {
                return chrome.runtime.getURL(path);
            },
            sendMessage: function(message) {
                return new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage(message, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(response);
                        }
                    });
                });
            }
        };
    }
    
    // History API
    if (typeof chrome !== 'undefined' && chrome.history) {
        browser.history = {
            search: function(query) {
                return new Promise((resolve, reject) => {
                    chrome.history.search(query, (results) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(results);
                        }
                    });
                });
            },
            deleteUrl: function(details) {
                return new Promise((resolve, reject) => {
                    chrome.history.deleteUrl(details, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        };
    }
    
    window.browser = browser;
}
EOL
    
    # Add browser polyfill import to the beginning of the file
    sed -i '' '1i\\
<script src="browser-polyfill.js"></script>
' "$SAFARI_RESOURCES_DIR/popup.html"
    sed -i '' '1i\\
<script src="browser-polyfill.js"></script>
' "$SAFARI_RESOURCES_DIR/settings.html"
    sed -i '' '1i\\
<script src="browser-polyfill.js"></script>
' "$SAFARI_RESOURCES_DIR/history.html"
    
    echo "Conversion complete for $input_file"
}

# Copy and modify manifest.json
echo "Copying and modifying manifest.json..."
cp "$EXTENSION_DIR/manifest.json" "$SAFARI_RESOURCES_DIR/manifest.json"

# Add Safari-specific settings to manifest.json
sed -i '' 's/"manifest_version": 3,/"manifest_version": 3,\
  "browser_specific_settings": {\
    "safari": {\
      "strict_min_version": "15.0"\
    }\
  },/g' "$SAFARI_RESOURCES_DIR/manifest.json"

# Copy HTML and CSS files
echo "Copying HTML and CSS files..."
cp "$EXTENSION_DIR/popup.html" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/settings.html" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/history.html" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/popup.css" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/settings.css" "$SAFARI_RESOURCES_DIR/"
cp "$EXTENSION_DIR/history.css" "$SAFARI_RESOURCES_DIR/"

# Find and convert JavaScript files
echo "Finding and converting JavaScript files..."
mkdir -p "$SAFARI_RESOURCES_DIR/src"

# Check if the extension uses built JavaScript files or source files
if [ -f "$EXTENSION_DIR/popup.js" ]; then
    # Built JavaScript files
    convert_js_file "$EXTENSION_DIR/popup.js" "$SAFARI_RESOURCES_DIR/popup.js"
    convert_js_file "$EXTENSION_DIR/settings.js" "$SAFARI_RESOURCES_DIR/settings.js"
    convert_js_file "$EXTENSION_DIR/history.js" "$SAFARI_RESOURCES_DIR/history.js"
    
    if [ -f "$EXTENSION_DIR/background.js" ]; then
        convert_js_file "$EXTENSION_DIR/background.js" "$SAFARI_RESOURCES_DIR/background.js"
    fi
    
    if [ -f "$EXTENSION_DIR/content-script.js" ]; then
        convert_js_file "$EXTENSION_DIR/content-script.js" "$SAFARI_RESOURCES_DIR/content-script.js"
    fi
else
    # Source files that need to be built
    echo "JavaScript files not found in build format."
    echo "You will need to build the JavaScript files from the source."
    echo "Copying source files for reference..."
    
    # Copy source files
    cp -r "$EXTENSION_DIR/src/"* "$SAFARI_RESOURCES_DIR/src/"
    
    # Create placeholder files
    touch "$SAFARI_RESOURCES_DIR/popup.js"
    touch "$SAFARI_RESOURCES_DIR/settings.js"
    touch "$SAFARI_RESOURCES_DIR/history.js"
    touch "$SAFARI_RESOURCES_DIR/background.js"
    touch "$SAFARI_RESOURCES_DIR/content-script.js"
    
    echo "You will need to build the JavaScript files using the build system from the extension."
fi

# Copy any additional resources
echo "Copying additional resources..."
if [ -f "$EXTENSION_DIR/bip39-wordlist.js" ]; then
    cp "$EXTENSION_DIR/bip39-wordlist.js" "$SAFARI_RESOURCES_DIR/"
fi

# Create a README file with instructions
cat > "$SAFARI_RESOURCES_DIR/README.md" << EOL
# ChronicleSync Safari Extension Resources

This directory contains the web extension resources for the ChronicleSync Safari extension.

## Notes

- The JavaScript files have been adapted for Safari compatibility
- A browser polyfill has been added to ensure Chrome APIs work in Safari
- The manifest.json has been modified with Safari-specific settings

## Building

If the JavaScript files are placeholders, you will need to build them using the build system from the extension.

1. Navigate to the extension directory
2. Run the build command (e.g., \`npm run build\`)
3. Copy the built files to this directory

## Testing

1. Build and run the iOS app
2. Enable the extension in Safari settings
3. Test the extension functionality
EOL

echo "Conversion complete!"
echo "Please check the $SAFARI_RESOURCES_DIR directory for the converted files."
echo "You may need to build the JavaScript files if they are not already built."