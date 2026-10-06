import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const galleryDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(galleryDir, 'backend');

// Find python executable in backend .venv or workspace .venv
const venvCandidates = [
  path.join(backendDir, '.venv', 'Scripts', 'python.exe'),
  path.join(galleryDir, '..', '.venv', 'Scripts', 'python.exe'),
  path.join(galleryDir, '.venv', 'Scripts', 'python.exe'),
];

let pythonPath = venvCandidates.find((p) => fs.existsSync(p));
if (!pythonPath) {
  pythonPath = 'python';
}

console.log('\x1b[35m%s\x1b[0m', '════════════════════════════════════════════════════════════');
console.log('\x1b[35m%s\x1b[0m', '       THE K-SKIN GALLERY — UNIFIED DEV RUNNER              ');
console.log('\x1b[35m%s\x1b[0m', '════════════════════════════════════════════════════════════');
console.log(`\x1b[36m• Backend dir:\x1b[0m ${backendDir}`);
console.log(`\x1b[36m• Python env:\x1b[0m  ${pythonPath}`);
console.log(`\x1b[36m• Frontend dir:\x1b[0m ${galleryDir}`);
console.log('\x1b[35m%s\x1b[0m', '────────────────────────────────────────────────────────────\n');

// 1. Spawn FastAPI backend
const backend = spawn(
  pythonPath,
  ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'],
  { cwd: backendDir, shell: false, env: { ...process.env, PYTHONUNBUFFERED: '1' } }
);

backend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) console.log('\x1b[34m[BACKEND]\x1b[0m', line);
  }
});

backend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) console.log('\x1b[34m[BACKEND]\x1b[0m', line);
  }
});

backend.on('error', (err) => {
  console.error('\x1b[31m[BACKEND ERROR]\x1b[0m', err.message);
});

// 2. Spawn Vite frontend
const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const frontend = spawn(npxCmd, ['vite'], {
  cwd: galleryDir,
  shell: true,
  env: process.env,
});

frontend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) console.log('\x1b[32m[FRONTEND]\x1b[0m', line);
  }
});

frontend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) console.log('\x1b[33m[FRONTEND]\x1b[0m', line);
  }
});

frontend.on('error', (err) => {
  console.error('\x1b[31m[FRONTEND ERROR]\x1b[0m', err.message);
});

function cleanup() {
  console.log('\n\x1b[35mShutting down services...\x1b[0m');
  try {
    if (isWindows) {
      if (backend.pid) spawn('taskkill', ['/pid', backend.pid, '/f', '/t']);
      if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid, '/f', '/t']);
    } else {
      backend.kill('SIGTERM');
      frontend.kill('SIGTERM');
    }
  } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
