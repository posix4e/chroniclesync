#!/bin/bash
# copy_extension_resources.sh - Copies and adapts web extension resources for Safari
set -e

echo "Copying extension resources to Safari project..."

# Source and destination directories
SRC_DIR="extension/dist"
DEST_DIR="safari/Extension/Resources"

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# First, build the extension if dist directory doesn't exist
if [ ! -d "$SRC_DIR" ]; then
  echo "Building extension..."
  cd extension
  npm ci
  npm run build
  cd ..
fi

# Copy JavaScript files
echo "Copying JavaScript files..."
cp "$SRC_DIR/background.js" "$DEST_DIR/" || echo "Warning: Could not copy background.js"
cp "$SRC_DIR/content-script.js" "$DEST_DIR/" || echo "Warning: Could not copy content-script.js"
cp "$SRC_DIR/popup.js" "$DEST_DIR/" || echo "Warning: Could not copy popup.js"

# Adapt background.js for Safari
if [ -f "$DEST_DIR/background.js" ]; then
  echo "Adapting background.js for Safari..."
  # Replace chrome API with browser API
  sed -i.bak 's/chrome\./browser\./g' "$DEST_DIR/background.js"
  # Remove the backup file
  rm "$DEST_DIR/background.js.bak"
fi

# Adapt content-script.js for Safari
if [ -f "$DEST_DIR/content-script.js" ]; then
  echo "Adapting content-script.js for Safari..."
  # Replace chrome API with browser API
  sed -i.bak 's/chrome\./browser\./g' "$DEST_DIR/content-script.js"
  # Remove the backup file
  rm "$DEST_DIR/content-script.js.bak"
fi

# Copy HTML files
echo "Copying HTML files..."
cp "extension/popup.html" "$DEST_DIR/" || echo "Warning: Could not copy popup.html"
cp "extension/settings.html" "$DEST_DIR/" || echo "Warning: Could not copy settings.html"
cp "extension/history.html" "$DEST_DIR/" || echo "Warning: Could not copy history.html"

# Copy CSS files
echo "Copying CSS files..."
cp "extension/popup.css" "$DEST_DIR/" || echo "Warning: Could not copy popup.css"
cp "extension/settings.css" "$DEST_DIR/" || echo "Warning: Could not copy settings.css"
cp "extension/history.css" "$DEST_DIR/" || echo "Warning: Could not copy history.css"

# Create a Safari manifest.json adapted from the Chrome version
echo "Creating Safari manifest.json..."
cat > "$DEST_DIR/manifest.json" << 'EOF'
{
  "manifest_version": 2,
  "name": "ChronicleSync",
  "version": "1.0",
  "description": "Sync stuff across browsers",
  "background": {
    "scripts": ["background.js"],
    "persistent": false
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"],
      "run_at": "document_idle"
    }
  ],
  "browser_action": {
    "default_popup": "popup.html",
    "default_title": "ChronicleSync"
  },
  "options_ui": {
    "page": "settings.html",
    "open_in_tab": true
  },
  "web_accessible_resources": [
    "history.html"
  ],
  "permissions": [
    "activeTab",
    "tabs",
    "history",
    "storage"
  ],
  "author": "ChronicleSync Team",
  "homepage_url": "https://chroniclesync.xyz",
  "browser_specific_settings": {
    "safari": {
      "strict_min_version": "14.0"
    }
  }
}
EOF

# Create a browser-polyfill.js file to help with compatibility
echo "Creating browser-polyfill.js for compatibility..."
cat > "$DEST_DIR/browser-polyfill.js" << 'EOF'
(function(global, factory) {
  if (typeof define === "function" && define.amd) {
    define("webextension-polyfill", ["module"], factory);
  } else if (typeof exports !== "undefined") {
    factory(module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod);
    global.browser = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function(module) {
  /* webextension-polyfill - v0.10.0 - Simplified version */
  
  if (typeof globalThis.browser === "undefined" || Object.getPrototypeOf(globalThis.browser) !== Object.prototype) {
    const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
    
    const wrapAPIs = extensionAPIs => {
      const apiMetadata = {
        "alarms": {
          "clear": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "clearAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "get": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "bookmarks": {
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getChildren": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getRecent": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getSubTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTree": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "browserAction": {
          "disable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "enable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "getBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getBadgeText": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getPopup": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTitle": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "openPopup": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "setBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setBadgeText": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setIcon": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "setPopup": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setTitle": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "history": {
          "addUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "deleteRange": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getVisits": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "runtime": {
          "getBackgroundPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getPlatformInfo": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "openOptionsPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "requestUpdateCheck": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "sendMessage": {
            "minArgs": 1,
            "maxArgs": 3
          },
          "sendNativeMessage": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "setUninstallURL": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "storage": {
          "local": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          },
          "managed": {
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            }
          },
          "sync": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          }
        },
        "tabs": {
          "captureVisibleTab": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "detectLanguage": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "discard": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "duplicate": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "executeScript": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getCurrent": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getZoom": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getZoomSettings": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "goBack": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "goForward": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "highlight": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "insertCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "query": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "reload": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "sendMessage": {
            "minArgs": 2,
            "maxArgs": 3
          },
          "setZoom": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "setZoomSettings": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "update": {
            "minArgs": 1,
            "maxArgs": 2
          }
        }
      };

      const namespace = {
        runtime: {
          onMessage: {
            addListener(listener) {
              chrome.runtime.onMessage.addListener(listener);
            }
          },
          onConnect: {
            addListener(listener) {
              chrome.runtime.onConnect.addListener(listener);
            }
          }
        }
      };

      for (const [namespace, apiNamespaces] of Object.entries(apiMetadata)) {
        if (!(namespace in chrome)) {
          continue;
        }

        for (const [name, api] of Object.entries(apiNamespaces)) {
          const {
            minArgs,
            maxArgs,
            fallbackToNoCallback
          } = api;

          if (!(name in chrome[namespace])) {
            continue;
          }

          namespace[name] = (...args) => {
            return new Promise((resolve, reject) => {
              chrome[namespace][name](...args, (...callbackArgs) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else if (callbackArgs.length > 0) {
                  resolve(callbackArgs.length === 1 ? callbackArgs[0] : callbackArgs);
                } else {
                  resolve();
                }
              });
            });
          };
        }
      }

      return namespace;
    };

    module.exports = wrapAPIs(chrome);
  } else {
    module.exports = globalThis.browser;
  }
});
EOF

# Update HTML files to include the polyfill
for html_file in "$DEST_DIR"/*.html; do
  if [ -f "$html_file" ]; then
    echo "Updating $html_file to include browser-polyfill.js..."
    # Add the browser-polyfill.js script before the first script tag
    sed -i.bak 's/<script/<script src="browser-polyfill.js"><\/script>\n  <script/' "$html_file"
    # Remove the backup file
    rm "$html_file.bak"
  fi
done

echo "Extension resources copied and adapted for Safari successfully!"