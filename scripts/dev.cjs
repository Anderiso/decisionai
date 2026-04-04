/**
 * Runs the API and Expo together without breaking Metro's TTY:
 * Expo keeps stdin/stdout/stderr so QR codes and r / d shortcuts work.
 * Backend logs are prefixed with [backend].
 */
const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');

const root = path.join(__dirname, '..');

const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(root, 'backend'),
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
});

function pipeLines(stream, label) {
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  rl.on('line', (line) => {
    console.log(`[${label}] ${line}`);
  });
}

pipeLines(backend.stdout, 'backend');
pipeLines(backend.stderr, 'backend');

backend.on('error', (err) => {
  console.error('[backend] spawn error:', err.message);
});

const expo = spawn('npm', ['run', 'start'], {
  cwd: path.join(root, 'apps', 'mobile'),
  shell: true,
  stdio: 'inherit',
  env: process.env,
});

function shutdown() {
  backend.kill('SIGTERM');
  try {
    expo.kill('SIGTERM');
  } catch {
    /* ignore */
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

expo.on('exit', (code, signal) => {
  backend.kill('SIGTERM');
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});

backend.on('exit', (code, signal) => {
  if (signal) {
    return;
  }
  if (code !== 0 && code !== null) {
    console.error(`[backend] exited with code ${code}`);
    try {
      expo.kill('SIGTERM');
    } catch {
      /* ignore */
    }
    process.exit(code);
  }
});
