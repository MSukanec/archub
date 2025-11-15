#!/usr/bin/env node

// Simple dev script to run Vite
import { spawn } from 'child_process';

console.log('Starting Vite dev server...');

const vite = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
  process.exit(1);
});

vite.on('close', (code) => {
  if (code !== 0) {
    console.error(`Vite exited with code ${code}`);
  }
  process.exit(code);
});