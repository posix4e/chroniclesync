#!/usr/bin/env node
/**
 * Generate Safari Files - A utility to generate Safari extension files from templates
 * 
 * This script generates the necessary files for Safari extension development
 * by replacing placeholders in template files with values from environment variables.
 */
/* eslint-disable no-console */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Default values (used if environment variables are not set)
const DEFAULT_APP_NAME = 'ChronicleSync';
const DEFAULT_BUNDLE_ID = 'com.chroniclesync.safari-extension';

// Get values from environment variables or use defaults
const APP_NAME = process.env.APP_NAME || DEFAULT_APP_NAME;
const BUNDLE_ID = process.env.BUNDLE_ID || DEFAULT_BUNDLE_ID;
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || '';
const APPLE_APP_ID = process.env.APPLE_APP_ID || '';

// Paths
const SCRIPTS_DIR = join(process.cwd(), 'scripts');
const TEMPLATES_DIR = join(SCRIPTS_DIR, 'templates');

// Template files
const TEMPLATES = [
  {
    template: join(TEMPLATES_DIR, 'safari-tools.js.template'),
    output: join(SCRIPTS_DIR, 'safari-tools.js'),
  },
  {
    template: join(TEMPLATES_DIR, 'export-options.plist.template'),
    output: join(SCRIPTS_DIR, 'export-options.plist'),
  }
];

/**
 * Replace placeholders in a template file with actual values
 * @param {string} templatePath - Path to the template file
 * @param {string} outputPath - Path to write the output file
 */
function processTemplate(templatePath, outputPath) {
  try {
    console.log(`Processing template: ${templatePath}`);
    
    // Read the template file
    let content = readFileSync(templatePath, 'utf8');
    
    // Replace placeholders with actual values
    content = content.replace(/\{\{APP_NAME\}\}/g, APP_NAME);
    content = content.replace(/\{\{BUNDLE_ID\}\}/g, BUNDLE_ID);
    content = content.replace(/\{\{APPLE_TEAM_ID\}\}/g, APPLE_TEAM_ID);
    content = content.replace(/\{\{APPLE_APP_ID\}\}/g, APPLE_APP_ID);
    
    // Write the output file
    writeFileSync(outputPath, content);
    
    // Make the output file executable if it's a script
    if (outputPath.endsWith('.js')) {
      execSync(`chmod +x "${outputPath}"`);
    }
    
    console.log(`Generated: ${outputPath}`);
  } catch (error) {
    console.error(`Error processing template ${templatePath}: ${error.message}`);
    process.exit(1);
  }
}

// Process all templates
console.log('Generating Safari extension files from templates...');
TEMPLATES.forEach(({ template, output }) => {
  processTemplate(template, output);
});

console.log('All files generated successfully!');