const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSRI(filePath) {
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha384').update(content).digest('base64');
    return `sha384-${hash}`;
}

function updateHTML(htmlPath, sriMap) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    for (const [file, hash] of Object.entries(sriMap)) {
        const placeholder = `integrity="sha384-HASH_TO_BE_GENERATED"`;
        const replacement = `integrity="${hash}"`;
        html = html.replace(placeholder, replacement);
    }
    
    fs.writeFileSync(htmlPath, html);
}

// Generate SRI hashes for JS files
const jsDir = path.join(__dirname, '../src/js');
const htmlPath = path.join(__dirname, '../src/index.html');

const sriMap = {
    'js/db.js': generateSRI(path.join(jsDir, 'db.js')),
    'js/main.js': generateSRI(path.join(jsDir, 'main.js'))
};

console.log('Generated SRI hashes:', sriMap);
updateHTML(htmlPath, sriMap);
console.log('Updated index.html with SRI hashes');
