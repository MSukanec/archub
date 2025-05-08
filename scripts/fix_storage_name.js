import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the file we want to modify
const filePath = path.join(__dirname, '..', 'server/routes.ts');

// Read the file contents
let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences of "storage." with "dataStorage."
content = content.replace(/(?<!data)storage\./g, 'dataStorage.');

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Replaced all instances of "storage." with "dataStorage." in server/routes.ts');