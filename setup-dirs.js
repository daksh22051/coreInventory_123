const fs = require('fs');
const path = require('path');

const BASE = __dirname;

const dirs = [
  'backend/config',
  'backend/controllers',
  'backend/middleware',
  'backend/models',
  'backend/routes',
  'backend/services',
  'backend/utils',
  'frontend',
];

dirs.forEach(d => {
  const full = path.join(BASE, d);
  fs.mkdirSync(full, { recursive: true });
  console.log('Created:', full);
});

console.log('\nAll directories created! You can now continue.');
