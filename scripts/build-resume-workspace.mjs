import { spawnSync } from 'node:child_process';
import { cpSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'resume-workspace-src');
const output = path.join(root, 'resumereview');
const legacy = path.join(root, 'resume-workspace');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
for (const args of [['ci', '--include=dev', '--no-audit', '--no-fund'], ['run', 'check'], ['run', 'build']]) {
  const result = spawnSync(npm, args, { cwd: source, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) throw new Error('Resume workspace build failed.');
}
rmSync(output, { recursive: true, force: true });
cpSync(path.join(source, 'public'), output, { recursive: true });
const index = path.join(output, 'index.html');
writeFileSync(index, readFileSync(index, 'utf8').replace('</head>', '<link rel="canonical" href="https://veterancareerpath.com/resumereview/">\n</head>'));
for (const file of ['index.html', 'workspace.js', 'privacy.html', 'vendor/pdf.mjs', 'vendor/pdf.worker.mjs', 'vendor/pdf-export.mjs', 'vendor/word-export.mjs']) {
  if (!existsSync(path.join(output, file))) throw new Error(`Resume workspace is missing ${file}`);
}
// Keep old links, in-flight imports and existing Stripe return URLs working.
rmSync(legacy, { recursive: true, force: true });
cpSync(output, legacy, { recursive: true });
console.log('Built /resumereview with self-hosted dependencies and /resume-workspace compatibility.');
