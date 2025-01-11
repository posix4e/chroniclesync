const fs = require('fs');
const path = require('path');

// Simple HTML parser for script and style tags
function parseHTML(content) {
    const tags = [];
    let pos = 0;
    
    while (pos < content.length) {
        const startTag = content.indexOf('<', pos);
        if (startTag === -1) break;
        
        const endTag = content.indexOf('>', startTag);
        if (endTag === -1) break;
        
        const tag = content.slice(startTag, endTag + 1);
        if (tag.match(/<(script|style|link)\s|<(script|style)>/i)) {
            tags.push(tag);
        }
        
        pos = endTag + 1;
    }
    
    return tags;
}

// Parse CSP header from _headers file
function parseCSP(headersPath) {
    const headersContent = fs.readFileSync(headersPath, 'utf-8');
    const cspLine = headersContent
        .split('\n')
        .find(line => line.trim().startsWith('Content-Security-Policy:'));
    
    if (!cspLine) {
        throw new Error('No CSP header found in _headers file');
    }

    const cspValue = cspLine.split('Content-Security-Policy:')[1].trim();
    const directives = {};
    
    cspValue.split(';').forEach(directive => {
        const [name, ...values] = directive.trim().split(' ');
        directives[name] = values;
    });

    return directives;
}

// Collect all script sources from HTML and JS files
function collectSources(directory) {
    const sources = {
        'script-src': new Set(),
        'connect-src': new Set(),
        'style-src': new Set(),
        'font-src': new Set()
    };

    function processFile(filePath) {
        const ext = path.extname(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');

        if (ext === '.html') {
            const tags = parseHTML(content);
            for (const tag of tags) {
                if (tag.match(/<script/i)) {
                    const src = tag.match(/src=["']([^"']+)["']/);
                    if (src) {
                        if (src[1].startsWith('http')) {
                            sources['script-src'].add(new URL(src[1]).origin);
                        } else {
                            sources['script-src'].add("'self'");
                        }
                    } else {
                        sources['script-src'].add("'unsafe-inline'");
                    }
                }

                if (tag.match(/<style/i)) {
                    sources['style-src'].add("'unsafe-inline'");
                }

                if (tag.match(/<link/i) && tag.match(/rel=["']stylesheet["']/i)) {
                    const href = tag.match(/href=["']([^"']+)["']/);
                    if (href && href[1].startsWith('http')) {
                        sources['style-src'].add(new URL(href[1]).origin);
                    } else {
                        sources['style-src'].add("'self'");
                    }
                }
            }

            // Check for emoji usage in HTML
            if (/[\u{1F300}-\u{1F9FF}]/u.test(content)) {
                sources['font-src'].add("'self'");
                sources['font-src'].add('data:');
            }
        } else if (ext === '.js') {
            // Find API_URL definitions and hostname-based URLs
            const apiUrlPatterns = content.match(/if\s*\(\s*hostname\s*===?\s*['"`][^'"`]+['"`]\s*\)\s*{\s*return\s*['"`](https?:\/\/[^'"`]+)['"`]/g);
            if (apiUrlPatterns) {
                apiUrlPatterns.forEach(pattern => {
                    const url = pattern.match(/['"`](https?:\/\/[^'"`]+)['"`]/)[1];
                    try {
                        sources['connect-src'].add(new URL(url).origin);
                    } catch (e) {
                        console.warn(`Invalid URL found in API_URL pattern: ${url}`);
                    }
                });
            }

            // Find fetch calls with string literals
            const fetchRegex = /fetch\s*\(\s*['"](.*?)['"]/g;
            let match;
            while ((match = fetchRegex.exec(content)) !== null) {
                const url = match[1];
                if (url.startsWith('http')) {
                    sources['connect-src'].add(new URL(url).origin);
                }
            }

            // Find fetch calls with template literals using API_URL
            const apiUrlFetchRegex = /fetch\s*\(\s*`\${API_URL}[^`]*`/g;
            if (apiUrlFetchRegex.test(content)) {
                // Add all possible API URLs since they're determined at runtime
                sources['connect-src'].add('https://api.chroniclesync.xyz');
                sources['connect-src'].add('https://api-staging.chroniclesync.xyz');
                sources['connect-src'].add('http://localhost:8787');
            }

            // Find other template literal fetch calls
            const templateFetchRegex = /fetch\s*\(\s*`([^`]+)`/g;
            while ((match = templateFetchRegex.exec(content)) !== null) {
                const urlTemplate = match[1];
                // Extract base URLs from template literals
                const urlMatch = urlTemplate.match(/(https?:\/\/[^\/\${]+)/);
                if (urlMatch) {
                    sources['connect-src'].add(urlMatch[1]);
                }
            }

            // Find inline styles
            const styleRegex = /style\s*=\s*['"](.*?)['"]/g;
            while ((match = styleRegex.exec(content)) !== null) {
                sources['style-src'].add("'unsafe-inline'");
            }

            // Check for emoji usage in string literals and template literals
            const emojiRegex = /['"`][^'"`]*[\u{1F300}-\u{1F9FF}][^'"`]*['"`]/gu;
            if (emojiRegex.test(content)) {
                sources['font-src'].add("'self'");
                sources['font-src'].add('data:');
            }
        }
    }

    // Recursively process all files
    function processDirectory(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                processDirectory(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.html'))) {
                processFile(fullPath);
            }
        }
    }

    processDirectory(directory);
    return sources;
}

// Validate CSP against collected sources
function validateCSP(csp, sources) {
    const errors = [];

    for (const [directive, requiredSources] of Object.entries(sources)) {
        if (requiredSources.size === 0) continue;

        const allowedSources = new Set(csp[directive] || []);
        for (const source of requiredSources) {
            if (!allowedSources.has(source) && !allowedSources.has("'*'") && !allowedSources.has('*')) {
                errors.push(`${directive} requires ${source} but it's not allowed in CSP`);
            }
        }
    }

    return errors;
}

// Main validation function
function main() {
    try {
        // Paths relative to project root
        const headersPath = path.join(__dirname, '..', 'pages', 'src', '_headers');
        const srcPath = path.join(__dirname, '..', 'pages', 'src');

        console.log('Parsing CSP from _headers file...');
        const csp = parseCSP(headersPath);

        console.log('Collecting sources from source files...');
        const sources = collectSources(srcPath);

        console.log('\nRequired sources found:');
        for (const [directive, values] of Object.entries(sources)) {
            if (values.size > 0) {
                console.log(`${directive}:`, Array.from(values));
            }
        }

        console.log('\nValidating CSP...');
        const errors = validateCSP(csp, sources);

        if (errors.length > 0) {
            console.error('\nCSP Validation Errors:');
            errors.forEach(error => console.error('❌', error));
            process.exit(1);
        } else {
            console.log('✅ CSP validation passed!');
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();