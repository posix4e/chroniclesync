# Firefox Extension Module Support Notes

## Background

Firefox extensions using Manifest V2 require explicit module type declarations for ES modules, unlike Chrome's Manifest V3 which has built-in module support.

## Implementation Details

To ensure proper loading of ES modules in Firefox, all script tags that load JavaScript files containing import statements must include the `type="module"` attribute:

```html
<script type="module" src="your-script.js"></script>
```

## Files Modified

The following HTML files were updated to include the `type="module"` attribute:

- background.html
- devtools.html
- history.html
- popup.html
- settings.html

## Common Errors

Without this attribute, Firefox will throw the following error:

```
Uncaught SyntaxError: import declarations may only appear at top level of a module
```

This occurs because Firefox attempts to load the JavaScript file as a regular script rather than as an ES module.