#!/usr/bin/env node
/* eslint-disable no-console */
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import fs from 'fs';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const ROOT_DIR = join(process.cwd());
const IPA_OUTPUT_DIR = join(ROOT_DIR, 'ipa-output');

/**
 * Verifies the generated IPA file
 * @param {string} ipaPath - Path to the IPA file (optional, will find it if not provided)
 * @returns {Promise<string>} - Path to the verified IPA file
 */
async function verifyIpaFile(ipaPath = null) {
  try {
    // Find the IPA file if not provided
    if (!ipaPath) {
      const findResult = await execAsync(`find ${IPA_OUTPUT_DIR} -name "*.ipa" | head -1`);
      ipaPath = findResult.stdout.trim();
    }

    if (!ipaPath || !fs.existsSync(ipaPath)) {
      console.error('Error: No IPA file was found');
      process.exit(1);
    }

    console.log(`Verifying generated IPA file: ${ipaPath}`);
    
    // Create verification directory
    const verifyDir = join(ROOT_DIR, 'ipa-verify');
    await mkdir(verifyDir, { recursive: true });
    
    // Unzip the IPA file
    try {
      await execAsync(`unzip -q -o "${ipaPath}" -d ${verifyDir}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (unzipError) {
      console.error('Error: Failed to unzip IPA file. The file may be corrupted or not a valid IPA.');
      console.log(`IPA file details: ${(await execAsync(`ls -la "${ipaPath}"`)).stdout}`);
      console.log(`File type: ${(await execAsync(`file "${ipaPath}"`)).stdout}`);
      process.exit(1);
    }
    
    // Check for Payload directory
    if (!fs.existsSync(join(verifyDir, 'Payload'))) {
      console.error('Error: Generated IPA file does not contain a Payload directory.');
      console.log(`IPA contents: ${(await execAsync(`ls -la ${verifyDir}`)).stdout}`);
      process.exit(1);
    }
    
    // List the contents of the Payload directory
    console.log('Generated IPA contents:');
    console.log((await execAsync(`ls -la ${verifyDir}/Payload/`)).stdout);
    
    console.log('IPA verification passed.');
    return ipaPath;
  } catch (error) {
    console.error('Error verifying IPA file:', error);
    process.exit(1);
  }
}

// If this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ipaPath = process.argv[2] || null;
  verifyIpaFile(ipaPath);
}

export { verifyIpaFile };