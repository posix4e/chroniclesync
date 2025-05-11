# Firefox Extension Module Support Notes

## Background

Firefox extensions using Manifest V2 require explicit module type declarations for ES modules, unlike Chrome's Manifest V3 which has built-in module support.

## Implementation Details

### HTML Script Tags

To ensure proper loading of ES modules in Firefox, all script tags that load JavaScript files containing import statements must include the `type="module"` attribute:

```html
<script type="module" src="your-script.js"></script>
```

### Content Scripts

Content scripts that use ES modules must also be declared with the `type: "module"` property in the manifest:

```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["content-script.js"],
    "run_at": "document_idle",
    "type": "module"
  }
]
```

## Files Modified

The following HTML files were updated to include the `type="module"` attribute:

- background.html
- devtools.html
- history.html
- popup.html
- settings.html

Additionally, the Firefox manifest was updated to specify that content scripts should be loaded as modules.

## Common Errors

Without these changes, Firefox will throw the following errors:

```
Uncaught SyntaxError: import declarations may only appear at top level of a module
```

This occurs when Firefox attempts to load JavaScript files as regular scripts rather than as ES modules.

```
Sync failed: Could not establish connection. Receiving end does not exist.
```

This can occur when content scripts fail to load properly due to module import errors, preventing proper communication between extension components.