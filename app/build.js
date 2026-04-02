import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { minify } from 'html-minifier-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Building BingeKit GUI (singlefile)...');
try {
  execSync('bun run build', { stdio: 'inherit', cwd: __dirname });
} catch (error) {
  console.error('Build failed', error.message);
  process.exit(1);
}

const distHtmlPath = path.join(__dirname, 'dist', 'index.html');
if (!fs.existsSync(distHtmlPath)) {
  console.error('Could not find dist/index.html');
  process.exit(1);
}

// Read index.html content
let htmlContent = fs.readFileSync(distHtmlPath, 'utf8');

// Minify HTML output
htmlContent = await minify(htmlContent, {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: true,
  removeAttributeQuotes: true,
  obfuscate: true,
});

// Calculate MD5 hash
const hash = crypto.createHash('md5').update(htmlContent).digest('hex');
console.log('Calculated MD5 Hash:', hash);

// Modify AHK appHash.ahk
const hashAhkPath = path.join(__dirname, '..', 'host', 'src', 'appHash.ahk');
fs.writeFileSync(hashAhkPath, `AppHash := "${hash}"\n`);
console.log('Updated appHash.ahk');

// Copy file to host/gui
const guiDirPath = path.join(__dirname, '..', 'host', 'gui');
if (!fs.existsSync(guiDirPath)) {
  fs.mkdirSync(guiDirPath, { recursive: true });
}

// Clean old files / assets folder
const guiAssetsPath = path.join(guiDirPath, 'assets');
if (fs.existsSync(guiAssetsPath)) {
  fs.rmSync(guiAssetsPath, { recursive: true, force: true });
}

// Remove old loose JS/CSS files if they exist
const looseFiles = fs.readdirSync(guiDirPath);
for (const file of looseFiles) {
  if (file.endsWith('.js') || file.endsWith('.css')) {
    fs.rmSync(path.join(guiDirPath, file), { force: true });
  }
}

// Copy the new index.html over
fs.writeFileSync(path.join(guiDirPath, 'index.html'), htmlContent);
console.log('Copied singlefile index.html to host/gui/');
console.log('Done!');
