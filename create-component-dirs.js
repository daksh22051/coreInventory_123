const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'app', 'components');

const dirs = [
  'ui',
  'auth',
];

dirs.forEach(d => {
  fs.mkdirSync(path.join(BASE, d), { recursive: true });
  console.log('Created: ' + path.join(BASE, d));
});

console.log('Directories created successfully!');
