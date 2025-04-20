# Asset Catalog Structure for ChronicleSync iOS App

This document outlines the asset catalog structure for the ChronicleSync iOS app and Safari extension.

## Main App Asset Catalogs

### Assets.xcassets
- **AppIcon.appiconset**: Contains the app icon in various sizes for different devices
- **AccentColor.colorset**: Contains the accent color used throughout the app

### Preview Content/Preview Assets.xcassets
- Contains assets used for SwiftUI previews in Xcode

## Safari Extension Asset Catalogs

### ChronicleSync Extension/Assets.xcassets
- Contains assets specific to the Safari extension

## File Structure

```
ChronicleSync/
├── Assets.xcassets/
│   ├── Contents.json
│   ├── AppIcon.appiconset/
│   │   └── Contents.json
│   └── AccentColor.colorset/
│       └── Contents.json
├── Preview Content/
│   └── Preview Assets.xcassets/
│       └── Contents.json
└── ChronicleSync Extension/
    └── Assets.xcassets/
        └── Contents.json
```

## Notes for Developers

- When adding new assets, make sure to place them in the appropriate asset catalog
- For app icons, use the AppIcon.appiconset in the main Assets.xcassets
- For extension-specific assets, use the ChronicleSync Extension/Assets.xcassets
- The AccentColor.colorset defines the primary brand color used throughout the app