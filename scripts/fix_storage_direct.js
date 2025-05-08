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

// Regular expression to find "storage" that's not part of "dataStorage" or "multerStorage" or inside a string
// This is a simplified version that will work for most cases
content = content.replace(/\b(?<!data|multer)storage\b(?![\w\s]*['":])/g, 'dataStorage');

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Replaced direct instances of "storage" with "dataStorage" in server/routes.ts');