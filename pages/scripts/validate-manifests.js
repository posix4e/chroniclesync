import fs from 'fs';
import path from 'path';

// Read manifests
const manifestV3 = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/extension/manifest.json'), 'utf8'));
const manifestV2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/extension/manifest.v2.json'), 'utf8'));

// Validate common fields
const requiredFields = ['name', 'version', 'description', 'icons'];
const requiredPermissions = ['history', 'storage'];
const requiredIcons = ['16', '48', '128'];

function validateManifest(manifest, version) {
  console.log(`\nValidating manifest v${version}...`);
    
  // Check required fields
  requiredFields.forEach(field => {
    if (!manifest[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  });

  // Check permissions
  const permissions = manifest.permissions || [];
  requiredPermissions.forEach(perm => {
    if (!permissions.includes(perm)) {
      throw new Error(`Missing required permission: ${perm}`);
    }
  });

  // Check icons
  const icons = manifest.icons || {};
  requiredIcons.forEach(size => {
    if (!icons[size]) {
      throw new Error(`Missing required icon size: ${size}`);
    }
    const iconPath = path.join(__dirname, '../src/extension', icons[size]);
    if (!fs.existsSync(iconPath)) {
      throw new Error(`Icon file not found: ${icons[size]}`);
    }
  });

  // Version specific checks
  if (version === 3) {
    if (!manifest.host_permissions) {
      throw new Error('Missing host_permissions in v3 manifest');
    }
    if (!manifest.background?.service_worker) {
      throw new Error('Missing service_worker in background section');
    }
  } else if (version === 2) {
    if (!manifest.browser_specific_settings?.gecko?.id) {
      throw new Error('Missing Firefox extension ID in browser_specific_settings');
    }
    if (!manifest.background?.scripts) {
      throw new Error('Missing scripts in background section');
    }
  }

  console.log(`✓ Manifest v${version} is valid`);
}

try {
  validateManifest(manifestV3, 3);
  validateManifest(manifestV2, 2);
  console.log('\n✓ All manifests are valid');
  process.exit(0);
} catch (error) {
  console.error('\n✗ Validation failed:', error.message);
  process.exit(1);
}