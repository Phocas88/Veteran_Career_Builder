import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const output = path.join(root, '.firebase-public');

const excludedDirs = new Set([
  '.git',
  '.github',
  '.claude',
  '.firebase',
  '.firebase-public',
  'api',
  'reports',
  'scripts',
  'node_modules',
]);

const allowedExtensions = new Set([
  '.html',
  '.js',
  '.css',
  '.json',
  '.xml',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.webmanifest',
  '.pdf',
]);

const exactFiles = new Set([
  'ads.txt',
  'robots.txt',
  'sitemap.xml',
]);

const excludedFiles = new Set([
  '.firebaserc',
  'CODEX_HANDOFF.md',
  'firebase.json',
  'package-lock.json',
  'package.json',
]);

function shouldCopy(relativePath, dirent) {
  const normalized = relativePath.split(path.sep).join('/');
  const parts = normalized.split('/');

  if (parts.some(part => excludedDirs.has(part))) return false;
  if (dirent.isDirectory()) return true;

  const base = path.basename(normalized);
  if (excludedFiles.has(base)) return false;
  if (exactFiles.has(base)) return true;

  return allowedExtensions.has(path.extname(base).toLowerCase());
}

function copyTree(sourceDir, targetDir, relativeBase = '') {
  for (const dirent of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeBase, dirent.name);
    if (!shouldCopy(relativePath, dirent)) continue;

    const sourcePath = path.join(sourceDir, dirent.name);
    const targetPath = path.join(targetDir, dirent.name);

    if (dirent.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      copyTree(sourcePath, targetPath, relativePath);
    } else if (dirent.isFile()) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
copyTree(root, output);

const required = ['index.html', 'app.html', 'app.js', '404.html'];
for (const file of required) {
  if (!fs.existsSync(path.join(output, file))) {
    throw new Error(`Hosting build is missing required file: ${file}`);
  }
}

console.log(`Firebase hosting directory built at ${output}`);
