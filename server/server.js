/**
 * Root Server Entry Point
 * Targets and runs the TypeScript entry file at ./src/index.ts
 */
const { spawn } = require('child_process');
const path = require('path');

const targetFile = path.resolve(__dirname, 'src', 'index.ts');

// Execute TypeScript file using tsx loader
const args = ['--import', 'tsx', targetFile, ...process.argv.slice(2)];

const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  cwd: __dirname,
  env: process.env,
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Forward termination signals to the child process
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill(signal);
    }
  });
});
